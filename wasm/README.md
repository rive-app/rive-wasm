# Rive Canvas
Rive's low level web runtime. Use this over the high level JS runtime if you need to:
- control the render loop
- control draw order
- create scenes out of multiple Rive files

# Building
```build_all_wasm.sh``` will build all the various permutations of the Rive WASM modules necessary to build rive-js.

## rive_canvas.mjs
WASM/JS runtime for Rive which provides a feature rich performance driven renderer in WebGL. There are two flavors of this:
- rive_canvas.mjs
    - Loads rive_canvas.wasm bytes asynchronously from a separate file. Best for production environments looking to for an optimal download size.
- rive_canvas_single.mjs
    - The wasm bytes are encoded into the js file, providing an easy to use all-in-one solution.

## rive_canvas_light.mjs
WASM/JS runtime for Rive which provides a thin layer over rive-cpp implementing the abstract renderer with Canvas 2D.

## Render Loop
If you'd like to directly use the Canvas 2D renderer and run your own render loops, take a look at [this codepen](https://codepen.io/cirrus82/pen/eYvqWVq) for how to do so.

Note that this functionality used to be provided via the now [deprecated rive-canvas](https://www.npmjs.com/package/rive-canvas) npm module.

## Submodules

This repository uses submodules. To clone it, you can run the following:

`git clone --recurse-submodules git@github.com:rive-app/rive-wasm.git`

## Building
If you'd like to contribute or make modifications to the source code, you'll need to run the various build scripts provided.

- [Install emscripten](https://emscripten.org/docs/getting_started/downloads.html) we try to use the latest. We're currently building against 3.0.0.
- ```./build_all_wasm.sh``` to build the various wasm modules necessary for rive-js (js/build.sh will do this automatically if necessary).
- ```./build_wasm.sh``` if you're iterating on C++ code changes and want to rebuild often with quick iteration (this requires premake5).

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

