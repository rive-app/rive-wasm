![npm](https://img.shields.io/npm/v/@rive-app/canvas-advanced-single)

# Rive 
Low-level Rive API using CanvasRenderingContext2D and inline WASM. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

## Canvas Advanced Single
```
npm install @rive-app/canvas-advanced-single
```
A low-level Rive API using the [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. It has the same benefits as the regular `@rive-app/canvas package` plus:
- Full control over the update and render loop
- Allows for rendering multiple Rive artboards to a single canvas
- Allows deeper control and manipulation of the components in a Rive hierarchy
- Web Assembly (WASM) is part of the JS bundle; there is no need to make a request to load it in at runtime

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)
