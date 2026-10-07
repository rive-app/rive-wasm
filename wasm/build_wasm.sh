#!/bin/bash
set -e

source ./get_emcc.sh

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
            PREMAKE_URL=https://github.com/premake/premake-core/releases/download/v5.0.0-beta7/premake-5.0.0-beta7-macosx.tar.gz
        else
            PREMAKE_URL=https://github.com/premake/premake-core/releases/download/v5.0.0-beta7/premake-5.0.0-beta7-linux.tar.gz
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

# if ! command -v em++ &>/dev/null; then
#     if [[ ! -f "bin/emsdk/emsdk_env.sh" ]]; then
#         mkdir -p bin
#         pushd bin
#         git clone https://github.com/emscripten-core/emsdk.git
#         pushd emsdk
#         ./emsdk install 3.1.61
#         ./emsdk activate 3.1.61
#         popd
#         popd
#     fi
#     source ./bin/emsdk/emsdk_env.sh
# else
#     echo using your custom installed emsdk
# fi

OPTIONS=1
# LTO grows the binary in every configuration here.
PREMAKE_FLAGS="--arch=wasm --out=$OUT_DIR --no-lto "
PREMAKE_HEAVY_FLAGS="--with_rive_text --with_rive_audio=system --with_rive_layout --with_rive_scripting "
RENDERER_FLAGS="--renderer=c2d --no-rive-decoders "
WD=$(pwd)
NCPU=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)
export EMCC_CLOSURE_ARGS="--externs $WD/js/externs.js"
while getopts "clswtr:" flag; do
    case "${flag}" in
    c)
        # compatibility mode, disable simd
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--no-wasm-simd "
        ;;
    l)
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_HEAVY_FLAGS=
        ;;
    s)
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--wasm_single "
        ;;
    w)
        # wasm script modules, run on the browser's engine beside Luau
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--scripting_vm=both "
        ;;
    t)
        # Runs unsigned script modules, for test builds of locally baked files
        OPTIONS=$((OPTIONS + 1))
        PREMAKE_FLAGS+="--with_rive_tools "
        ;;
    r)
        OPTIONS=$((OPTIONS + 2))
        if [ "${OPTARG}" = "webgl2" ]; then
            # with_rive_canvas brings in the ore GL backend and the deferred
            # host layer for the synchronous deferred renderer.
            RENDERER_FLAGS="--renderer=webgl2 --no-rive-decoders --with_rive_canvas "
        elif [ "${OPTARG}" = "c2d" ]; then
            # Images decode in JS, so the renderer's built-in decoding is
            # unreachable here and its symbols would go unresolved.
            RENDERER_FLAGS="--renderer=c2d --no-rive-decoders "
        elif [ "${OPTARG}" = "c2d_only" ]; then
            RENDERER_FLAGS="--renderer=c2d_only "
        else
            echo Unknown renderer "${OPTARG}"
            exit 1
        fi
        ;;
    *)
        # Alert users about unused/wrong flags.
        echo Unknown option flag "$flag"
        ;;
    esac
done
OPTION=${!OPTIONS}
PREMAKE_FLAGS+=$RENDERER_FLAGS
PREMAKE_FLAGS+=$PREMAKE_HEAVY_FLAGS
if [[ ! -d "../../runtime" ]]; then
    PREMAKE_FLAGS+="--scripts=./submodules/rive-runtime/build "
else
    PREMAKE_FLAGS+="--scripts=../../runtime/build "
fi

# The link does not track its --pre-js input, so a changed bundle would
# otherwise be silently left out.
BUNDLE=../../runtime/src/wasm/web/rive_scripting_pre.js
if [[ "$PREMAKE_FLAGS" == *scripting_vm=both* ]]; then
    for glue in "$OUT_DIR"/*.mjs; do
        if [[ $BUNDLE -nt $glue ]]; then
            rm -f "$glue" "${glue%.mjs}.wasm"
        fi
    done
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
elif [ "$OPTION" = "profiling" ]; then
    $PREMAKE gmake2 $PREMAKE_FLAGS --config=release --profiling-funcs && make -C $OUT_DIR -j$NCPU
elif [ "$OPTION" = "release" ]; then
    $PREMAKE gmake2 $PREMAKE_FLAGS --config=release gmake2 && make -C $OUT_DIR -j$NCPU
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
