#!/bin/bash
set -e

OPTIONS=0
PREMAKE_FLAGS=
WD=$(pwd)
NCPU=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)
export EMCC_CLOSURE_ARGS="--externs $WD/js/externs.js"
while getopts "s:r:" flag; do
    case "${flag}" in
    s)
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--single_file "
        ;;
    r)
        OPTIONS=$((OPTIONS + 2))
        if [ "${OPTARG}" = "skia" ]; then
            PREMAKE_FLAGS+="--skia "
        fi
        ;;
    *)
        # Alert users about unused/wrong flags.
        echo Unknown option flag "$flag"
        ;;
    esac
done
shift $OPTIONS
OPTION=$1

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
    premake5 gmake2 $PREMAKE_FLAGS && AR=emar CFLAGS=-DENABLE_QUERY_FLAT_VERTICES CXXFLAGS=-DENABLE_QUERY_FLAT_VERTICES CC=emcc CXX=em++ make config=release -j$NCPU
elif [ "$OPTION" = "release" ]; then
    premake5 gmake2 $PREMAKE_FLAGS && AR=emar CC=emcc CXX=em++ make config=release -j$NCPU
else
    premake5 gmake2 $PREMAKE_FLAGS && AR=emar CC=emcc CXX=em++ make -j$NCPU
fi
