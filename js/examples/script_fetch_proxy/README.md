# Script fetch proxy

A reference proxy page for scripts' `fetch()` in `@rive-app/webgl2-threads`.

By default, scripts' requests leave from your page with the browser's
`fetch()`. With a proxy, the runtime loads this page in a hidden, sandboxed
iframe on a domain of its own and sends each request to it instead. Then:

- servers see the proxy's origin in the `Origin` header, not your page's.
- your page's CSP doesn't need `connect-src` for every data source, only
  `frame-src` for the proxy.
- requests to your own site come from the proxy's origin, so they get no
  same-origin access and need CORS like any other server.
- you have one place to log, limit, block or reroute what scripts fetch.

Either way, requests never carry cookies, credentials, a referrer or the HTTP
cache, and redirects are refused. That holds for this proxy as written: a proxy
you change decides these itself. The runtime still checks the URL each
response came from against `allowedHosts`.

## Use it

1. Set `PAGE_ORIGINS` in `proxy.js` to the origins of the pages that use it.
2. Host `index.html` and `proxy.js` on a separate domain (not a subdomain of
   your site) with the headers below.
3. Point the runtime at it:

   ```ts
   import { RuntimeLoader } from "@rive-app/webgl2-threads";

   RuntimeLoader.setScriptFetch({
     proxyUrl: "https://rive-proxy.example.net/",
     allowedHosts: ["*"],
   });
   ```

## Headers

The proxy's responses need:

| Header | Value | Why |
| --- | --- | --- |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Your cross origin isolated page only embeds frames that send both of these. |
| `Cross-Origin-Resource-Policy` | `cross-origin` | |
| `Content-Security-Policy` | `default-src 'none'; script-src 'self'; connect-src https:; frame-ancestors https://www.example.com` | Only your pages may embed it, and it can only fetch https: URLs. |
| `Permissions-Policy` | `local-network=(), loopback-network=(), local-network-access=()` | Keeps requests off the viewer's local network. |
| `Referrer-Policy` | `no-referrer` | |

Your page's CSP must allow the proxy in `frame-src` (or `child-src`).

`serve.mjs` sends these headers for local testing:

```sh
node serve.mjs --page-origin=http://localhost:5173
```

Use `http://127.0.0.1:8790/` as `proxyUrl` from a page on `localhost`, and
add that page's origin to `PAGE_ORIGINS`.

## Calling APIs that need a key

Don't put secrets in `proxy.js`: anyone can read it. Use `route()` to send
those requests to your own backend, which adds the key and calls the API:

```js
const route = (url) =>
  new URL(url).hostname === "api.example.com"
    ? `https://backend.example.com/rive?url=${encodeURIComponent(url)}`
    : url;
```

The script only ever sees the response.

## Protocol (version 1)

After the iframe loads, the runtime posts
`{ rive: "script-fetch-proxy", type: "connect", version: 1 }` to it with a
`MessagePort`. The proxy checks the sender's origin, keeps the port and
answers `ready`. Requests made before then wait for it. Every other message
travels on the port.

| Direction | Message |
| --- | --- |
| runtime → proxy | `{ type: "fetch", id, url, method, headers: [[name, value]], body: ArrayBuffer \| null, timeoutMs, maxBodyBytes }` |
| runtime → proxy | `{ type: "abort", id }` |
| proxy → runtime | `{ type: "ready", version: 1 }` |
| proxy → runtime | `{ type: "response", id, status, statusText, url, headers: [[name, value]], body: ArrayBuffer }` |
| proxy → runtime | `{ type: "error", id, code, message }` |

`code` is one of `network`, `timeout`, `tooLarge`, `policy` or `aborted`. An
`error` with `id: 0` tells the runtime the proxy can't serve it at all; the
runtime then fails pending requests and tries again with a fresh iframe on
the next one.

Whatever the proxy sends, the runtime still:

- checks `url`'s host against `allowedHosts` and its own rules (https only,
  no IP addresses or local names), and refuses the response if it fails.
- refuses a response with no `url`, a `status` that isn't a three-digit
  integer, headers that aren't string pairs, more than 256 KiB of headers or
  a body that isn't an `ArrayBuffer` (or absent).
- refuses a body larger than `maxBodyBytes`.
- ignores messages for requests it no longer waits on.

## Troubleshooting

If the proxy doesn't answer `ready` within 10 seconds, every request fails
with `network` and the runtime removes the iframe. Check the browser console
for a blocked frame: a missing header from the table above, or
`PAGE_ORIGINS` / `frame-ancestors` not listing your page.
