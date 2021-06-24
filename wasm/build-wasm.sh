#!/bin/bash

OPTION=$1
MODE=debug

if [ "$OPTION" = 'help' ]; then
    echo build.sh - build debug library
    echo build.sh clean - clean the build
    echo build.sh release - build release library
    exit 0
elif [ "$OPTION" = "clean" ]; then
    echo Cleaning project ...
    rm -fR ./build
    exit 0
elif [ "$OPTION" = "tools" ]; then
    premake5 gmake2 && AR=emar CFLAGS=-DENABLE_QUERY_FLAT_VERTICES CXXFLAGS=-DENABLE_QUERY_FLAT_VERTICES CC=emcc CXX=em++ make config=release -j7
elif [ "$OPTION" = "release" ]; then
    MODE=release
    premake5 gmake2 && AR=emar CC=emcc CXX=em++ make config=release -j7
else
    premake5 gmake2 && AR=emar CC=emcc CXX=em++ make -j7
fi

OUTPUT_DIR=bin/$MODE
FILE_EXTENSION=mjs
OUTPUT_FILE=rive
WASM=1

mkdir -p build
pushd build &>/dev/null

# make the output directory if it doesn't exist
mkdir -p $OUTPUT_DIR


awk 'NR==FNR { a[n++]=$0; next }
/console\.log\("--REPLACE WITH RENDERING CODE--"\);/ { for (i=0;i<n;++i) print a[i]; next }
1' ../js/renderer.js ./bin/$MODE/$OUTPUT_FILE.$FILE_EXTENSION >./bin/$MODE/rive-combined.$FILE_EXTENSION

if ! command -v terser &>/dev/null; then
    npm install terser -g
fi
terser --compress --mangle -o ./bin/$MODE/$OUTPUT_FILE.min.$FILE_EXTENSION -- ./bin/$MODE/rive-combined.$FILE_EXTENSION

# Encode the wasm binary into string and wrap in js
# node ../scripts/wasm2str.js ./bin/$MODE/rive.wasm ./bin/$MODE/rive_wasm.js

# copy to publish folder
cp ./bin/$MODE/rive-combined.$FILE_EXTENSION ../publish/$OUTPUT_FILE.$FILE_EXTENSION
cp ./bin/$MODE/$OUTPUT_FILE.min.$FILE_EXTENSION ../publish/$OUTPUT_FILE.min.$FILE_EXTENSION
# cp ./bin/$MODE/rive.wasm ../publish/rive.wasm
# cp ./bin/$MODE/rive_wasm.js ../publish/rive_wasm.js
cp ./bin/$MODE/rive-combined.mjs ./bin/$MODE/rive.module.js

popd &>/dev/null


