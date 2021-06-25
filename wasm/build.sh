#!/bin/bash

set -e

echo Building all rive-wasm necessary for rive-js.

echo Building ES6
./build-js.sh es6
echo Building ES6 NO BUNDLED WASM
./build-js.sh es6lean