#!/bin/bash
set -e

# get premake
if ! command -v premake5 &>/dev/null; then
    if [[ ! -f "bin/premake5" ]]; then
        unameOut="$(uname -s)"
        case "${unameOut}" in
        Linux*) MACHINE=linux ;;
        Darwin*) MACHINE=mac ;;
        CYGWIN*) MACHINE=cygwin ;;
        MINGW*) MACHINE=mingw ;;
        *) MACHINE="UNKNOWN:${unameOut}" ;;
        esac

        mkdir -p bin
        pushd bin
        echo Downloading Premake5
        if [ "$MACHINE" = 'mac' ]; then
            PREMAKE_URL=https://github.com/premake/premake-core/releases/download/v5.0.0-beta2/premake-5.0.0-beta2-macosx.tar.gz
        else
            PREMAKE_URL=https://github.com/premake/premake-core/releases/download/v5.0.0-beta2/premake-5.0.0-beta2-linux.tar.gz
        fi
        curl $PREMAKE_URL -L -o premake.tar.gz
        # Export premake5 into bin
        tar -xvf premake.tar.gz 2>/dev/null
        # Delete downloaded archive
        rm premake.tar.gz
        popd
    fi
    export PREMAKE=$PWD/bin/premake5
else
    export PREMAKE=premake5
fi

if ! command -v em++ &>/dev/null; then
    if [[ ! -f "bin/emsdk/emsdk_env.sh" ]]; then
        mkdir -p bin
        pushd bin
        git clone https://github.com/emscripten-core/emsdk.git
        pushd emsdk
        ./emsdk install latest
        ./emsdk activate latest
        popd
        popd
    fi
    source ./bin/emsdk/emsdk_env.sh
else
    echo using your custom installed emsdk
fi

OPTIONS=0
PREMAKE_FLAGS="--arch=wasm --out=$OUT_DIR "
PREMAKE_HEAVY_FLAGS="--with_rive_text --with_rive_audio=system "
WD=$(pwd)
NCPU=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)
export EMCC_CLOSURE_ARGS="--externs $WD/js/externs.js"
while getopts "ls:r:" flag; do
    case "${flag}" in
    l)
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_HEAVY_FLAGS=
        ;;
    s)
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--wasm_single "
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
PREMAKE_FLAGS+=$PREMAKE_HEAVY_FLAGS
if [[ ! -d "../../runtime" ]]; then
    PREMAKE_FLAGS+="--scripts=./submodules/rive-cpp/build "
else
    PREMAKE_FLAGS+="--scripts=../../runtime/build "
fi

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
    $PREMAKE gmake2 $PREMAKE_FLAGS && CFLAGS=-DENABLE_QUERY_FLAT_VERTICES CXXFLAGS=-DENABLE_QUERY_FLAT_VERTICES make -C $OUT_DIR -j$NCPU
elif [ "$OPTION" = "release" ]; then
    $PREMAKE gmake2 --release $PREMAKE_FLAGS gmake2 && make -C $OUT_DIR -j$NCPU
else
    $PREMAKE gmake2 $PREMAKE_FLAGS && make -C $OUT_DIR -j$NCPU
fi

# If you want to run the leak checker with debug symbols, copy
# canvas_advanced.wasm to the parcel example's assets folder. Commented out for
# now as it should only happen if you're not building single and the canvas
# version.
# ----
# du build/bin/debug/canvas_advanced.wasm
# cp build/bin/debug/canvas_advanced.wasm examples/parcel_example/assets/canvas_advanced.wasm
