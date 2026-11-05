// Serves the proxy locally with the response headers it needs. Node 18+, no
// dependencies.
//
//   node serve.mjs [--port=8790] [--page-origin=http://localhost:5173]
//
// Open your page on localhost and use http://127.0.0.1:8790/ as proxyUrl: a
// different host, so the proxy gets its own origin and cookie jar. Add the
// page's origin to PAGE_ORIGINS in proxy.js.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")),
);
const port = Number(args.port ?? 8790);
const pageOrigin = args["page-origin"] ?? "http://localhost:*";
const root = fileURLToPath(new URL(".", import.meta.url));

// Send the same headers from your production host.
const headers = {
  "Content-Security-Policy": [
    "default-src 'none'",
    "script-src 'self'",
    "connect-src https:",
    `frame-ancestors ${pageOrigin}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; "),
  // A cross origin isolated page only embeds frames that opt in to both.
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "cross-origin",
  // Keeps requests off the viewer's local network (Chrome's Local Network
  // Access); older Chrome versions use the last name.
  "Permissions-Policy":
    "local-network=(), loopback-network=(), local-network-access=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

const files = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/proxy.js": ["proxy.js", "text/javascript; charset=utf-8"],
};

createServer(async (request, response) => {
  const file = files[new URL(request.url, "http://proxy").pathname];
  if (request.method !== "GET" || !file) {
    response.writeHead(404, headers).end();
    return;
  }
  const body = await readFile(join(root, file[0]));
  response.writeHead(200, { ...headers, "Content-Type": file[1] }).end(body);
}).listen(port, "127.0.0.1", () => {
  console.log(`script fetch proxy on http://127.0.0.1:${port}/`);
});
