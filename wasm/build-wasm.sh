#!/bin/bash

OUTPUT_DIR=bin/release

mkdir -p build
pushd build &>/dev/null

# make the output directory if it dont's exist
mkdir -p $OUTPUT_DIR

em++ -Oz \
    --js-opts 0 -g1 \
    --closure 0 \
    --bind \
    -g1 \
    -o $OUTPUT_DIR/rive.mjs \
    -s ASSERTIONS=0 \
    -s FORCE_FILESYSTEM=0 \
    -s MODULARIZE=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s STRICT=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s DISABLE_EXCEPTION_CATCHING=1 \
    -s WASM=1 \
    -s SINGLE_FILE=0 \
    -s USE_ES6_IMPORT_META=0 \
    -s EXPORT_NAME="Rive" \
    -s LLD_REPORT_UNDEFINED \
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

cp ./bin/release/rive.wasm ../publish/rive.wasm

popd &>/dev/null
