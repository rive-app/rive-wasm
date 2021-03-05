# Rive.js Changelog

## 0.0.3 (Mar 4, 2021)
- Moved layout code to Typescript, added tests
- Renamed `CanvasAlignment` to `Layout` and created `Fit` and `Alignment` enums
- On the global/window context, renamed RiveAnimation to Animation 
- On the global/window context, all Rive objects are now contained in a `Rive` object, and accessed like `Rive.Animation`, `Rive.Layout`, etc.
## 0.0.2 (Feb 27, 2021)
- control of individual animation playback and mixing is much improved