// Resizing a canvas clears it, and a worker's OffscreenCanvas presents at the
// end of each task, so a resize the replay worker applies in a task that draws
// nothing after it shows a blank frame (Safari does). Resizes the canvas of the
// webgl2-threads build in headless Chromium and fails on any such task.
//   npm ci && npm test   (after js/build.sh has built webgl2-threads)
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import http from 'http';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = fileURLToPath(new URL('.', import.meta.url));
const pkg = resolve(here, '../../npm/webgl2_threads');
const riv = resolve(here, '../assets/layout_scroll_vertical.riv');
const RESIZES = 40;
// A runtime that never loads leaves the evaluates below waiting forever.
const watchdog = setTimeout(() => {
  console.error('FAIL: timed out');
  process.exit(1);
}, 120000);

// Runs on every pthread worker before the runtime: counts size changes to a
// canvas that has a context, and the tasks that ended before drawing to it.
const prelude = `(() => {
  const stats = { sizes: 0, undrawn: 0 };
  setInterval(() => postMessage({ __resizeStats: stats }), 50);
  const live = new WeakSet();
  let pending = null;
  const P = OffscreenCanvas.prototype;
  const getContext = P.getContext;
  P.getContext = function () { live.add(this); return getContext.apply(this, arguments); };
  for (const key of ['width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(P, key);
    Object.defineProperty(P, key, { configurable: true, get: d.get, set(v) {
      d.set.call(this, v);
      if (!live.has(this) || pending) return;
      pending = this; stats.sizes++;
      // Microtasks run once the task's script returns, before it presents.
      queueMicrotask(() => { if (pending) { pending = null; stats.undrawn++; } });
    } });
  }
  const G = WebGL2RenderingContext.prototype;
  for (const fn of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'clear', 'clearBufferfv', 'clearBufferuiv', 'clearBufferiv', 'blitFramebuffer']) {
    const o = G[fn];
    G[fn] = function () {
      if (this.canvas === pending && this.getParameter(this.DRAW_FRAMEBUFFER_BINDING) === null) pending = null;
      return o.apply(this, arguments);
    };
  }
})();`;

const page = `<!DOCTYPE html><html><head><style>
html,body{margin:0}canvas{display:block;width:300px;height:300px}</style></head>
<body><canvas></canvas><script>
const RealWorker = Worker;
const totals = new Map();
window.Worker = function (url, options) {
  if (!options || options.name !== 'em-pthread') return new RealWorker(url, options);
  const src = ${JSON.stringify(prelude)} + '\\nimportScripts(' + JSON.stringify(new URL(url, location.href).href) + ');';
  const w = new RealWorker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), options);
  w.addEventListener('message', (e) => { if (e.data && e.data.__resizeStats) totals.set(w, e.data.__resizeStats); });
  return w;
};
window.resizeStats = () => [...totals.values()].reduce((a, s) => ({ sizes: a.sizes + s.sizes, undrawn: a.undrawn + s.undrawn }), { sizes: 0, undrawn: 0 });
</script><script src="/rive.js"></script><script>
rive.RuntimeLoader.setWasmUrl('/rive.wasm');
rive.RuntimeLoader.setWasmThreadsUrl('/rive_threads.wasm');
const canvas = document.querySelector('canvas');
window.ready = new Promise((resolve, reject) => {
  const r = new rive.Rive({ src: '/file.riv', canvas, enableGPUCanvas: true, autoplay: true,
    onLoad: () => { r.resizeDrawingSurfaceToCanvas(); window.riveInstance = r; resolve(); },
    onLoadError: (e) => reject(new Error('load failed: ' + String(e && e.data))) });
});
window.resizeSteps = async (n) => {
  const frame = () => new Promise((f) => requestAnimationFrame(f));
  for (let i = 0; i < n; i++) {
    // A heavy file records for milliseconds after the frame begins, which is
    // what lets an idle worker take a job posted at its start on its own.
    const renderer = window.riveInstance.renderer;
    if (!renderer.__slow) {
      const clear = renderer.clear;
      renderer.clear = function () {
        clear.call(this);
        const t = performance.now();
        while (performance.now() - t < 8) {}
      };
      renderer.__slow = true;
    }
    canvas.style.width = (301 + i) + 'px';
    window.riveInstance.resizeDrawingSurfaceToCanvas();
    // Lets the worker finish replaying, so the next resize finds it idle.
    for (let j = 0; j < 4; j++) await frame();
  }
  for (let i = 0; i < 10; i++) await frame();
};
</script></body></html>`;

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  const headers = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' };
  try {
    if (p === '/') {
      res.writeHead(200, { ...headers, 'Content-Type': 'text/html' });
      return res.end(page);
    }
    const body = readFileSync(p === '/file.riv' ? riv : join(pkg, p.slice(1).replace(/\.\.+/g, '')));
    res.writeHead(200, { ...headers, 'Content-Type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((f) => server.listen(0, '127.0.0.1', f));

const browser = await chromium.launch();
const pageErrors = [];
try {
  const tab = await browser.newPage();
  tab.on('pageerror', (e) => pageErrors.push(e.message));
  tab.on('console', (m) => m.type() !== 'log' && console.error('page', m.type() + ':', m.text()));
  await tab.goto(`http://127.0.0.1:${server.address().port}/`);
  await tab.evaluate(() => window.ready);
  const config = await tab.evaluate(() => ({
    isolated: crossOriginIsolated,
    replaysOnWorker: !!window.riveInstance.renderer?.replaysOnWorker?.(),
  }));
  console.log('config', JSON.stringify(config));
  if (!config.replaysOnWorker) {
    throw new Error('the canvas does not replay on the worker, so nothing was tested');
  }
  await tab.evaluate((n) => window.resizeSteps(n), RESIZES);
  const stats = await tab.evaluate(() => window.resizeStats());
  console.log('worker canvas size changes', stats.sizes, 'left undrawn at task end', stats.undrawn);
  if (pageErrors.length) {
    throw new Error('page errors: ' + pageErrors.join('; '));
  }
  if (stats.sizes < RESIZES - 4) {
    throw new Error(`only ${stats.sizes} of ${RESIZES} resizes reached the worker's canvas`);
  }
  if (stats.undrawn > 0) {
    throw new Error(`${stats.undrawn} resizes presented before their frame drew`);
  }
  console.log('ok');
} catch (e) {
  console.error('FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
  clearTimeout(watchdog);
}
