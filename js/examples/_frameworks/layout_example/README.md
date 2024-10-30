# Rive Layouts example

This is an example showing Rive Layout - try adjusting the window size or zooming in/out. It uses the high-level JS/TS API from `rive-wasm` referencing the local build for `@rive-app/canvas`.

This is accomplished by setting the `fit` to type `Fit.layout`, and updating the artboard size as the window changes. You can also adjust the `scaleFactor` in the `align` method to account for device pixel ratio, or to allow for zooming in/out of your graphics.

## Install

Run `npm i`

## Run

To run, make sure the `npm/canvas` build is built locally in `js/npm/canvas`. Run `./build.sh` from the `js` folder to build the WASM, and the JS bundler. This should give you a `rive.js` and `rive.wasm` file in the `npm/canvas` folder.

Then run `npm start` in the root of this folder to run the parcel example and navigate to `http://localhost:1234` in the browser to check it out.