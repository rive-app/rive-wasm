#!/bin/bash
set -e

# Sets up the build structure expected by webpack and packs
#
# Flags:
#   -p          Build WASM with profiling config (--profiling-funcs).
#               Produces human-readable function names in Chrome DevTools Performance tab.
#               Usage: ./build.sh -p
#
#   -r <targets> LOCAL DEV ONLY. Comma-separated list of targets to build.
#               Skips all fallback WASM builds and only compiles + bundles the
#               specified targets. Faster iteration when testing a single package.
#               Available targets: canvas, canvas-lite, canvas-single,
#                 canvas-lite-single, webgl2, webgl2-single
#               Usage: ./build.sh -r canvas,webgl2

WASM_FLAGS=""
TARGETS=""
while getopts "pr:" flag; do
    case "${flag}" in
    p) WASM_FLAGS="$WASM_FLAGS -p" ;;
    r) TARGETS="${OPTARG}" ;;
    *) echo "Unknown flag: $flag" ;;
    esac
done

# create the build dir
mkdir -p dist

# copy the rive wasm js and type definitions files to build dir
pushd ../wasm
./build_all_wasm.sh $WASM_FLAGS ${TARGETS:+-r "$TARGETS"}
popd

# run webpack — pass targets via --env when specified, otherwise full build
if [ -n "$TARGETS" ]; then
    npm run build -- --env targets="$TARGETS"
else
    npm run build
fi
