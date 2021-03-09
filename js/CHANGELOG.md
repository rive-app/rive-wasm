# Rive.js Changelog

## 0.0.4 (Mar 9, 2021)
- Moved internal Animation class to Typescript and tidied up getters

## 0.0.3 (Mar 8, 2021)
- Moved bunch of code to Typescript, added tests
- Renamed `CanvasAlignment` to `Layout` and created `Fit` and `Alignment` enums
- On the global/window context, renamed `RiveAnimation` to `Rive`
- On the global/window context, all Rive objects (except Rive itself) are now contained on the `Rive` object, and accessed like `Rive`, `Rive.Layout`, `Rive.Fit`, etc.

## 0.0.2 (Feb 27, 2021)
- Control of individual animation playback and mixing is much improved