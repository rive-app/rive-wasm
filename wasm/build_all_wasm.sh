#!/bin/bash
set -e

# -p          Build with profiling config (--profiling-funcs) instead of release.
#             Produces named WASM function symbols visible in Chrome DevTools.
# -r <targets> For local dev. Comma-separated list of targets to build.
#             Skips all fallback WASM builds and only compiles the specified targets.
#             Available: canvas, canvas-lite, canvas-single, canvas-lite-single,
#               webgl2, webgl2-single
WASM_CONFIG=release
TARGETS=""
while getopts "pr:" flag; do
    case "${flag}" in
    p) WASM_CONFIG=profiling ;;
    r) TARGETS="${OPTARG}" ;;
    *) echo "Unknown flag: $flag" ;;
    esac
done

# Returns 0 (true) if the given target is requested, or if no -r list was given (build all).
target_enabled() {
    [ -z "$TARGETS" ] && return 0
    echo ",$TARGETS," | grep -q ",${1},"
}

source ./get_emcc.sh

rm -f ../js/npm/canvas_advanced/*.mjs
rm -f ../js/npm/canvas_advanced/*.wasm

rm -f ../js/npm/canvas_advanced_lite/*.mjs
rm -f ../js/npm/canvas_advanced_lite/*.wasm

rm -f ../js/npm/canvas_advanced_single/*.mjs

rm -f ../js/npm/canvas/*.mjs
rm -f ../js/npm/canvas/*.wasm

rm -f ../js/npm/canvas_lite/*.mjs
rm -f ../js/npm/canvas_lite/*.wasm

rm -f ../js/npm/canvas_single/*.mjs

rm -f ../js/npm/webgl2_advanced/*.mjs
rm -f ../js/npm/webgl2_advanced/*.wasm

mkdir -p ../js/npm/canvas
mkdir -p ../js/npm/canvas_lite
mkdir -p ../js/npm/canvas_single
mkdir -p ../js/npm/canvas_advanced
mkdir -p ../js/npm/canvas_advanced_lite
mkdir -p ../js/npm/canvas_advanced_single
mkdir -p ../js/npm/webgl2
mkdir -p ../js/npm/webgl2_advanced

# Comment this block to use incremental builds.
echo
echo "::::: cleaning all projects"
echo
rm -fR ./build

if [ -z "$TARGETS" ]; then
    echo
    echo "::::: building @rive-app/canvas_advanced fallback"
    echo
    OUT_DIR=build/canvas_advanced/bin/${WASM_CONFIG} ./build_wasm.sh -c ${WASM_CONFIG}
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced/rive_fallback.wasm
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas/rive_fallback.wasm
fi

if target_enabled "canvas"; then
    echo
    echo "::::: building @rive-app/canvas_advanced"
    echo
    OUT_DIR=build/canvas_advanced/bin/${WASM_CONFIG} ./build_wasm.sh ${WASM_CONFIG}
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.mjs ../js/npm/canvas_advanced/canvas_advanced.mjs
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced/rive.wasm
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced/rive_advanced.mjs.d.ts
fi

if [ -z "$TARGETS" ]; then
    echo
    echo "::::: building @rive-app/canvas_advanced_lite fallback"
    echo
    OUT_DIR=build/canvas_advanced_lite/bin/${WASM_CONFIG} ./build_wasm.sh -c -l ${WASM_CONFIG}
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced_lite/rive_fallback.wasm
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_lite/rive_fallback.wasm
fi

if target_enabled "canvas-lite"; then
    echo
    echo "::::: building @rive-app/canvas_advanced_lite"
    echo
    OUT_DIR=build/canvas_advanced_lite/bin/${WASM_CONFIG} ./build_wasm.sh -l ${WASM_CONFIG}
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced.mjs ../js/npm/canvas_advanced_lite/canvas_advanced.mjs
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced_lite/rive.wasm
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_lite/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_lite/rive_advanced.mjs.d.ts
fi

if target_enabled "canvas-single"; then
    echo
    echo "::::: building @rive-app/canvas_advanced_single"
    echo
    OUT_DIR=build/canvas_advanced_single/bin/${WASM_CONFIG} ./build_wasm.sh -c -s ${WASM_CONFIG}
    cp build/canvas_advanced_single/bin/${WASM_CONFIG}/canvas_advanced_single.mjs ../js/npm/canvas_advanced_single/canvas_advanced_single.mjs
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_single/rive_advanced.mjs.d.ts
fi

if target_enabled "canvas-lite-single"; then
    echo
    echo "::::: building @rive-app/canvas_advanced_lite_single"
    echo
    OUT_DIR=build/canvas_advanced_lite_single/bin/${WASM_CONFIG} ./build_wasm.sh -c -l -s ${WASM_CONFIG}
    # We probably don't need to create a package for the lite+single version for canvas
    # so no need to create a folder in npm to stage for publishing, but we'll keep the local
    # build for testing purposes, and let webpack reference the wasm/build for this package here
fi

if [ -z "$TARGETS" ]; then
    echo
    echo "::::: building @rive-app/webgl2_advanced fallback"
    echo
    OUT_DIR=build/webgl2_advanced/bin/${WASM_CONFIG} ./build_wasm.sh -c -r webgl2 ${WASM_CONFIG}
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive_fallback.wasm
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2/rive_fallback.wasm
fi

if target_enabled "webgl2"; then
    echo
    echo "::::: building @rive-app/webgl2_advanced"
    echo
    OUT_DIR=build/webgl2_advanced/bin/${WASM_CONFIG} ./build_wasm.sh -r webgl2 ${WASM_CONFIG}
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.mjs ../js/npm/webgl2_advanced/webgl2_advanced.mjs
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive.wasm
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl2_advanced/rive_advanced.mjs.d.ts
fi

if target_enabled "webgl2-single"; then
    echo
    echo "::::: building @rive-app/webgl2_advanced_single"
    echo
    OUT_DIR=build/webgl2_advanced_single/bin/${WASM_CONFIG} ./build_wasm.sh -r webgl2 -s ${WASM_CONFIG}
    # Don't build a package for this one. Just do the build so we can test it.
fi
