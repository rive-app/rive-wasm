#!/bin/bash
set -e

echo 
echo "::::: building skia for wasm"
echo 
pushd submodules/rive-cpp/skia/dependencies
./make_skia_wasm.sh
popd

rm -f ../js/dist/*.mjs
rm -f ../js/dist/*.wasm

echo 
echo "::::: building rive_canvas_light.js"
echo 
./build-wasm.sh clean
./build-wasm.sh -s release
cp build/bin/release/rive_canvas_light.mjs ../js/dist/rive_canvas_light.mjs

echo 
echo "::::: building rive_canvas_single.js"
echo 
./build-wasm.sh clean
./build-wasm.sh -r skia -s release
cp build/bin/release/rive_canvas_single.mjs ../js/dist/rive_canvas_single.mjs

echo 
echo "::::: building rive_canvas.js and rive_canvas.wasm"
echo 
./build-wasm.sh clean
./build-wasm.sh -r skia release
cp build/bin/release/rive_canvas.mjs ../js/dist/rive_canvas.mjs
cp build/bin/release/rive_canvas.wasm ../js/dist/rive_canvas.wasm