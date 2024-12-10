# 🚨 Deprecated Package Notice

**This package, `@rive-app/webgl-single`, is deprecated and will no longer receive updates or maintenance.**

We highly recommend switching to the newer package for improved features, performance, and support:
👉 **[@rive-app/webgl2](https://www.npmjs.com/package/@rive-app/webgl2)**

![npm](https://img.shields.io/npm/v/@rive-app/webgl-single)

# Rive
High-level Rive API using WebGL and inline WASM. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

## WebGL Single
```
npm install @rive-app/webgl-single
```
An easy-to-use high-level Rive API using the [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) renderer. This runtime will support Rive's upcoming advanced rendering features which may not be available to the Canvas renderers. Some benefits of this package:
- Highest fidelity with edit-time experience.
- Support for future advanced rendering features
- Web Assembly (WASM) is part of the JS bundle; there is no need to make a request to load it in at runtime

**A note about WebGL:** Most browsers limit the number of concurrent WebGL contexts by page/domain. Using Rive, this means that the browser limit impacts the number of new Rive({...}) instances created. See the README docs for the `useOffscreenRenderer` option that may assist in working around this limitation.

If you're planning on displaying Rive content in a list/grid or many times on the same page, it's up to you to manage the lifecycle of the provided context and `<canvas>` element. If you need to display many animations (i.e grids/lists), consider using the `@rive-app/canvas package` which uses the `CanvasRenderingContext2D` renderer and does not have a context limitation.

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)