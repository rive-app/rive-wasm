#!/bin/bash
echo Building ES6
./build-js.sh es6
echo Building ES5
./build-js.sh es5
echo Building ES6 PURE
./build-js.sh es6pure
echo Building ES5 PURE
./build-js.sh es5pure
echo Building wasm
./build-wasm.sh