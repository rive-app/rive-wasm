![npm](https://img.shields.io/npm/v/@rive-app/webgl)

# Rive 
High-level Rive API using WebGL. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

## WebGL
```
npm install @rive-app/webgl
```
An easy-to-use high-level Rive API using the [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) renderer. This runtime will support Rive's upcoming advanced rendering features which may not be available to the Canvas renderers. Some benefits of this package:
- Highest fidelity with edit-time experience.
- Support for future advanced rendering features
- Requests the Web Assembly (WASM) backing dependency for you

**A note about WebGL:** Most browsers limit the number of concurrent WebGL contexts by page/domain. Using Rive, this means that the browser limit impacts the number of new Rive({...}) instances created. See the README docs for the `useOffscreenRenderer` option that may assist in working around this limitation.

If you're planning on displaying Rive content in a list/grid or many times on the same page, it's up to you to manage the lifecycle of the provided context and `<canvas>` element. If you need to display many animations (i.e grids/lists), consider using the `@rive-app/canvas package` which uses the `CanvasRenderingContext2D` renderer and does not have a context limitation.

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)
