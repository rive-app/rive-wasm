#!/bin/bash

set -e

echo Building all supported permutations of rive-wasm.

echo Building ES6
./build-js.sh es6
echo Building ES5
./build-js.sh es5
echo Building ES6 PURE
./build-js.sh es6pure
echo Building ES5 PURE
./build-js.sh es5pure
echo Building ES6 NO BUNDLED WASM
./build-js.sh es6lean
echo Building ES5 NO BUNDLED WASM
./build-js.sh es5lean