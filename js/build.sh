#!/bin/bash

# Sets up the build structure expected by webpack and packs

# create the build dir
mkdir -p build/lean

# copy the rive wasm js and type definitions files to build dir
cp ../wasm/publish/rive.lean.mjs ./build/lean/wasm.js
cp ../wasm/publish/types.d.ts ./build/lean/wasm.d.ts

# Copy the rive runtime file to build dir
cp src/rive.ts build/lean/

# Replace the import statement at the top
sed -i '' '1s/.*/import * as rc from '"'"'.\/wasm'"'"';/' build/lean/rive.ts

# run web-pack
npm run build