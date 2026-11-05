// A script fetch proxy for the Rive web runtime. Host it on its own domain
// and point RuntimeLoader.setScriptFetch({ proxyUrl }) at index.html. See
// README.md.
(() => {
  "use strict";

  // The pages allowed to use this proxy. Edit these.
  const PAGE_ORIGINS = ["https://www.example.com"];

  // Where a request is sent. Return a different URL to route it through your
  // own backend, e.g. one that adds an API key the script never sees.
  const route = (url) => url;

  const PROTOCOL = "script-fetch-proxy";
  const VERSION = 1;
  // https://fetch.spec.whatwg.org/#null-body-status
  const NULL_BODY_STATUSES = [101, 103, 204, 205, 304];

  let port = null;
  // id -> { controller, timer, error }. `error` is set when this page stops
  // a request, and is reported in place of the abort that follows.
  const inFlight = new Map();

  const tooLarge = (maxBodyBytes) => ({
    code: "tooLarge",
    message: `the response body is larger than ${maxBodyBytes} bytes`,
  });

  const reply = (message, transfer = []) => port.postMessage(message, transfer);

  function stop(id, error) {
    const entry = inFlight.get(id);
    if (entry && !entry.error) {
      entry.error = error;
      entry.controller.abort();
    }
  }

  async function readBody(response, maxBodyBytes) {
    if (!response.body) {
      return new ArrayBuffer(0);
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > maxBodyBytes) {
        reader.cancel().catch(() => {});
        throw tooLarge(maxBodyBytes);
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return body.buffer;
  }

  async function start(request) {
    const { id, maxBodyBytes } = request;
    if (inFlight.has(id)) {
      return;
    }
    const entry = { controller: new AbortController(), timer: 0, error: null };
    inFlight.set(id, entry);
    entry.timer = setTimeout(
      () => stop(id, { code: "timeout", message: "no response before the timeout" }),
      request.timeoutMs,
    );
    try {
      const url = new URL(route(request.url));
      if (url.protocol !== "https:") {
        throw { code: "policy", message: "only https: URLs are allowed" };
      }
      const response = await fetch(url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        // Redirects come back unfollowed, so a script can't be sent to a
        // host the runtime would refuse.
        redirect: "manual",
        referrerPolicy: "no-referrer",
        signal: entry.controller.signal,
      });
      if (response.type === "opaqueredirect") {
        throw {
          code: "policy",
          message:
            "the server answered with a redirect, which scripts on the web " +
            "cannot follow; fetch the URL it redirects to instead",
        };
      }
      const hasBody =
        request.method !== "HEAD" &&
        !NULL_BODY_STATUSES.includes(response.status);
      if (
        hasBody &&
        Number(response.headers.get("content-length")) > maxBodyBytes
      ) {
        response.body?.cancel().catch(() => {});
        throw tooLarge(maxBodyBytes);
      }
      const body = await readBody(response, maxBodyBytes);
      reply(
        {
          type: "response",
          id,
          status: response.status,
          statusText: response.statusText,
          // The URL the script asked for; the runtime checks its host again.
          url: request.url,
          headers: [...response.headers],
          body,
        },
        [body],
      );
    } catch (thrown) {
      let error = entry.error;
      if (!error && typeof thrown?.code === "string") {
        error = thrown;
      }
      // The browser doesn't say why a fetch failed: DNS, TLS, a refused
      // connection and a missing CORS header all look the same.
      error ??= {
        code: "network",
        message:
          "the request failed (DNS, TLS, connection or a missing CORS header)",
      };
      // The runtime already forgot a request it aborted.
      if (error.code !== "aborted") {
        reply({ type: "error", id, code: error.code, message: error.message });
      }
    } finally {
      clearTimeout(entry.timer);
      inFlight.delete(id);
    }
  }

  function onRequest({ data }) {
    if (data?.type === "fetch") {
      start(data);
    } else if (data?.type === "abort") {
      stop(data.id, { code: "aborted", message: "the request was cancelled" });
    }
  }

  // The runtime connects once, after this page loads, and sends every
  // request over the MessagePort it hands over here.
  window.addEventListener("message", (event) => {
    const { data } = event;
    if (
      port ||
      event.source !== window.parent ||
      data?.rive !== PROTOCOL ||
      data.type !== "connect" ||
      event.ports.length !== 1 ||
      !PAGE_ORIGINS.includes(event.origin)
    ) {
      return;
    }
    if (data.version !== VERSION) {
      event.ports[0].postMessage({
        type: "error",
        id: 0,
        code: "network",
        message: `the script fetch proxy speaks version ${VERSION}`,
      });
      return;
    }
    port = event.ports[0];
    port.onmessage = onRequest;
    reply({ type: "ready", version: VERSION });
  });
})();
