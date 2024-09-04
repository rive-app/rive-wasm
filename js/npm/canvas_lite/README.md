![npm](https://img.shields.io/npm/v/@rive-app/canvas-lite)
# Rive 
A lite high-level Rive API using CanvasRenderingContext2D. Please see https://rive.app/community/doc/canvas-vs-webgl/docanjXoQ1uT for a list of all the available web runtimes and their details.

## Canvas Lite 
```
npm install @rive-app/canvas-lite
```
An easy-to-use high-level Rive API using a backing [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. This lets Rive use the browser's native high-level vector graphics renderer. Some benefits of this package:
- Extremely small download size
- Great for displaying many animated canvases concurrently on the screen. This is ideal for when you want to render lists or grids of Rive animations on the screen, as there is no context limit by the browser (as opposed to WebGL)
- Support for simple vector graphics animations, raster, and mesh deformations
- Requests the Web Assembly (WASM) backing dependency for you

[Getting Started](https://rive.app/community/doc/web-js/docvlgbnS1mp)

## Why Lite?

The current `@rive-app/canvas` dependency supports all Rive features and contains the necessary backing dependencies to render those graphics. This `lite` version has the same API, but does not compile and build with certain dependencies in order to keep the package size as small as possible.

At this time, this lite version of `@rive-app/canvas-lite` will not render Rive Text onto the canvas or play Rive Audio. Note however, that even if your Rive file may include Rive Text components, rendering the graphic should not cause any app errors, or cease to render. The same is true for playing audio.
