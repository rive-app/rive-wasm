if [[ ! -f "bin/emsdk/emsdk_env.sh" ]]; then
    mkdir -p bin
    pushd bin
    git clone https://github.com/emscripten-core/emsdk.git
    pushd emsdk
    ./emsdk install 3.1.44
    ./emsdk activate 3.1.44
    popd
    popd
fi
source ./bin/emsdk/emsdk_env.sh
