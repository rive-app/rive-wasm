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
