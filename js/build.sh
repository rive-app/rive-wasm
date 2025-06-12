#!/bin/bash
set -e

# Sets up the build structure expected by webpack and packs

# create the build dir
mkdir -p dist

# copy the rive wasm js and type definitions files to build dir
pushd ../wasm
./build_all_wasm.sh
popd

# run web-pack
npm run build
