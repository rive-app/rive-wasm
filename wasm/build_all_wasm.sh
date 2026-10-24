#!/bin/bash
set -e

# -p          Build with profiling config (--profiling-funcs) instead of release.
#             Produces named WASM function symbols visible in Chrome DevTools.
# -i          Incremental build. Skips cleaning the build directory so only
#             changed C++ files are recompiled.
# -r <targets> For local dev. Comma-separated list of targets to build.
#             Skips all fallback WASM builds and only compiles the specified targets.
#             Available: canvas, canvas-lite, canvas-single, webgl2,
#             webgl2-threads (which needs webgl2 built as well)
# -s          Stage flavors already built by build_flavor.sh instead of
#             building them.
WASM_CONFIG=release
FLAVOR_FLAGS=""
TARGETS=""
INCREMENTAL=0
PREBUILT=0
while getopts "pir:s" flag; do
    case "${flag}" in
    p)
        WASM_CONFIG=profiling
        FLAVOR_FLAGS=-p
        ;;
    i) INCREMENTAL=1 ;;
    r) TARGETS="${OPTARG}" ;;
    s) PREBUILT=1 ;;
    *) echo "Unknown flag: $flag" ;;
    esac
done

# Returns 0 (true) if the given target is requested, or if no -r list was given (build all).
target_enabled() {
    [ -z "$TARGETS" ] && return 0
    echo ",$TARGETS," | grep -q ",${1},"
}

build() {
    if [ "$PREBUILT" -eq 0 ]; then
        ./build_flavor.sh $FLAVOR_FLAGS "$1"
    fi
}

# Both wasm binaries share one JS glue, so they must expose the same import and
# export names and signatures. Verify this when building all wasm.
# Executes on full builds only -- a -r build has no fallback. One call per
# build: the base and _advanced packages are handed the same bytes.
verify_fallback() {
    if [ -n "$TARGETS" ]; then
        return 0
    fi
    local pkg="../js/npm/$1"
    if [ ! -f "$pkg/rive_fallback.wasm" ]; then
        echo "ERROR: $1: rive_fallback.wasm was not staged by this full build." >&2
        echo "       Publishing now would ship a package whose fallback URL 404s." >&2
        return 1
    fi
    if cmp -s "$pkg/rive.wasm" "$pkg/rive_fallback.wasm"; then
        echo "ERROR: $1: rive.wasm is the same binary as its fallback." >&2
        echo "       Every browser would get the build without SIMD." >&2
        return 1
    fi
    python3 ./verify_fallback_abi.py "$pkg/rive.wasm" "$pkg/rive_fallback.wasm"
}

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

rm -f ../js/npm/webgl2/*.mjs
rm -f ../js/npm/webgl2/*.wasm

rm -f ../js/npm/webgl2_threads/*.mjs
rm -f ../js/npm/webgl2_threads/*.wasm

mkdir -p ../js/npm/canvas
mkdir -p ../js/npm/canvas_lite
mkdir -p ../js/npm/canvas_single
mkdir -p ../js/npm/canvas_advanced
mkdir -p ../js/npm/canvas_advanced_lite
mkdir -p ../js/npm/canvas_advanced_single
mkdir -p ../js/npm/webgl2
mkdir -p ../js/npm/webgl2_advanced
mkdir -p ../js/npm/webgl2_threads

if [ "$INCREMENTAL" -eq 0 ] && [ "$PREBUILT" -eq 0 ]; then
    echo
    echo "::::: cleaning all projects"
    echo
    rm -fR ./build
fi

if [ -z "$TARGETS" ]; then
    build canvas_advanced_fallback
    cp build/canvas_advanced_fallback/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced/rive_fallback.wasm
    cp build/canvas_advanced_fallback/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas/rive_fallback.wasm
fi

if target_enabled "canvas"; then
    build canvas_advanced
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.mjs ../js/npm/canvas_advanced/canvas_advanced.mjs
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas_advanced/rive.wasm
    cp build/canvas_advanced/bin/${WASM_CONFIG}/canvas_advanced.wasm ../js/npm/canvas/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced/rive_advanced.mjs.d.ts
    verify_fallback canvas
fi

if [ -z "$TARGETS" ]; then
    build canvas_advanced_lite_fallback
    cp build/canvas_advanced_lite_fallback/bin/${WASM_CONFIG}/canvas_advanced_c2d_only.wasm ../js/npm/canvas_advanced_lite/rive_fallback.wasm
    cp build/canvas_advanced_lite_fallback/bin/${WASM_CONFIG}/canvas_advanced_c2d_only.wasm ../js/npm/canvas_lite/rive_fallback.wasm
fi

if target_enabled "canvas-lite"; then
    build canvas_advanced_lite
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced_c2d_only.mjs ../js/npm/canvas_advanced_lite/canvas_advanced.mjs
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced_c2d_only.wasm ../js/npm/canvas_advanced_lite/rive.wasm
    cp build/canvas_advanced_lite/bin/${WASM_CONFIG}/canvas_advanced_c2d_only.wasm ../js/npm/canvas_lite/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_lite/rive_advanced.mjs.d.ts
    verify_fallback canvas_lite
fi

if target_enabled "canvas-single"; then
    build canvas_advanced_single
    cp build/canvas_advanced_fallback/bin/${WASM_CONFIG}/canvas_advanced_single.mjs ../js/npm/canvas_advanced_single/canvas_advanced_single.mjs
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/canvas_advanced_single/rive_advanced.mjs.d.ts
fi

if [ -z "$TARGETS" ]; then
    build webgl2_advanced_fallback
    cp build/webgl2_advanced_fallback/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive_fallback.wasm
    cp build/webgl2_advanced_fallback/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2/rive_fallback.wasm
fi

if target_enabled "webgl2"; then
    build webgl2_advanced
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.mjs ../js/npm/webgl2_advanced/webgl2_advanced.mjs
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2_advanced/rive.wasm
    cp build/webgl2_advanced/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2/rive.wasm
    cp ../js/src/rive_advanced.mjs.d.ts ../js/npm/webgl2_advanced/rive_advanced.mjs.d.ts
    verify_fallback webgl2
fi

if target_enabled "webgl2-threads"; then
    build webgl2_threads
    cp build/webgl2_threads/bin/${WASM_CONFIG}/webgl2_advanced.mjs ../js/npm/webgl2_threads/webgl2_threads.mjs
    cp build/webgl2_threads/bin/${WASM_CONFIG}/webgl2_advanced.wasm ../js/npm/webgl2_threads/rive_threads.wasm
    # Pages that cannot run threads load webgl2's own build.
    cp ../js/npm/webgl2/rive.wasm ../js/npm/webgl2_threads/rive.wasm
    if [ -f ../js/npm/webgl2/rive_fallback.wasm ]; then
        cp ../js/npm/webgl2/rive_fallback.wasm ../js/npm/webgl2_threads/rive_fallback.wasm
    fi
    verify_fallback webgl2_threads
fi
