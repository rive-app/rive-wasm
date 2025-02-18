#!/bin/bash
set -e

source ./get_emcc.sh

echo
echo "::::: building skia for wasm"
echo
path=$(readlink -f "${BASH_SOURCE:-$0}")
DEV_SCRIPT_DIR=$(dirname $path)
if [ -d "$DEV_SCRIPT_DIR/submodules/rive-runtime" ]; then
    pushd submodules/rive-runtime/skia/dependencies
else
    pushd ../../runtime/skia/dependencies
fi
./make_skia_wasm.sh
popd

rm -f ../js/npm/canvas_advanced/*.mjs
rm -f ../js/npm/canvas_advanced/*.wasm

rm -f ../js/npm/canvas_advanced_lite/*.mjs
rm -f ../js/npm/canvas_advanced_lite/*.wasm

rm -f ../js/npm/webgl_advanced/*.mjs
rm -f ../js/npm/webgl_advanced/*.wasm

rm -f ../js/npm/canvas_advanced_single/*.mjs
rm -f ../js/npm/webgl_advanced_single/*.mjs

rm -f ../js/npm/canvas/*.mjs
rm -f ../js/npm/canvas/*.wasm

rm -f ../js/npm/canvas_lite/*.mjs
rm -f ../js/npm/canvas_lite/*.wasm

rm -f ../js/npm/webgl/*.mjs
rm -f ../js/npm/webgl/*.wasm

rm -f ../js/npm/canvas_single/*.mjs
rm -f ../js/npm/webgl_single/*.mjs

rm -f ../js/npm/webgl2_advanced/*.mjs
rm -f ../js/npm/webgl2_advanced/*.wasm

mkdir -p ../js/npm/webgl
mkdir -p ../js/npm/canvas
mkdir -p ../js/npm/canvas_lite
mkdir -p ../js/npm/webgl_single
mkdir -p ../js/npm/canvas_single
mkdir -p ../js/npm/canvas_advanced
mkdir -p ../js/npm/canvas_advanced_lite
mkdir -p ../js/npm/webgl_advanced
mkdir -p ../js/npm/canvas_advanced_single
mkdir -p ../js/npm/webgl_advanced_single
mkdir -p ../js/npm/webgl2
mkdir -p ../js/npm/webgl2_advanced

# Comment this block to use incremental builds.
echo
echo "::::: cleaning all projects"
echo
rm -fR ./build

echo
echo "::::: building @rive-app/canvas_advanced fallback"
echo
OUT_DIR=build/canvas_advanced/bin/release ./build_wasm.sh -c release
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas_advanced/rive_fallback.wasm
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas/rive_fallback.wasm

echo
echo "::::: building @rive-app/canvas_advanced"
echo
OUT_DIR=build/canvas_advanced/bin/release ./build_wasm.sh release
cp build/canvas_advanced/bin/release/canvas_advanced.mjs ../js/npm/canvas_advanced/canvas_advanced.mjs
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas_advanced/rive.wasm
cp build/canvas_advanced/bin/release/canvas_advanced.wasm ../js/npm/canvas/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/canvas_advanced_lite fallback"
echo
OUT_DIR=build/canvas_advanced_lite/bin/release ./build_wasm.sh -c -l release
cp build/canvas_advanced_lite/bin/release/canvas_advanced.wasm ../js/npm/canvas_advanced_lite/rive_fallback.wasm
cp build/canvas_advanced_lite/bin/release/canvas_advanced.wasm ../js/npm/canvas_lite/rive_fallback.wasm

echo
echo "::::: building @rive-app/canvas_advanced_lite"
echo
OUT_DIR=build/canvas_advanced_lite/bin/release ./build_wasm.sh -l release
cp build/canvas_advanced_lite/bin/release/canvas_advanced.mjs ../js/npm/canvas_advanced_lite/canvas_advanced.mjs
cp build/canvas_advanced_lite/bin/release/canvas_advanced.wasm ../js/npm/canvas_advanced_lite/rive.wasm
cp build/canvas_advanced_lite/bin/release/canvas_advanced.wasm ../js/npm/canvas_lite/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_lite/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/canvas_advanced_single"
echo
OUT_DIR=build/canvas_advanced_single/bin/release ./build_wasm.sh -c -s release
cp build/canvas_advanced_single/bin/release/canvas_advanced_single.mjs ../js/npm/canvas_advanced_single/canvas_advanced_single.mjs
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_single/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/canvas_advanced_lite_single"
echo
OUT_DIR=build/canvas_advanced_lite_single/bin/release ./build_wasm.sh -c -l -s release
# We probably don't need to create a package for the lite+single version for canvas
# so no need to create a folder in npm to stage for publishing, but we'll keep the local
# build for testing purposes, and let webpack reference the wasm/build for this package here

echo
echo "::::: building @rive-app/webgl_advanced fallback"
echo
OUT_DIR=build/webgl_advanced/bin/release ./build_wasm.sh -c -r skia release
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl_advanced/rive_fallback.wasm
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl/rive_fallback.wasm

echo
echo "::::: building @rive-app/webgl_advanced"
echo
OUT_DIR=build/webgl_advanced/bin/release ./build_wasm.sh -r skia release
cp build/webgl_advanced/bin/release/webgl_advanced.mjs ../js/npm/webgl_advanced/webgl_advanced.mjs
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl_advanced/rive.wasm
cp build/webgl_advanced/bin/release/webgl_advanced.wasm ../js/npm/webgl/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl_advanced/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/webgl_advanced_single"
echo
OUT_DIR=build/webgl_advanced_single/bin/release ./build_wasm.sh -r skia -s release
cp build/webgl_advanced_single/bin/release/webgl_advanced_single.mjs ../js/npm/webgl_advanced_single/webgl_advanced_single.mjs
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl_advanced_single/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/webgl2_advanced fallback"
echo
OUT_DIR=build/webgl2_advanced/bin/release ./build_wasm.sh -c -r webgl2 release
cp build/webgl2_advanced/bin/release/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive_fallback.wasm
cp build/webgl2_advanced/bin/release/webgl2_advanced.wasm ../js/npm/webgl2/rive_fallback.wasm

echo
echo "::::: building @rive-app/webgl2_advanced"
echo
OUT_DIR=build/webgl2_advanced/bin/release ./build_wasm.sh -r webgl2 release
cp build/webgl2_advanced/bin/release/webgl2_advanced.mjs ../js/npm/webgl2_advanced/webgl2_advanced.mjs
cp build/webgl2_advanced/bin/release/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive.wasm
cp build/webgl2_advanced/bin/release/webgl2_advanced.wasm ../js/npm/webgl2/rive.wasm
cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl2_advanced/rive_advanced.mjs.d.ts

echo
echo "::::: building @rive-app/webgl2_advanced_single"
echo
OUT_DIR=build/webgl2_advanced_single/bin/release ./build_wasm.sh -r webgl2 -s release
# Don't build a package for this one. Just do the build so we can test it.
