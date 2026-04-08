# Rive's Web Runtimes

See more context below on which package you may want to install in your web applications to integrate Rive assets.

# Installing

This repository provides various packages which are published to npm. For simple usage, we recommend starting with `@rive-app/canvas` (more on that below).

**Note:** The high-level API and the logic for creating a Rive instance in your script remains the same for all of the non-advanced packages. That means if you decide later on you want to switch from a backing `CanvasRenderingContext2D` context to `WebGL2`, you can switch from for instance, `@rive-app/canvas` to `@rive-app/webgl2` without any breaking changes needed to your existing code.

### **(Recommended)** @rive-app/canvas ![npm](https://img.shields.io/npm/v/@rive-app/canvas)

```
npm install @rive-app/canvas
```

An easy to use high-level Rive API using the [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) renderer. This lets Rive use the browser's native high-level vector graphics renderer. Some benefits of this package:

- Extremely small download size
- Great for displaying many animated canvases concurrently on the screen. This is ideal for when you want to render lists or grids of Rive animations on the screen, as there is no context limit by the browser (as opposed to WebGL)
- Support for simple vector graphics animations, raster, and mesh deformations
- Requests the backing web assembly code for you as a network request

### @rive-app/canvas-advanced ![npm](https://img.shields.io/npm/v/@rive-app/canvas-advanced)

```
npm install @rive-app/canvas-advanced
```

A low-level Rive API using the [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) renderer. It has the same benefits as the regular `@rive-app/canvas` package plus:

- Full control over the update and render loop.
- Allows for rendering multiple Rive artboards to a single canvas.
- Allows deeper control and manipulation of the components in a Rive hierarchy.
- WASM is part of the NPM bundle, but you can load in the WASM manually

Want to see an example? Check out this [CodeSandbox](https://codesandbox.io/s/rive-canvas-advanced-api-centaur-example-exh2os) for some inspiration!

## Single Versions

Each of the above NPM packages includes the `rive.wasm` file in the bundle that powers the Rive render loop. In the high-level APIs (`@rive-app/canvas` and `@rive-app/webgl`), the runtime requests this for you so you don't have to, as opposed to their `-advanced` counterpart packages.

We also have alternative versions of each of the above packages on NPM that have the WASM encoded in the JS bundle. This means you won't have to make a network request for the WASM that powers the Rive animations, as it's all in one main JS file.

- [@rive-app/canvas-single](https://www.npmjs.com/package/@rive-app/canvas-single)
- [@rive-app/canvas-advanced-single](https://www.npmjs.com/package/@rive-app/canvas-advanced-single)

While there is no request for WASM file here, the JS bundle will be larger. The non-single versions may cache better on your web applications, as the WASM gets loaded from the same CDN source if loaded from multiple pages.
