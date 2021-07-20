#!/bin/bash

set -e

# Sets up the build structure expected by webpack and packs

# create the build dir
mkdir -p build/lean
mkdir -p dist

# copy the rive wasm js and type definitions files to build dir
if [ ! -f ../wasm/publish/rive.mjs ]; then 
    pushd ../wasm
    ./build.sh
    popd
fi
cp ../wasm/publish/rive.mjs ./dist/rive_canvas.js
cp ../wasm/publish/types.d.ts ./dist/rive_canvas.d.ts
cp ../wasm/publish/rive.lean.mjs ./build/lean/wasm.js
cp ../wasm/publish/types.d.ts ./build/lean/wasm.d.ts

# Copy the rive runtime file to build dir
cp src/rive.ts build/lean/

# Replace the import statement at the top
if [ "$(uname)" == "Darwin" ]; then
    sed -i '' '1s/.*/import * as rc from '"'"'.\/wasm'"'"';/' build/lean/rive.ts
else
    sed -i '1s/.*/import * as rc from '"'"'.\/wasm'"'"';/' build/lean/rive.ts
fi

# run web-pack
npm run build