#!/bin/bash
echo Building ES6
./build-wasm.sh es6
echo Building ES5
./build-wasm.sh es5
echo Building ES6 PURE
./build-wasm.sh es6pure
echo Building ES5 PURE
./build-wasm.sh es5pure