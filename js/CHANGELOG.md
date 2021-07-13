# Rive.js Changelog

## 0.7.17
- Adds camelCase parameters, deprecates old ones.

## 0.7.16
- Fixes issue with strokes rendering when they have 0 thickness/width.

## 0.7.15
- Fixes memory leaks with instances of animations and state machines
- Adds `reset` function to Rive that will reset animations to their original state

## 0.7.14
- Includes a lean JS build that does not bundle the wasm binary - rive.lean.dev.js; this is intended for those who want to serve the wasm binary independently of the js code. The overall download size will be smaller as the wasm binary is base64 encoded in the bundled version. Use ```RuntimeLoader.setWasmUrl()``` to provide the runtime with the location of the wasm binary prior to creating Rive objects.

## 0.7.13
- Fixes README in npm

## 0.7.12
- Updates cpp to latest
- support for blend states in state machines

## 0.7.11
- Adds scrubbing functionality and example, contributed by [nilskj](https://github.com/nilskj)

## 0.7.10
- Fixes incorrect types path

## 0.7.9
- Promotes beta to stable
- Updates docs

## 0.7.8-beta.9 (Apr 22, 2021)
- Added ```onstatechange``` in constructor to listen for state changes in state machines

## 0.7.8-beta.8 (Apr 21, 2021)
- Added getting artboard bounds

## 0.7.8-beta.7 (Apr 20, 2021)
- Reworked playback tracking and event system under the hood
- Exposed ```startRendering``` and ```stopRendering``` functions

## 0.7.8-beta.6 (Apr 16, 2021)
- Fixes issue when ```pause``` or ```stop``` are called before file is initialized
- Updates Jest config to handle imported rive-canvas ES6 module

## 0.7.8-beta.5 (Apr 16, 2021)
- Fixes broken depenency in betas 3 & 4

## 0.7.8-beta.4 (Apr 16, 2021)
- Typescript type definitions are included in the package
- Adds unsubscribe from events

## 0.7.8-beta.3 (Apr 16, 2021)
- Updates how webpack packages the vanilla web version to make it work nicely with production builds and parcel

## 0.7.8-beta.2 (Apr 15, 2021)
- Updates to latest wasm
- Changes to packaging to fix importing issues in frameworks such as vue and parcel
- Adds parcel example
- rive-canvas is now integrated through package.json
- rive-canvas typescript definitions now used
- wasm binary is now embedded in the js package; no more behind the scenes fetch to retrieve it

## 0.7.8-beta.1 (Apr 13, 2021)
- State machine support
- Tweaks to rendering loop
## 0.7.7 (Apr 9, 2021)
- Fixes rendering bug

## 0.7.6 (Apr 9, 2021)
- Optimized draw/render loop to lay out animations only when necessary
- Fixes some layout issues when drawing a single frame

## 0.7.5 (Apr 7, 2021)
- BREAKING CHANGE: Layout constructor now takes a parameterized object instead of individual parameters
- BREAKING CHANGE: Rive constructor now takes a parameterized object instead of individual parameters
- `Layout.new` is deprecated; use `new Layout` with the same `LayoutParameters` object instead
- `Rive.new` is deprecated; use `new Rive` with the same `RiveParameters` object instead
- Render loop optimizations

## 0.7.4 (Apr 6, 2021)
- Refactored how Rive files are loaded
- Added tests for playing, looping and stopping animations

## 0.7.3 (Apr 5, 2021)
- Refactored how internal play states are being tracked
- Refactored loop events; loop events return the type of loop in the event
- Updated Wasm
## 0.7.2 (Apr 2, 2021)
- Updates Wasm package

## 0.7.1 (Mar 31, 2021)
- Fixes issue where the wrong wasm version could get downloaded

## 0.7.0 (Mar 31, 2021)
- Works only new v7 runtime; older Rive files should be re-exported to v7 from the editor.

## 0.6.1 (Mar 31, 2021)
- Fixes issue where the wrong wasm version could get downloaded

## 0.6.0 (Mar 31, 2021)
- Bumps version to 0.6.0 to match the runtime version it supports (v6)

## 0.1.0-beta.4 (Mar 29, 2021)
- Exposes drawFrame function
- Fixes bug when loading Rive files via the buffer
- Remove more legacy JS code

## 0.1.0-beta.3 (Mar 26, 2021)
- Code rewritten in Typescript
- Code now packaged with Webpack
- Two flavours are available: `/dist/rive.min.js` for embedding directly with a `<script>` tag, and `dist/rive.dev.js` exposes ES6 modules and suitable for use through npm with React, Next, etc.
- When using `dist/rive.min.js`, the api is accessible through the `rive` object, e.g. `rive.Rive.new({})`. With the ES6 module version, the API is directly accessible.
- Constructor for `Rive` objects uses standard parameters; for named parameters, use `Rive.new({})`.
- Constructor for `Layout` objects uses standard parameters; for named parameters, use `Layout.new({})`.
- `Layout` parameters `fit` and `alignment` are now string enums; either a string (e.g. "contain") or the enum (e.g. `Fit.Contain`) can be used.

## 0.0.4 (Mar 9, 2021)
- Moved internal Animation class to Typescript and tidied up getters

## 0.0.3 (Mar 8, 2021)
- Moved bunch of code to Typescript, added tests
- Renamed `CanvasAlignment` to `Layout` and created `Fit` and `Alignment` enums
- On the global/window context, renamed `RiveAnimation` to `Rive`
- On the global/window context, all Rive objects (except Rive itself) are now contained on the `Rive` object, and accessed like `Rive`, `Rive.Layout`, `Rive.Fit`, etc.

## 0.0.2 (Feb 27, 2021)
- Control of individual animation playback and mixing is much improved