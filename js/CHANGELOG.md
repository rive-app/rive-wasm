# Rive.js Changelog

## 0.7.2
- Updates Wasm package

## 0.7.1
- Fixes issue where the wrong wasm version could get downloaded

## 0.7.0
- Works with new v7 runtime; older Rive files should be re-exported from the editor

## 0.6.0
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