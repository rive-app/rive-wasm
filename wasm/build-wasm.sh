#!/bin/bash

OPTION=$1

if [ "$OPTION" = 'help' ]; then
    echo build.sh - build debug library
    echo build.sh clean - clean the build
    echo build.sh release - build release library
elif [ "$OPTION" = "clean" ]; then
    echo Cleaning project ...
    rm -fR ./build
elif [ "$OPTION" = "release" ]; then
    premake5 gmake2 && AR=emar CC=emcc CXX=em++ make config=release -j7
else
    premake5 gmake2 && AR=emar CC=emcc CXX=em++ make -j7
fi


