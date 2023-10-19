![npm](https://img.shields.io/npm/v/@rive-app/canvas-advanced-lite)

# Rive 
Low-level lite Rive API using CanvasRenderingContext2D. Please see https://help.rive.app/runtimes/overview/web-js/canvas-vs-webgl for a list of all the available web runtimes and their details.

## Canvas Advanced 
```
npm install @rive-app/canvas-advanced-lite
```
A low-level Rive API using the [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. It has the same benefits as the regular `@rive-app/canvas` package plus:
- Full control over the update and render loop
- Allows for rendering multiple Rive artboards to a single canvas
- Allows deeper control and manipulation of the components in a Rive hierarchy
- Web Assembly (WASM) is part of the NPM bundle, but you load in the WASM manually

[Getting Started](https://help.rive.app/runtimes/overview/web-js/low-level-api-usage)

## Why Lite?

The complimentary `@rive-app/canvas-advanced` dependency supports all Rive features and contains the necessary backing dependencies to render those graphics. This `lite` version has the same API, but does not compile and build with certain dependencies in order to keep the package size as small as possible.

At this time, this lite version of `@rive-app/canvas-advanced-lite` will not render [Rive Text](https://help.rive.app/editor/text) onto the canvas. Note however, that even if your Rive file may include Rive Text components, rendering the graphic should not cause any app errors, or cease to render.
