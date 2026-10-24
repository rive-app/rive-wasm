#!/bin/bash
set -e

# Builds one wasm flavor into build/<dir>/bin/<config>, where build_all_wasm.sh
# stages it from. The release workflow builds each flavor on its own runner.
#
# Usage: ./build_flavor.sh [-p] <flavor>
# -p          Build with profiling config (--profiling-funcs) instead of release.
WASM_CONFIG=release
while getopts "p" flag; do
    case "${flag}" in
    p) WASM_CONFIG=profiling ;;
    *) echo "Unknown flag: $flag" ;;
    esac
done
shift $((OPTIND - 1))

DIR=$1
case "$1" in
canvas_advanced_fallback) FLAGS="-w -c" ;;
canvas_advanced) FLAGS="-w" ;;
canvas_advanced_lite_fallback) FLAGS="-c -l -r c2d_only" ;;
canvas_advanced_lite) FLAGS="-l -r c2d_only" ;;
canvas_advanced_single)
    # Compiles like the canvas fallback and only links differently, so it
    # reuses the fallback's objects.
    FLAGS="-w -c -s"
    DIR=canvas_advanced_fallback
    ;;
webgl2_advanced_fallback) FLAGS="-w -c -r webgl2" ;;
webgl2_advanced) FLAGS="-w -r webgl2" ;;
webgl2_threads) FLAGS="-w -m -r webgl2" ;;
*)
    echo "Unknown flavor: $1" >&2
    exit 1
    ;;
esac

echo
echo "::::: building $1"
echo
OUT_DIR=build/$DIR/bin/$WASM_CONFIG ./build_wasm.sh $FLAGS $WASM_CONFIG
