#!/bin/bash

set -e

# Sets up the build structure expected by webpack and packs

# create the build dir
mkdir -p dist

# copy the rive wasm js and type definitions files to build dir
if [ ! -f ../wasm/publish/rive.mjs ]; then 
    pushd ../wasm
    ./build-all-wasm.sh
    popd
fi

# run web-pack
npm run build