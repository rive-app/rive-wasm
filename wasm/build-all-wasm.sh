#!/bin/bash
set -e

rm -fr ../js/src/wasm
mkdir -p ../js/src/wasm

echo 
echo "::::: building rive_light.js"
echo 
./build-wasm.sh clean
./build-wasm.sh -s release
cp build/bin/release/rive_light.mjs ../js/src/wasm/rive_light.mjs

echo 
echo "::::: building rive_combined.js"
echo 
./build-wasm.sh clean
./build-wasm.sh -r skia -s release
cp build/bin/release/rive_combined.mjs ../js/src/wasm/rive_combined.mjs

echo 
echo "::::: building rive.js and rive.wasm"
echo 
./build-wasm.sh clean
./build-wasm.sh -r skia release
cp build/bin/release/rive.mjs ../js/src/wasm/rive.mjs
cp build/bin/release/rive.wasm ../js/src/wasm/rive.wasm