# Centaur Game Example

An example game using the advanced runtime, built using parcel. This is a more advanced example building a render loop from scratch, instancing multiple artboards, state machines, etc. all in one canvas.

To run, at the top of the rive-wasm project:

```
cd js
./build.sh
cd examples/centaur_game
npm i
npm start
```

You should now see the example running on http://localhost:1234. Parcel will pick up any changes made to the example html/css/js automatically, but you will need to rebuild the runtime with `./build.sh` anytime you make changes to the runtime.
