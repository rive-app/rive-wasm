// TODO: move to runtime/
// Sends script fetch() requests with the page's fetch(), or through a proxy
// page in a hidden iframe when proxyUrl is set.
(function () {
  const PROTOCOL = "script-fetch-proxy";
  const VERSION = 1;
  // How long the proxy page gets to load and answer the first request.
  const HANDSHAKE_TIMEOUT_MS = 10000;

  // https://fetch.spec.whatwg.org/#null-body-status
  const NULL_BODY_STATUSES = [101, 103, 204, 205, 304];

  // Most a proxy response's header names and values may add up to.
  const MAX_PROXY_HEADER_BYTES = 256 * 1024;

  let proxyUrl = null;
  // Lower-cased hosts: "api.example.com", "*.example.com" for any subdomain,
  // or "*" for any host. null allows any host.
  let allowedHosts = null;

  let frame = null;
  // The channel offered to the proxy, and the one it accepted.
  let offered = null;
  let port = null;
  let handshakeTimer = 0;
  // Proxy requests waiting for the handshake, as [message, transfer].
  let queued = [];
  // Requests not yet settled or aborted, by id, as {deadline, maxBodyBytes,
  // timer, controller}; controller is set on direct requests only.
  const pending = new Map();

  function heap() {
    return new Uint8Array(wasmMemory.buffer);
  }

  // Copies `parts`, Uint8Arrays of `size` bytes in all, into one block; 0
  // when the heap has no room.
  function copyIn(parts, size) {
    const ptr = _malloc(size || 1);
    if (ptr) {
      const view = heap();
      let offset = ptr;
      for (let i = 0; i < parts.length; i++) {
        view.set(parts[i], offset);
        offset += parts[i].byteLength;
      }
    }
    return ptr;
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
    // Without room for even this, the runtime's watchdog settles it.
    if (codeString[0] && messageString[0]) {
      Module["_riveScriptFetchFail"](
        id,
        codeString[0],
        codeString[1],
        messageString[0],
        messageString[1],
      );
    }
    release([codeString[0], messageString[0]]);
  }

  // Forgets `id`; false when it was not pending.
  function settle(id) {
    const entry = pending.get(id);
    if (!entry) {
      return false;
    }
    clearTimeout(entry.timer);
    pending.delete(id);
    return true;
  }

  function fail(id, code, message) {
    if (settle(id)) {
      reportError(id, code, message);
    }
  }

  // `headers` as [[name, value]], `body` as Uint8Array parts.
  function complete(id, status, statusText, url, headers, body) {
    if (!settle(id)) {
      return;
    }
    // None of these can hold a NUL: the browser's Headers refuse one.
    const fields = [String(statusText), String(url)];
    for (let i = 0; i < headers.length; i++) {
      fields.push(String(headers[i][0]), String(headers[i][1]));
    }
    const meta = copyString(fields.join("\0"));
    let size = 0;
    for (let i = 0; i < body.length; i++) {
      size += body[i].byteLength;
    }
    const bodyPtr = copyIn(body, size);
    const ok = meta[0] && bodyPtr;
    if (ok) {
      Module["_riveScriptFetchComplete"](
        id,
        status | 0,
        meta[0],
        meta[1],
        bodyPtr,
        size,
      );
    }
    release([meta[0], bodyPtr]);
    if (!ok) {
      reportError(id, "tooLarge", "the response does not fit in memory");
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
  // unless allowedHosts names it.
  function hostRefusal(url) {
    let host;
    try {
      host = withoutTrailingDot(new URL(url).hostname);
    } catch (e) {
      return "the URL is not valid";
    }
    if (host === withoutTrailingDot(location.hostname)) {
      return allowedHosts && allowedHosts.indexOf(host) !== -1
        ? null
        : "scripts cannot fetch this page's own host unless allowedHosts names it";
    }
    if (!allowedHosts) {
      return null;
    }
    for (let i = 0; i < allowedHosts.length; i++) {
      const pattern = allowedHosts[i];
      if (pattern === "*" || host === pattern) {
        return null;
      }
      if (pattern.lastIndexOf("*.", 0) === 0) {
        const suffix = pattern.slice(1);
        if (
          host.length > suffix.length &&
          host.slice(host.length - suffix.length) === suffix
        ) {
          return null;
        }
      }
    }
    return "the page does not allow scripts to fetch from this host";
  }

  // Direct transport.

  async function readBody(response, maxBodyBytes) {
    if (!response.body) {
      const whole = await response.arrayBuffer();
      if (whole.byteLength > maxBodyBytes) {
        throw tooLarge(maxBodyBytes);
      }
      return [new Uint8Array(whole)];
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const step = await reader.read();
      if (step.done) {
        break;
      }
      size += step.value.byteLength;
      if (size > maxBodyBytes) {
        reader.cancel().catch(function () {});
        throw tooLarge(maxBodyBytes);
      }
      chunks.push(step.value);
    }
    return chunks;
  }

  async function sendDirect(id, entry, request) {
    try {
      const response = await fetch(request["url"], {
        "method": request["method"],
        "headers": request["headers"],
        "body": request["body"],
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
      const maxBodyBytes = request["maxBodyBytes"];
      const hasBody =
        request["method"] !== "HEAD" &&
        NULL_BODY_STATUSES.indexOf(response.status) === -1;
      const length = Number(response.headers.get("content-length"));
      if (hasBody && length > maxBodyBytes) {
        response.body && response.body.cancel().catch(function () {});
        throw tooLarge(maxBodyBytes);
      }
      const body = await readBody(response, maxBodyBytes);
      const list = [];
      response.headers.forEach(function (value, name) {
        list.push([name, value]);
      });
      complete(
        id,
        response.status,
        response.statusText,
        response.url || "",
        list,
        body,
      );
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
      if (!request) {
        return;
      }
      if (!wellFormed(data)) {
        fail(id, "network", "the script fetch proxy sent a malformed response");
        return;
      }
      const body = data["body"];
      if (body && body.byteLength > request.maxBodyBytes) {
        const error = tooLarge(request.maxBodyBytes);
        fail(id, error.code, error.message);
        return;
      }
      // The proxy may have followed a redirect.
      const landed = hostRefusal(data["url"]);
      if (landed) {
        fail(id, "policy", landed);
        return;
      }
      complete(
        id,
        data["status"],
        typeof data["statusText"] === "string" ? data["statusText"] : "",
        data["url"],
        data["headers"],
        body ? [new Uint8Array(body)] : [],
      );
    } else if (type === "error") {
      if (data["id"] === 0) {
        reset(String(data["message"]));
      } else {
        fail(data["id"], String(data["code"]), String(data["message"]));
      }
    }
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
    "start": function (id, url, method, headers, body, timeoutMs, maxBodyBytes) {
      const refusal = hostRefusal(url);
      if (refusal) {
        reportError(id, "policy", refusal);
        return;
      }
      const entry = {
        deadline: performance.now() + timeoutMs,
        maxBodyBytes: maxBodyBytes,
        timer: 0,
        controller: proxyUrl ? null : new AbortController(),
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
    allowedHosts = hosts
      ? hosts.map(function (host) {
          return String(host).trim().toLowerCase();
        })
      : null;
    if (!options) {
      Module["_riveScriptFetchSetEnabled"](0);
      return;
    }
    Module["_riveScriptFetchSetLimits"](
      options["maxRequestsPerMinute"] >>> 0,
      options["maxResponseBytes"] >>> 0,
    );
    Module["_riveScriptFetchSetEnabled"](1);
  };
})();
