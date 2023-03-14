#!/bin/bash
set -e

echo 
echo "::::: building skia for wasm"
echo 
pushd submodules/rive-cpp/skia/dependencies
./make_skia_wasm.sh
popd

rm -f ../js/npm/canvas_advanced/*.mjs
rm -f ../js/npm/canvas_advanced/*.wasm

rm -f ../js/npm/webgl_advanced/*.mjs
rm -f ../js/npm/webgl_advanced/*.wasm

rm -f ../js/npm/canvas_advanced_single/*.mjs
rm -f ../js/npm/webgl_advanced_single/*.mjs

rm -f ../js/npm/canvas/*.mjs
rm -f ../js/npm/canvas/*.wasm

rm -f ../js/npm/webgl/*.mjs
rm -f ../js/npm/webgl/*.wasm

rm -f ../js/npm/canvas_single/*.mjs
rm -f ../js/npm/webgl_single/*.mjs

mkdir -p ../js/npm/webgl
mkdir -p ../js/npm/canvas
mkdir -p ../js/npm/webgl_single
mkdir -p ../js/npm/canvas_single
mkdir -p ../js/npm/canvas_advanced
mkdir -p ../js/npm/webgl_advanced
mkdir -p ../js/npm/canvas_advanced_single
mkdir -p ../js/npm/webgl_advanced_single

# Comment this block to use incremental builds.
echo
echo "::::: cleaning all projects"
echo
rm -fR ./build

echo 
echo "::::: building @rive-app/canvas_advanced"
echo 
OUT_DIR=build/canvas_advanced ./build_wasm.sh release
cp build/canvas_advanced/bin/release/canvas_advanced.mjs ../js/npm/canvas_advanced/canvas_advanced.mjs
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas_advanced/rive.wasm
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced/rive_advanced.mjs.d.ts

echo 
echo "::::: building @rive-app/canvas_advanced_single"
echo 
OUT_DIR=build/canvas_advanced_single ./build_wasm.sh -s release
cp build/canvas_advanced_single/bin/release/canvas_advanced_single.mjs ../js/npm/canvas_advanced_single/canvas_advanced_single.mjs
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_single/rive_advanced.mjs.d.ts

echo 
echo "::::: building @rive-app/webgl_advanced"
echo 
OUT_DIR=build/webgl_advanced ./build_wasm.sh -r skia release
cp build/webgl_advanced/bin/release/webgl_advanced.mjs ../js/npm/webgl_advanced/webgl_advanced.mjs
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl_advanced/rive.wasm
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl_advanced/rive_advanced.mjs.d.ts

echo 
echo "::::: building @rive-app/webgl_advanced_single"
echo 
OUT_DIR=build/webgl_advanced_single ./build_wasm.sh -r skia -s release
cp build/webgl_advanced_single/bin/release/webgl_advanced_single.mjs ../js/npm/webgl_advanced_single/webgl_advanced_single.mjs
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl_advanced_single/rive_advanced.mjs.d.ts
