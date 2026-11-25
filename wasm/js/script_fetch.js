// TODO: move to runtime/
// Sends script fetch() requests with the page's fetch(), or through a proxy
// page in a hidden iframe when proxyUrl is set.
(function () {
  const PROTOCOL = "script-fetch-proxy";
  const VERSION = 1;
  // How long the proxy page gets to load and answer the first request.
  const HANDSHAKE_TIMEOUT_MS = 10000;

  // Most a proxy response's header names and values may add up to.
  const MAX_PROXY_HEADER_BYTES = 256 * 1024;

  // Most body bytes handed to the runtime in one piece.
  const MAX_RUN_BYTES = 1 << 20;

  let proxyUrl = null;
  // Lower-cased hosts: "api.example.com", "*.example.com" for any subdomain,
  // or "*" for any host. null allows any host.
  let allowedHosts = null;
  // Whether scripts may fetch() any URL, and where rive-cloud: requests go
  // ("url namespace"), or null without an endpoint.
  let generalFetch = false;
  let cloudEndpoint = null;
  // Whether any file has an endpoint of its own, which needs the transport
  // whatever the page's settings.
  let fileCloud = false;
  // A promise of this origin's device key, {privateKey, jwk}, once asked for.
  let deviceKey = null;

  let frame = null;
  // The channel offered to the proxy, and the one it accepted.
  let offered = null;
  let port = null;
  let handshakeTimer = 0;
  // Proxy requests waiting for the handshake, as [message, transfer].
  let queued = [];
  // Requests not yet settled or aborted, by id; controller is set on direct
  // requests only, and resume while the runtime wants no more of the body.
  const pending = new Map();

  function heap() {
    return new Uint8Array(wasmMemory.buffer);
  }

  // [ptr, byte length]; ptr is 0 when the heap has no room.
  function copyString(text) {
    const length = lengthBytesUTF8(text);
    const ptr = _malloc(length + 1);
    if (ptr) {
      stringToUTF8(text, ptr, length + 1);
    }
    return [ptr, length];
  }

  function release(ptrs) {
    for (let i = 0; i < ptrs.length; i++) {
      _free(ptrs[i]);
    }
  }

  // The runtime drops outcomes for ids it already settled or forgot.
  function reportError(id, code, message) {
    const codeString = copyString(code);
    const messageString = copyString(message);
    // Without room for even these, it still fails, with no code or message.
    const told = codeString[0] && messageString[0];
    Module["_riveScriptFetchFail"](
      id,
      told ? codeString[0] : 0,
      told ? codeString[1] : 0,
      told ? messageString[0] : 0,
      told ? messageString[1] : 0,
    );
    release([codeString[0], messageString[0]]);
  }

  // Lets a body the runtime paused carry on, or see that it is over.
  function wake(entry) {
    if (entry && entry.resume) {
      const resume = entry.resume;
      entry.resume = null;
      resume();
    }
  }

  // Forgets `id`; false when it was not pending.
  function settle(id) {
    const entry = pending.get(id);
    if (!entry) {
      return false;
    }
    clearTimeout(entry.timer);
    pending.delete(id);
    wake(entry);
    return true;
  }

  function fail(id, code, message) {
    if (settle(id)) {
      reportError(id, code, message);
    }
  }

  // The request a response no longer fits in memory for.
  function outOfMemory(id, entry) {
    fail(id, "tooLarge", "the response does not fit in memory");
    cancel(id, entry);
    return false;
  }

  // Reports the status and `headers`, as [[name, value]], ahead of the body.
  // False when the request is over.
  function respond(id, entry, status, statusText, url, headers) {
    if (pending.get(id) !== entry || entry.responded) {
      return false;
    }
    entry.responded = true;
    // None of these can hold a NUL: the browser's Headers refuse one.
    const fields = [String(statusText), String(url)];
    for (let i = 0; i < headers.length; i++) {
      fields.push(String(headers[i][0]), String(headers[i][1]));
    }
    const meta = copyString(fields.join("\0"));
    if (!meta[0]) {
      return outOfMemory(id, entry);
    }
    const taken = Module["_riveScriptFetchRespond"](
      id,
      status | 0,
      meta[0],
      meta[1],
    );
    _free(meta[0]);
    // The runtime refused it, and failed the request itself.
    if (!taken && settle(id)) {
      cancel(id, entry);
    }
    // A body its script reads as it arrives is no longer timed.
    if (taken === 2) {
      clearTimeout(entry.timer);
    }
    return pending.get(id) === entry;
  }

  // Hands the runtime more of the body, waiting whenever it asks for no more
  // yet. False when the request is over.
  async function deliver(id, entry, bytes) {
    for (let at = 0; at < bytes.byteLength; at += MAX_RUN_BYTES) {
      if (pending.get(id) !== entry) {
        return false;
      }
      const run = bytes.subarray(at, at + MAX_RUN_BYTES);
      const ptr = _malloc(run.byteLength);
      if (!ptr) {
        return outOfMemory(id, entry);
      }
      heap().set(run, ptr);
      const more = Module["_riveScriptFetchReceive"](id, ptr, run.byteLength);
      _free(ptr);
      if (!more && pending.get(id) === entry) {
        await new Promise(function (resolve) {
          entry.resume = resolve;
        });
      }
    }
    return pending.get(id) === entry;
  }

  function finish(id) {
    if (settle(id)) {
      Module["_riveScriptFetchFinish"](id);
    }
  }

  function tooLarge(maxBodyBytes) {
    return {
      code: "tooLarge",
      message: "the response body is larger than " + maxBodyBytes + " bytes",
    };
  }

  // "example.com." names the same host as "example.com".
  function withoutTrailingDot(host) {
    return host.charAt(host.length - 1) === "." ? host.slice(0, -1) : host;
  }

  // Why `url`'s host is refused, or null. The page's own host is refused
  // unless allowedHosts names it; the runtime checks every host against
  // allowedHosts itself.
  function hostRefusal(url) {
    let host;
    try {
      host = withoutTrailingDot(new URL(url).hostname);
    } catch (e) {
      return "the URL is not valid";
    }
    if (
      host === withoutTrailingDot(location.hostname) &&
      !(
        allowedHosts &&
        allowedHosts.some(function (entry) {
          return withoutTrailingDot(entry) === host;
        })
      )
    ) {
      return "scripts cannot fetch this page's own host unless allowedHosts names it";
    }
    return null;
  }

  // Direct transport.

  // A cloud request as the engine's wrapped form: a POST with a text/plain
  // body, which a browser sends without first asking the engine (a CORS
  // preflight, a round trip for each URL). The method, the token and the key
  // go in the body; the engine unwraps it before routing
  // (packages/cloud_engine/include/cloud_engine/wrapped_request.hpp).
  function wrapForCloud(request) {
    const method = request["method"];
    let wrapper = '{"method":' + JSON.stringify(method);
    // The first of each, as the engine reads a plain request's headers.
    let token = null;
    let key = null;
    const headers = request["headers"];
    for (let i = 0; i < headers.length; i++) {
      const name = headers[i][0].toLowerCase();
      const value = headers[i][1];
      if (token === null && name === "authorization" &&
          value.lastIndexOf("Bearer ", 0) === 0) {
        token = value.slice(7);
      } else if (key === null && name === "idempotency-key") {
        key = value;
      }
    }
    if (token !== null) {
      wrapper += ',"token":' + JSON.stringify(token);
    }
    if (key !== null) {
      wrapper += ',"idempotencyKey":' + JSON.stringify(key);
    }
    // Only a PUT or POST carries a body to the engine, which ignores any
    // other's.
    const body = method === "PUT" || method === "POST" ? request["body"] : null;
    if (body && body.byteLength) {
      let text;
      try {
        text = new TextDecoder("utf-8", { "fatal": true }).decode(body);
        // Checked whole, then sent as it is: parsing and writing it again
        // would round integers past 2^53.
        JSON.parse(text);
      } catch (e) {
        throw { code: "policy", message: "a rive-cloud: body is JSON" };
      }
      wrapper += ',"body":' + text;
    }
    return {
      "method": "POST",
      "headers": [["content-type", "text/plain;charset=UTF-8"]],
      "body": wrapper + "}",
    };
  }

  async function sendDirect(id, entry, request) {
    try {
      const sent = request["cloud"] ? wrapForCloud(request) : request;
      const response = await fetch(request["url"], {
        "method": sent["method"],
        "headers": sent["headers"],
        "body": sent["body"],
        "mode": "cors",
        "credentials": "omit",
        "cache": "no-store",
        // A redirect comes back unfollowed and opaque.
        "redirect": "manual",
        "referrerPolicy": "no-referrer",
        "signal": entry.controller.signal,
      });
      if (response.type === "opaqueredirect") {
        throw {
          code: "policy",
          message:
            "the server answered with a redirect, which scripts on the web " +
            "cannot follow; fetch the URL it redirects to instead",
        };
      }
      const list = [];
      response.headers.forEach(function (value, name) {
        list.push([name, value]);
      });
      if (
        !respond(
          id,
          entry,
          response.status,
          response.statusText,
          // The runtime re-checks a final URL against the fetch() rules,
          // which the host's own engine address need not meet (http: in
          // development).
          request["cloud"] ? "" : response.url || "",
          list,
        )
      ) {
        return;
      }
      if (!response.body) {
        const whole = new Uint8Array(await response.arrayBuffer());
        if (!(await deliver(id, entry, whole))) {
          return;
        }
      } else {
        const reader = response.body.getReader();
        for (;;) {
          const step = await reader.read();
          if (step.done) {
            break;
          }
          if (!(await deliver(id, entry, step.value))) {
            reader.cancel().catch(function () {});
            return;
          }
        }
      }
      finish(id);
    } catch (thrown) {
      // A timed out or aborted request is already settled, so fail() ignores it.
      if (thrown && typeof thrown.code === "string") {
        fail(id, thrown.code, thrown.message);
      } else {
        // The browser keeps the cause to itself: DNS, TLS, a refused
        // connection, CSP and a missing CORS header all look the same.
        fail(
          id,
          "network",
          "the request failed (DNS, TLS, connection, CSP or a missing CORS " +
            "header on the server)",
        );
      }
    }
  }

  // Proxy transport.

  // Asks the proxy for a streamed body's next run.
  function readOn(id, entry) {
    if (port && pending.get(id) === entry) {
      entry.runOwed = true;
      port.postMessage({ "type": "read", "id": id });
    }
  }

  // Takes a request back from the queue, or tells the proxy to stop it.
  function withdraw(id) {
    for (let i = 0; i < queued.length; i++) {
      if (queued[i][0]["id"] === id) {
        queued.splice(i, 1);
        return;
      }
    }
    if (port) {
      port.postMessage({ "type": "abort", "id": id });
    }
  }

  // Stops a request that was already settled.
  function cancel(id, entry) {
    if (entry.controller) {
      entry.controller.abort();
    } else {
      withdraw(id);
    }
  }

  // Fails the proxy requests already sent, not those waiting for the handshake.
  function failSent(message) {
    const waiting = new Set(
      queued.map(function (item) {
        return item[0]["id"];
      }),
    );
    pending.forEach(function (entry, id) {
      if (!entry.controller && !waiting.has(id)) {
        fail(id, "network", message);
      }
    });
  }

  // Fails a proxy request and stops what the proxy may still be sending.
  function refuse(id, code, message) {
    fail(id, code, message);
    withdraw(id);
  }

  // Drops the iframe and fails every proxy request still waiting on it; the
  // next one starts over with a fresh iframe.
  function reset(message) {
    clearTimeout(handshakeTimer);
    if (frame) {
      frame.remove();
    }
    if (offered) {
      offered.close();
    }
    frame = null;
    offered = null;
    port = null;
    queued = [];
    pending.forEach(function (entry, id) {
      if (!entry.controller) {
        fail(id, "network", message);
      }
    });
  }

  function onProxyMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }
    const type = data["type"];
    if (type === "ready") {
      clearTimeout(handshakeTimer);
      port = offered;
      const waiting = queued;
      queued = [];
      for (let i = 0; i < waiting.length; i++) {
        const message = waiting[i][0];
        const entry = pending.get(message["id"]);
        if (!entry) {
          continue;
        }
        // Only what the handshake left of the request's time.
        message["timeoutMs"] = Math.max(
          1,
          Math.ceil(entry.deadline - performance.now()),
        );
        port.postMessage(message, waiting[i][1]);
      }
    } else if (type === "response") {
      const id = data["id"];
      const request = pending.get(id);
      // A direct request (rive-cloud:, or any without a proxy when it began)
      // is the page's own: the proxy never settles it. A second answer must
      // not fail a body already being handed over.
      if (!request || request.controller || request.responded) {
        return;
      }
      if (!wellFormed(data)) {
        refuse(id, "network", "the script fetch proxy sent a malformed response");
        return;
      }
      const body = data["body"];
      // A proxy that streams sends the body after the response.
      request.streamed = body === undefined;
      if (body && body.byteLength > request.maxBodyBytes) {
        const error = tooLarge(request.maxBodyBytes);
        fail(id, error.code, error.message);
        return;
      }
      // The proxy may have followed a redirect.
      const landed = hostRefusal(data["url"]);
      if (landed) {
        refuse(id, "policy", landed);
        return;
      }
      if (
        respond(
          id,
          request,
          data["status"],
          typeof data["statusText"] === "string" ? data["statusText"] : "",
          data["url"],
          data["headers"],
        )
      ) {
        if (request.streamed) {
          readOn(id, request);
        } else {
          deliverProxied(id, request, body, finish);
        }
      }
    } else if (type === "body" || type === "end") {
      const id = data["id"];
      const request = pending.get(id);
      // Only the run asked for, so runs never overlap.
      if (!request || !request.streamed || !request.runOwed) {
        return;
      }
      request.runOwed = false;
      if (type === "end") {
        finish(id);
      } else if (
        Object.prototype.toString.call(data["body"]) !== "[object ArrayBuffer]"
      ) {
        refuse(id, "network", "the script fetch proxy sent a malformed response");
      } else {
        deliverProxied(id, request, data["body"], function () {
          readOn(id, request);
        });
      }
    } else if (type === "error") {
      const request = pending.get(data["id"]);
      if (data["id"] === 0) {
        reset(String(data["message"]));
      } else if (request && !request.controller) {
        fail(data["id"], String(data["code"]), String(data["message"]));
      }
    }
  }

  // Hands the runtime `body` from the proxy, then calls `next` unless the
  // request ended meanwhile.
  function deliverProxied(id, entry, body, next) {
    deliver(id, entry, new Uint8Array(body || 0)).then(
      function (alive) {
        if (alive) {
          next(id);
        }
      },
      function () {
        fail(id, "network", "the response's body could not be read");
      },
    );
  }

  // A proxy response needs a three-digit status, the URL it came from,
  // [name, value] string header pairs within MAX_PROXY_HEADER_BYTES, and an
  // ArrayBuffer body or none. No string may hold a NUL, which separates fields
  // on the way into wasm.
  function wellFormed(data) {
    const status = data["status"];
    const url = data["url"];
    const statusText = data["statusText"];
    const headers = data["headers"];
    const body = data["body"];
    if (
      !Number.isInteger(status) ||
      status < 100 ||
      status > 999 ||
      typeof url !== "string" ||
      !url ||
      url.indexOf("\0") !== -1 ||
      (typeof statusText === "string" && statusText.indexOf("\0") !== -1) ||
      !Array.isArray(headers)
    ) {
      return false;
    }
    if (
      body != null &&
      Object.prototype.toString.call(body) !== "[object ArrayBuffer]"
    ) {
      return false;
    }
    let bytes = 0;
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (
        !Array.isArray(header) ||
        typeof header[0] !== "string" ||
        typeof header[1] !== "string" ||
        header[0].indexOf("\0") !== -1 ||
        header[1].indexOf("\0") !== -1
      ) {
        return false;
      }
      // As copied into wasm: UTF-8, plus a separator after each.
      bytes += lengthBytesUTF8(header[0]) + lengthBytesUTF8(header[1]) + 2;
      if (bytes > MAX_PROXY_HEADER_BYTES) {
        return false;
      }
    }
    return true;
  }

  function waitForHandshake(origin) {
    clearTimeout(handshakeTimer);
    handshakeTimer = setTimeout(function () {
      reset("the script fetch proxy at " + origin + " did not answer");
    }, HANDSHAKE_TIMEOUT_MS);
  }

  function connect() {
    // Resolved as the iframe resolves its src, so the handshake targets the
    // origin that actually loads.
    const resolved = new URL(proxyUrl, document.baseURI);
    const origin = resolved.origin;
    frame = document.createElement("iframe");
    frame.src = resolved.href;
    // Its own origin, but nothing else: no popups, top navigation or forms.
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.display = "none";
    frame.addEventListener("load", function () {
      // A load that is not the proxy (an error page, a CSP block) never
      // receives this, since it is addressed to the proxy's origin only.
      if (offered) {
        offered.close();
        failSent("the script fetch proxy reloaded");
      }
      const channel = new MessageChannel();
      offered = channel.port1;
      offered.onmessage = onProxyMessage;
      port = null;
      // A reload after the handshake needs a new one in as much time.
      waitForHandshake(origin);
      frame.contentWindow.postMessage(
        { "rive": PROTOCOL, "type": "connect", "version": VERSION },
        origin,
        [channel.port2],
      );
    });
    waitForHandshake(origin);
    (document.body || document.documentElement).appendChild(frame);
  }

  function sendProxy(message, transfer) {
    if (port) {
      port.postMessage(message, transfer);
      return;
    }
    queued.push([message, transfer]);
    if (!frame) {
      try {
        connect();
      } catch (e) {
        reset("the script fetch proxy could not be loaded: " + e);
      }
    }
  }

  Module["scriptFetch"] = {
    "start": function (id, url, method, headers, body, timeoutMs, maxBodyBytes, cloud) {
      // `cloud` requests go to the host's own endpoint (rive-cloud: and its
      // hellos), which allowedHosts does not govern. They never go through
      // the proxy, whose origin is not the one the engine binds this page's
      // token to.
      if (cloud) {
        // Made on the first cloud request, so a page whose scripts never use
        // the cloud stores nothing; ready before the challenge comes back.
        loadDeviceKeyOnce();
      }
      const refusal = cloud ? null : hostRefusal(url);
      if (refusal) {
        reportError(id, "policy", refusal);
        return;
      }
      const entry = {
        deadline: performance.now() + timeoutMs,
        maxBodyBytes: maxBodyBytes,
        timer: 0,
        controller: proxyUrl && !cloud ? null : new AbortController(),
      };
      pending.set(id, entry);
      entry.timer = setTimeout(function () {
        fail(id, "timeout", "no response before the timeout");
        cancel(id, entry);
      }, timeoutMs);
      const request = {
        "type": "fetch",
        "id": id,
        "url": url,
        "method": method,
        "headers": headers,
        "body": body,
        "timeoutMs": timeoutMs,
        "maxBodyBytes": maxBodyBytes,
        "cloud": cloud,
        "stream": true,
      };
      if (entry.controller) {
        sendDirect(id, entry, request);
      } else {
        sendProxy(request, body ? [body] : []);
      }
    },
    "abort": function (id) {
      const entry = pending.get(id);
      if (settle(id)) {
        cancel(id, entry);
      }
    },
    "resume": function (id) {
      wake(pending.get(id));
    },
  };

  // null disables script fetch.
  Module["configureScriptFetch"] = function (options) {
    const url = (options && options["proxyUrl"]) || null;
    if (url !== proxyUrl) {
      reset("the script fetch proxy changed");
      proxyUrl = url;
    }
    const hosts = options && options["allowedHosts"];
    // An empty list allows no host.
    // The list crosses to the runtime NUL separated, so an entry holding a
    // NUL, which names no host, is dropped rather than split into others.
    allowedHosts = hosts
      ? hosts
          .map(function (host) {
            // The runtime drops a trailing dot itself, after it checks for
            // "*", so "*." can't become "*" here.
            return String(host).trim().toLowerCase();
          })
          .filter(function (host) {
            return host.indexOf("\0") === -1;
          })
      : null;
    generalFetch = !!options;
    if (options) {
      // Omitted allows every host. Without room for the list, fetch() stays
      // off rather than running on the last one.
      const list = copyString((allowedHosts || ["*"]).join("\0"));
      if (list[0]) {
        Module["_riveScriptFetchSetLimits"](
          options["maxResponseBytes"] >>> 0,
          list[0],
          list[1],
        );
        release([list[0]]);
      } else {
        generalFetch = false;
      }
    }
    applyEnabled();
  };

  // The transport is on for fetch(), for rive-cloud:, or for both.
  function applyEnabled() {
    Module["_riveScriptFetchSetGeneral"](generalFetch ? 1 : 0);
    Module["_riveScriptFetchSetEnabled"](
      generalFetch || cloudEndpoint || fileCloud ? 1 : 0,
    );
  }

  // Rive Cloud. The page's player is a P-256 key made on first use and kept
  // in this origin's IndexedDB. Its private half cannot be exported, so it
  // never reaches a script or this code; clearing the site's data makes a
  // new player.

  function idb(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function loadDeviceKey() {
    const open = indexedDB.open("rive-cloud", 1);
    open.onupgradeneeded = function () {
      open.result.createObjectStore("keys");
    };
    const db = await idb(open);
    try {
      const keys = function (mode) {
        return db.transaction("keys", mode).objectStore("keys");
      };
      const kept = await idb(keys("readonly").get("device"));
      if (kept) {
        return kept;
      }
      const pair = await crypto.subtle.generateKey(
        { "name": "ECDSA", "namedCurve": "P-256" },
        false,
        ["sign"],
      );
      const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
      const made = {
        "privateKey": pair.privateKey,
        "jwk": JSON.stringify({
          "kty": "EC",
          "crv": "P-256",
          "x": pub["x"],
          "y": pub["y"],
        }),
      };
      try {
        // Kept only once the write has committed: a key used before then
        // could be lost to an aborted transaction, and the player with it.
        const store = keys("readwrite");
        const committed = new Promise(function (resolve, reject) {
          store.transaction.oncomplete = resolve;
          store.transaction.onabort = function () {
            reject(store.transaction.error);
          };
        });
        // add()'s own failure is the one reported; this one is then moot.
        committed.catch(function () {});
        await idb(store.add(made, "device"));
        await committed;
        return made;
      } catch (e) {
        // Another tab stored one first, and the first stored is the player.
        const first = await idb(keys("readonly").get("device"));
        if (!first) {
          throw e;
        }
        return first;
      }
    } finally {
      db.close();
    }
  }

  function base64url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function loadDeviceKeyOnce() {
    if (!deviceKey) {
      const loading = loadDeviceKey();
      deviceKey = loading;
      // A failure is tried again at the next hello.
      loading.catch(function () {
        if (deviceKey === loading) {
          deviceKey = null;
        }
      });
    }
    return deviceKey;
  }

  async function sign(message) {
    const key = await loadDeviceKeyOnce();
    // WebCrypto's ECDSA signature is already raw r||s.
    const signature = await crypto.subtle.sign(
      { "name": "ECDSA", "hash": "SHA-256" },
      key["privateKey"],
      new TextEncoder().encode(message),
    );
    return [key["jwk"], base64url(new Uint8Array(signature))];
  }

  function reportSigned(done, jwk, signature) {
    const jwkString = copyString(jwk || "");
    const signatureString = copyString(signature || "");
    const ok = !!jwk && jwkString[0] && signatureString[0];
    Module["_riveScriptCloudSigned"](
      done,
      ok ? 1 : 0,
      jwkString[0],
      jwkString[1],
      signatureString[0],
      signatureString[1],
    );
    release([jwkString[0], signatureString[0]]);
  }

  Module["scriptCloud"] = {
    // `done` is the runtime's handle for the hello waiting on this signature.
    "sign": function (done, message) {
      sign(message).then(
        function (signed) {
          reportSigned(done, signed[0], signed[1]);
        },
        function (e) {
          console.warn("Rive Cloud: the device key could not sign: " + e);
          reportSigned(done, null, null);
        },
      );
    },
  };

  // Calls `fn` with `texts` copied into the heap as C strings, then frees them.
  function withStrings(texts, fn) {
    const copies = texts.map(copyString);
    try {
      return fn.apply(
        null,
        copies.map(function (copy) {
          return copy[0];
        }),
      );
    } finally {
      release(
        copies.map(function (copy) {
          return copy[0];
        }),
      );
    }
  }

  // An endpoint for one file to own: {id, refused}, where refused says why the
  // runtime turned it off, or is null. Pass id to load().
  Module["addScriptCloud"] = function (options) {
    const id = withStrings(
      [String(options["url"]), String(options["namespace"])],
      Module["_riveScriptCloudAdd"],
    );
    const refused = Module["_riveScriptCloudRefusal"]();
    fileCloud = true;
    applyEnabled();
    return { "id": id >>> 0, "refused": refused ? UTF8ToString(refused) : null };
  };

  // {url, namespace}, or null to turn rive-cloud: off. Returns why the
  // runtime refused them, or null.
  Module["configureScriptCloud"] = function (options) {
    const url = options ? String(options["url"]) : "";
    const namespace = options ? String(options["namespace"]) : "";
    const endpoint = options ? url + " " + namespace : null;
    if (endpoint === cloudEndpoint) {
      // Naming the same endpoint again would only drop the player's token.
      return null;
    }
    const refused = withStrings([url, namespace], Module["_riveScriptCloudSet"]);
    cloudEndpoint = refused ? null : endpoint;
    applyEnabled();
    return refused ? UTF8ToString(refused) : null;
  };
})();
