# Rive Advanced Parcel Example

An example app using the advanced runtime, built using parcel.

Before running this application, make sure to checkout the [CONTRIBUTING](../../../CONTRIBUTING.md) docs to ensure you can build the web runtime locally.

To run:

```
cd wasm
./build_all_wasm.sh
cd examples/parcel_example
npm install
npm run start
```

You should now see the example running on http://localhost:1234. Parcel will pick up any changes made to the example html/css/js automatically, but you will need to rebuild the runtime with `./build_all_wasm.sh` anytime you make changes to the runtime.
