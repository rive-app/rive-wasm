![npm](https://img.shields.io/npm/v/@rive-app/canvas)
# Rive 
High-level Rive API using CanvasRenderingContext2D. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

## Canvas 
```
npm install @rive-app/canvas
```
An easy-to-use high-level Rive API using a backing [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. This lets Rive use the browser's native high-level vector graphics renderer. Some benefits of this package:
- Extremely small download size
- Great for displaying many animated canvases concurrently on the screen. This is ideal for when you want to render lists or grids of Rive animations on the screen, as there is no context limit by the browser (as opposed to WebGL)
- Support for simple vector graphics animations, raster, and mesh deformations
- Requests the Web Assembly (WASM) backing dependency for you

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)
