# Asset loading example

This example uses the advanced runtime, and is built using parcel. 
This is an example showing some flexibility in loading assets, either embedded in `.riv`, from the rive CDN or using a custom loader method. 

To run, at the top of the rive-wasm project:

```
cd wasm
./build_all_wasm.sh
cd examples/out_of_band_example
npm i
npm start
```

You should now see the example running on http://localhost:1234. Parcel will pick up any changes made to the example html/css/js automatically, but you will need to rebuild wasm with `./build_all_wasm.sh` anytime you make changes to the wasm runtime.
