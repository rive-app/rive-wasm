#!/bin/bash

OUTPUT_DIR=bin/release

if [ $# -ne 1 ]; then
    echo "usage: build.sh <es6|es5|es6pure|es5pure>"
    exit 1
fi

if [ "$1" == "es6" ]; then
    FILE_EXTENSION=mjs
    OUTPUT_FILE=rive
    WASM=1
elif [ "$1" == "es5" ]; then
    FILE_EXTENSION=js
    OUTPUT_FILE=rive
    WASM=1
elif [ "$1" == "es6pure" ]; then
    FILE_EXTENSION=mjs
    OUTPUT_FILE=rive.pure
    WASM=0
elif [ "$1" == "es5pure" ]; then
    FILE_EXTENSION=js
    OUTPUT_FILE=rive.pure
    WASM=0
else
    echo "incorrect type: build.sh <es6|es5|es6pure|es5pure>"
    exit 1
fi


mkdir -p build
pushd build &>/dev/null

# make the output directory if it dont's exist
mkdir -p $OUTPUT_DIR

em++ -Oz \
    --closure 0 \
    --bind \
    -g1 \
    -o $OUTPUT_DIR/$OUTPUT_FILE.$FILE_EXTENSION \
    -s ASSERTIONS=0 \
    -s FORCE_FILESYSTEM=0 \
    -s MODULARIZE=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s STRICT=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s DISABLE_EXCEPTION_CATCHING=1 \
    -s WASM=$WASM \
    -s SINGLE_FILE=1 \
    -s USE_ES6_IMPORT_META=0 \
    -s EXPORT_NAME="Rive" \
    -DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0 \
    -DSINGLE \
    -DANSI_DECLARATORS \
    -DNDEBUG \
    -Wno-c++17-extensions \
    -fno-exceptions \
    -fno-rtti \
    -fno-unwind-tables \
    -I../submodules/rive-cpp/include \
    --no-entry \
    --post-js ../js/marker.js \
    ../submodules/rive-cpp/src/*/*.cpp \
    ../submodules/rive-cpp/src/*.cpp \
    ../submodules/rive-cpp/src/core/field_types/*.cpp \
    ../submodules/rive-cpp/src/shapes/paint/*.cpp \
    ../src/bindings.cpp

awk 'NR==FNR { a[n++]=$0; next }
/console\.log\("--REPLACE WITH RENDERING CODE--"\);/ { for (i=0;i<n;++i) print a[i]; next }
1' ../js/renderer.js ./bin/release/$OUTPUT_FILE.$FILE_EXTENSION >./bin/release/rive-combined.$FILE_EXTENSION

if ! command -v terser &>/dev/null; then
    npm install terser -g
fi
terser --compress --mangle -o ./bin/release/$OUTPUT_FILE.min.$FILE_EXTENSION -- ./bin/release/rive-combined.$FILE_EXTENSION

# Encode the wasm binary into string and wrap in js
# node ../scripts/wasm2str.js ./bin/release/rive.wasm ./bin/release/rive_wasm.js

# copy to publish folder
cp ./bin/release/rive-combined.$FILE_EXTENSION ../publish/$OUTPUT_FILE.$FILE_EXTENSION
cp ./bin/release/$OUTPUT_FILE.min.$FILE_EXTENSION ../publish/$OUTPUT_FILE.min.$FILE_EXTENSION
# cp ./bin/release/rive.wasm ../publish/rive.wasm
# cp ./bin/release/rive_wasm.js ../publish/rive_wasm.js

popd &>/dev/null
