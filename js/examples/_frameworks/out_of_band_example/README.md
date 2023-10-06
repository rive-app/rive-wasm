# Out of band example

This example uses the high-level JS/TS API from `rive-wasm` referencing the local build for `@rive-app/canvas`.

## Install

Run `npm i`

## Run

To run, make sure the `npm/canvas` build is built locally in `js/npm/canvas`. Run `./build.sh` from the `js` folder to build the WASM, and the JS bundler. This should give you a `rive.js` and `rive.wasm` file in the `npm/canvas` folder.

Then run `npm start` in the root of this folder to run the parcel example and navigate to `http://localhost:1234` in the browser to check it out.
