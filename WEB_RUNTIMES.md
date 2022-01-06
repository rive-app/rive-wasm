# Rive's Web Runtimes

See more below on which package you may want to install in your web applications to integrate Rive assets.

# Installing

This repository provides various packages which are published to npm.

## Single Versions

Every packaged outlined below also provides a `*-single` version. For example: `@rive-app/canvas` has a matching `@rive-app/canvas-single` package published to npm.

The **single** version provides an all-in-one package with the WASM encoded into the JS. This avoids needing to manage resolving the matching .wasm file. All of the other packges will attempt to download the .wasm file from unpkg. We recommend using these to get the best cache friendliness and fastest download times across all sites using Rive. You can also choose to host the .wasm yourself and provide the API the location of the .wasm to fetch during initialization.

For example, with the high level APIs (non-advanced) you can use:

```
RuntimeLoader.setWasmUrl('https://my.site.come/rive_canvas.wasm');
```

### WebGL ![npm](https://img.shields.io/npm/v/@rive-app/webgl)

```
npm install @rive-app/webgl
```

An easy to use high level Rive API using the WebGL renderer. This lets Rive squeeze every last ounce of performance from the hardware and provide some newer advanced rendering features which will not be available to the Canvas renderers.

- Highest fidelity with edit-time experience.
- Best performance across all devices.
- Support for upcoming features like mesh deformations.

**A note about WebGL**
Most browsers limit the number of concurrent WebGL contexts. If you're planning on displaying Rive content in a list item or many times on the same page, it's up to you to manage the lifecycle of the provided Canvas object or consider using the Canvas packages which use the CanvasRenderingContext2D renderer which do not have a context limitation.

### WebGL Advanced ![npm](https://img.shields.io/npm/v/@rive-app/webgl-advanced)

```
npm install @rive-app/webgl-advanced
```

A low level Rive API using the WebGL renderer. It has the same benefits as the regular WebGL package plus:

- Full control over the update and render loop.
- Allows for rendering multiple Rive artboards to a single canvas.
- Allows deeper control and manipulation of the components in a Rive hierarchy.

### Canvas ![npm](https://img.shields.io/npm/v/@rive-app/canvas)

```
npm install @rive-app/canvas
```

An easy to use high level Rive API using the CanvasRenderingContext2D renderer. This lets Rive use the browser's native high level vector graphics renderer. Best for:

- Extremely small download size
- Displaying many animated canvases concurrently on the screen.
- Simple vector graphics animations without mesh deformations and other upcoming advanced rendering features.

### Canvas Advanced ![npm](https://img.shields.io/npm/v/@rive-app/canvas-advanced)

```
npm install @rive-app/canvas-advanced
```

A low level Rive API using the CanvasRenderingContext2D renderer. It has the same benefits as the regular Canvas package plus:

- Full control over the update and render loop.
- Allows for rendering multiple Rive artboards to a single canvas.
- Allows deeper control and manipulation of the components in a Rive hierarchy.
