# Rive WASM

WASM/JS runtime for Rive which provides a thin layer over rive-cpp implementing the abstract renderer with Canvas 2D.

## Render Loop
If you'd like to directly use the Canvas 2D renderer and run your own render loops, take a look at [this codepen](https://codepen.io/cirrus82/pen/eYvqWVq) for how to do so.

Note that this functionality used to be provided via the now [deprecated rive-canvas](https://www.npmjs.com/package/rive-canvas) npm module.

## Submodules

This repository uses submodules. To clone it, you can run the following:

`git clone --recurse-submodules git@github.com:rive-app/rive-wasm.git`

## Building
If you'd like to contribute or make modifications to the source code, you'll need to run the various build scripts provided.

- [Install emscripten](https://emscripten.org/docs/getting_started/downloads.html) we try to use the latest. We're currently building against 2.0.17.
- ```./build.sh``` to build the various wasm modules necessary for rive-js (js/build.sh will do this automatically if necessary).
- ```./build-wasm.sh``` if you're iterating on C++ code changes and want to rebuild often with quick iteration (this requires premake5).