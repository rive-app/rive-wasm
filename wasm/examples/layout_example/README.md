# Rive Layouts example

This example uses the advanced runtime, and is built using parcel. 
This is an example showing Rive Layout - try adjusting the window size or zooming in/out.

This is accomplished by setting the `fit` to type `Fit.layout`, and updating the artboard size as the window changes. You can also adjust the `scaleFactor` in the `align` method to account for device pixel ratio, or to allow for zooming in/out of your graphics.

To run, at the top of the rive-wasm project:

```
cd wasm
./build_all_wasm.sh
cd examples/layout
npm i
npm start
```

You should now see the example running on http://localhost:1234. Parcel will pick up any changes made to the example html/css/js automatically, but you will need to rebuild wasm with `./build_all_wasm.sh` anytime you make changes to the wasm runtime.
