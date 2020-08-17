# rive-wasm
Wasm/JS runtime for Rive

## building
Rive's Wasm build requires a patched version of Emscripten so that it can take full advantage of the ```no-rtti``` compiler directive, which helps to keep the runtime size small.

Run the ```setup_build_tools.sh``` to download, configure, and compile Emscripten, and then run ```custom_emcc/emsdk/emsdk_env.sh``` to activate the tool chain environment.

With that in place, run ```./build.sh``` to build the Wasm/js runtime.