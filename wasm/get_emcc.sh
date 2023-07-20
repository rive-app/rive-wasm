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
