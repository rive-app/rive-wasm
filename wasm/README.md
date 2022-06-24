# Rive Advanced

Rive's low level web runtime. Use this over the high level JS runtime if you need to:

- control the render loop
- control draw order
- create scenes out of multiple Rive files

# Building

`build_all_wasm.sh` will build all the various permutations of the Rive WASM modules necessary to build rive-js.

# Code Formatting

The C++ code is formatted using ClangFormat. The JS code is formatted using Prettier. Configuration files are included for both. VSCode will pick them up directly if you have the Prettier and ClangFormat extensions installed.

# Renderers

Rive renders to an HTML Canvas element. A Context 2D renderer and WebGL renderer are both available. The Context 2D renderer doesn't support raster meshes.

# GL Contexts

Most browsers have a limit on the total number of WebGL contexts created on a single page. For example, on Chrome it's 16.

## Direct WebGL Context

Calling `const renderer = rive.makeRenderer(canvas);` will create a renderer with its own backing WebGL context. Currently only allows for ~16 animations per page. This is the most performant way to show a single Rive animation.

## Shared Context

To get around the context limit, Rive can share a single WebGL context. You can do this by passing an optional second argument to makeRenderer:

`const renderer = rive.makeRenderer(canvas, true);`.

This will create one WebGL context the first time you call it, all subsequent calls will share the same context, effectively avoiding the context limit.

If you plan on showing many Rive animations on a page, or an indeterminate amount (like in a dynamic list), we encourage you to use the shared renderer.

## Render Loop

If you'd like to directly use the Canvas 2D renderer and run your own render loops, take a look at [this codepen](https://codepen.io/cirrus82/pen/eYvqWVq) for how to do so.

Note that this functionality used to be provided via the now [deprecated rive-canvas](https://www.npmjs.com/package/rive-canvas) npm module.

## Submodules

This repository uses submodules. To clone it, you can run the following:

`git clone --recurse-submodules git@github.com:rive-app/rive-wasm.git`

## Building

If you'd like to contribute or make modifications to the source code, you'll need to run the various build scripts provided.

- [Install emscripten](https://emscripten.org/docs/getting_started/downloads.html) we try to use the latest. We're currently building against 3.0.0.
- `./build_all_wasm.sh` to build the various wasm modules necessary for rive-js (js/build.sh will do this automatically if necessary).
- `./build_wasm.sh` if you're iterating on C++ code changes and want to rebuild often with quick iteration (this requires premake5).

## Testing

```
cd wasm/examples/parcel_example
```

May need to do this once

```
npm install
```

Then run

```
npm run start
```
