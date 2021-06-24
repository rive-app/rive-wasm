# Rive WASM

Wasm/JS runtime for Rive

## Submodules

This repository uses submodules. To clone it, you can run the following:

`git clone --recurse-submodules git@github.com:rive-app/rive-wasm.git`

## Building

- [Install emscripten](https://emscripten.org/docs/getting_started/downloads.html) we try to use the latest. We're currently building against 2.0.17.
- ```./build.sh``` to build the various wasm modules necessary for rive-js (js/build.sh will do this automatically if necessary).
- ```./build-wasm.sh``` if you're iterating on C++ code changes and want to rebuild often with quick iteration (this requires premake5).