#!/bin/bash
echo Building Wasm ...
./build-wasm.sh
echo Building JS ...
./build-js.sh
echo Transpiling ...

pushd ./publish &>/dev/null

npm install
npm run transpile
npm run minify

popd &>/dev/null