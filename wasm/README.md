# rive-wasm

Wasm/JS runtime for Rive

## submodules

This repository uses submodules. To clone it, you can run the following:

`git clone --recurse-submodules git@github.com:rive-app/rive-wasm.git`

## building

Rive's Wasm build requires a patched version of Emscripten so that it can take full advantage of the ```no-rtti``` compiler directive, which helps to keep the runtime size small.

Run ```source setup_build_tools.sh``` from the root folder of the repository to download, configure, and compile Emscripten. The script will also set environment variables, now you can build the Wasm/js runtimes by running ```./build.sh```.

If you start a new terminal, you will need to run `source setup_build_tools.sh` again before running `./build.sh`.
