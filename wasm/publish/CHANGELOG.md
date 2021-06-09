# Rive Wasm Changelog

## 0.7.6
- Updates C++ to latest
- Adds delete function to instance types

## 0.7.5
- Includes a lean JS build that does not bundle the wasm binary - rive.lean.(m)js; this is intended for those who want to serve the wasm binary independently of the js code

## 0.7.4
- Updates C++ to latest
- Support for blend states

## 0.7.3
- Updates C++ to latest
- Adds functions to make detecting state changes in state machines easier

## 0.7.2
- Exposes enableWorkArea property
- Adds simple examples primarily designed to test buiilds
- Refactors build scripts
- Now generates both ES6 module and vanilla versions of the wasm runtime
- Updates to latest cpp
- Updates ts type definitions

## 0.7.1
- Updates Wasm build to the latest rive-cpp

## 0.7.0
- Works with the new v7 runtime format; older Rive files should be re-exported from the editor, or use v0.6.13