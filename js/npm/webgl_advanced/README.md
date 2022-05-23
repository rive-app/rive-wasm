![npm](https://img.shields.io/npm/v/@rive-app/webgl-advanced)

# Rive 
Low-level Rive API using WebGL. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

## WebGL Advanced
```
npm install @rive-app/webgl-advanced
```
A low-level Rive API using the [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) renderer. It has the same benefits as the regular `@rive-app/webgl` package plus:
- Full control over the update and render loop.
- Allows for rendering multiple Rive artboards to a single canvas.
- Allows deeper control and manipulation of the components in a Rive hierarchy.
- Web Assembly (WASM) is part of the NPM bundle, but you load in the WASM manually

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)
