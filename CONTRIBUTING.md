# Contributing

We love contributions! If you want to run the project locally to test out changes, run the examples, or just see how things work under the hood, read on below.

## Local development

There are a lot of facets that this runtime exports, so make sure you read up below on the Background section first.

### Background

This runtime is driven by a lower-level [rive-cpp](https://github.com/rive-app/rive-cpp) runtime that defines an abstract renderer. There are two main variants of this runtime, separated into different NPM packages at build and publish time:
- [Canvas](https://www.npmjs.com/package/@rive-app/canvas)
- [WebGL](https://www.npmjs.com/package/@rive-app/webgl)

The methods and structs defined in rive-cpp that provide the base of this rive-wasm runtime are compiled and bound to JS classes and functions via [Web Assembly](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)(WASM) through a tool called [Emscripten](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html). You'll notice this in the `wasm/src/` folder.

For each of the variants above, there are two sets of APIs to use for rendering Rives in web applications:
- High-level JS API - in the `js/` folder, defining high-level class API's most consumers will use when displaying Rives in web applications.
  - Use cases:
    - Simple displaying of animations or state machines
    - Basic control over state machines (i.e grabbing references to state machine inputs to drive in the web app)
- Low-level API - in the `wasm/` folder, defining Emscripten bindings that expose lower-level C++ functionality into generated JavaScript classes and functions. These exposed classes include pieces like `ArtboardInstance`, `LinearAnimationInstance`, and `StateMachineInstance` classes, and many more that help users build a render loop themselves to display Rives. This allows users to instance multiple artboards, state machines, etc. in one render loop and canvas to get granular control over how scenes operate.
  - **Note**: Most people will not use this functionality, but this may the solution to common questions like:
    - How can I dynamically combine multiple files/artboards to create a scene in one canvas?
    - How can I control the speed of animations?
    - How can I control hit detection of certain nodes?
    - How can I get coordinates of certain nodes or bones at any given point in the animation cycle?
  - The WASM compiled from the underlying cpp layer can be used with any concrete renderer - in case users want to hook it up themselves

### Installation

1. Clone the project down
2. `cd` into the `js` folder from the top level of the project, and run `npm i` to install all dependencies
3. Pull down the underlying `rive-cpp` submodule, which should be pointing to a specific commit.

```sh
# First time through if you just pulled down the project
git submodule update --init --recursive

# When updating the submodule after the initial pull
git submodule update --recursive

cd submodules/rive-cpp
git checkout origin/master
cd ../../..
```

4. Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html). We build against 3.1.20 in rive-wasm
5. Install [Premake5](https://premake.github.io/) and add it to your path

6. `cd` back into the `js` folder and run `./build.sh` from your terminal/shell to build the latest WASM and builds for JS API's (high and low level) into the `npm/` folder. This may take some time, grab a coffee! This should finish with Webpack building the JS bundles for the high-level API packages (more on that below)

### High-level API development

If you want to work on the exposed high-level API, `cd` into the `js/src` folder at the top level.

There are two main files to be concerned with when making changes:
- `rive.ts` - The main file defining the API exposed to consumers
  - Loads the WASM file that powers this runtime under the hood
  - Defines the `Rive` class which allows for instantiating the Rive file, loading animations, state machines, and exposing of methods to control such things
  - Exports funcionality above, as well as some types for TypeScript consumers
- `rive_advanced.mjs.d.ts` - The main types definition file for low-level API
  - Defines types for the low-level API classes and functions
  - These are exported in the high-level API packages, as well as low-level ones too

There are some utils defined in the `src` folder as well. When working on the main JS runtime, you'll probably be working in the `rive.ts` file. When you make changes, you can create a new build by simply running the following command inside the `js/` folder:

```sh
# Webpack creates the build
npm run build
```

#### Running the example application

There are a few example projects that use the high-level API and reference the local builds. Use these projects to help test any changes made to ensure no breaking functionality.

1. `cd` into `js/examples/_frameworks/parcel_example_canvas` to run a simple Rive gallery app
2. Run `npm i` inside that parcel-based project to install the dependencies for the example app
3. Run `npm start` and navigate to `http://localhost:1234` where the server runs
4. Any changes made to the example app will reflect on save. Feel free to integrate other Rives to display in this gallery app.

In this project, it references the local version of `@rive-app/canvas-single` which is in `js/npm/canvas_single`. The `*-single` version packages are builds that have the WASM encoded inside the JS of the bundle, rather than a separate file inside the bundle, as seen in the non-single version packages (i.e `@rive-app/canvas`). The `*-single` versions are used in the example applications for ease of setup and debugging.

### Low-level API development

If you want to work on the underlying JS classes and methods exposed through the compiled WASM, `cd` into the `wasm/` folder at the top level.

To check out the Emscripten bindings from cpp to JS, look at the `wasm/src/bindings.cpp` file (`bindings_c2d` for canvas-specific bindings, `bindings_skia` for WebGL specific bindings).

The files in `wasm/js` (specifically `renderer.js` and `skia_renderer.js`) use the [Canvas2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) and [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) renderers respectfully to expose and implement bindings for drawing to the canvas.

If you're looking to alter or add bindings as a result of a change or new feature in rive-cpp, you'll work with these files (most likely starting with the `bindings.cpp` first). When making changes, you will have to re-build WASM to test them out in an app (`js/build.sh` script). When changing or adding low-level API functionality for the high-level API, ensure that the `js/src/rive_advanced.mjs.d.ts` types file is updated accordingly. This ensures types are up-to-date with any changes.

The `build.sh` script makes all the WASM submodules for different packages; this can be a long process. If you're iterating on bindings or even cpp runtime submodule files, you can make it faster by doing the following things:
- In `wasm/build_all_wasm.sh`:
  - Comment out the line where it makes Skia (if you already ran this script and built it)
  - Comment out the lines where it calls `./build_wasm.sh release` on the packages you're not testing against (i.e only want to iterate on Canvas2D instead of WebGL)

#### Running the example application

There are a few example projects that use the low-level APIs and reference the local builds.

1. `cd` into `wasm/examples/parcel_example` to run a simple Rive gallery app similar to the high-level example app, but constructing a render loop manually
2. Run `npm i` inside that parcel-based project to install the dependencies for the example app
3. Run `npm start` and navigate to `http://localhost:1234` where the server runs
4. Any changes made to the example app will reflect on save. Feel free to integrate other Rives to display in this gallery app.

In this project, it references the local version of `@rive-app/canvas-advanced-single` which is in `js/npm/canvas_advanced_single`. The `*-single` version packages are builds that have the WASM encoded inside the JS of the bundle, rather than a separate file inside the bundle, as seen in the non-single version packages (i.e `@rive-app/canvas`). The `*-single` versions are used in the example applications for ease of setup and debugging.

### Code Formatting

The C++ code is formatted using ClangFormat. The JS code is formatted using Prettier. Configuration files are included for both. VSCode will pick them up directly if you have the Prettier and ClangFormat extensions installed.

### Testing

We also have a suite of unit tests against the high-level API. When adding or changing functionality, add a test in the `js/test/rive.test.ts` if necessary.

To run the test suite:

```sh
# Top level of the project
cd js
npm test
```

## Making changes

When you're ready to make changes, push up to a feature branch off of the `master` branch. Create a pull request to this repository in Github. When creating commit messages, please be as descriptive as possible to the changes being made.

For example, if the change is simply a bug fix or patch change:

```
git commit -m "Fix: Fixing a return type from computeAlignment"
```

Or if it's simply a docs change:

```
git commit -m "Docs: Adding a new link for another example page"
```

For minor/major version releases, also ensure you preface commit messages with:

```
git commit -m "Major: Restructuring the useRive API with new parameters"
```

These messages help make the changelog clear as to what changes are made for future devs to see.

When pull requests are merged, the runtime will automatically deploy the next NPM version. By default, patch versions are published. The changes are built and deployed to all the variant rive-wasm packages, which you can find [here](https://help.rive.app/runtimes/overview/web-js/canvas-vs-webgl).


You can find the deploy scripts in `.github/` to see the logic for deploys.

## Bumping the underlying C++ runtime

Many times, fixes to the runtime and feature adds come from the underlying cpp runtime. In these cases, just checkout the commit hash you need to bump to from `rive-cpp` in `wasm/submodules/rive-cpp` and run the `js/build.sh` script to incorporate the fix/feature across the various builds. Check out the example apps to make sure nothing is broken (or to verify a fix) before submitting a PR.
