![Build Status](https://github.com/rive-app/rive-wasm/actions/workflows/build.yml/badge.svg)
![Discord badge](https://img.shields.io/discord/532365473602600965)
![Twitter handle](https://img.shields.io/twitter/follow/rive_app.svg?style=social&label=Follow)

# Rive's Web Runtime

[Rive's](https://rive.app) web runtime to integrate and control Rive animation assets in your web application.

Detailed runtime documentation can be found in [Rive's help center](https://help.rive.app/runtimes).

## What is Rive?

Rive is a real-time interactive design and animation tool. Use our collaborative editor to create motion graphics that respond to different states and user inputs. Then load your animations into apps, games, and websites with our lightweight open-source runtimes.

## Installing

This project deploys various packages which are published to npm.

For most cases when integrating Rive assets (`.riv` files) into your application, we recommend installing the `@rive-app/webgl` package. You can install this in your web application via:

```
npm install @rive-app/webgl
```

For more advanced usage in controlling the render of your assets, check out the other web runtime packages to understand which one may fit your needs better in our [web runtimes](WEB_RUNTIMES.md) docs. The high-level API described in the docs below remains the same among all of these packages.

**Note:** If you previously used the `rive-js` package in your application, we recommend updating to using the package above to ensure you have support for the latest features (i.e raster assets).

## Getting Started

To get started integrating Rive animations into your web application, you need to do the following:

1. Define a [canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) element in your HTML, where the animation will be rendered to
2. Import our API from one of the packages mentioned above in the installation step and instantiate a new Rive object
   - Provide the API with either a locally downloaded `.riv` file to your app, or a hosted one. See [our help docs](https://help.rive.app/editor/exporting) on how to download your `.riv` assets from the Rive editor.
   - Provide the API with the `canvas` element you just defined

See below for an example on how to autoplay the first animation in the default artboard:

HTML file:

```html
<body>
  <div>
    <p>Hello, Rive!</p>
    <canvas id="canvas"></canvas>
  </div>
</body>
```

JS file

```js
import rive from "@rive-app/webgl";

new rive.Rive({
  // Hosted .riv asset, or a local one
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas"),
  autoplay: true
});
```

To try this out quickly, feel free to [fork this CodeSandbox](https://codesandbox.io/s/rive-plain-js-sandbox-1ddrc?file=/src/index.js) that has everything set up for you in a small project setup. Just add your Rive file to the sandbox and change the `src` attribute to test your animation out and see it live (note however, you may need to create a CodeSandbox account if you're adding dropping in a local file).

## Rive API Configuration

### Layout

The web API lets you decide how your animations will be laid out in the canvas. The `Layout` objects lets you set the fit, alignment and optinonally the min and max of the x/y coordinates.

These can be set when a Rive object is first created:

```js
new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas"),
  layout: new rive.Layout({ fit: "contain", alignment: "topRight" }),
  autoplay: true
});
```

Options for `fit` are:

- 'cover'
- 'contain'
- 'fill'
- 'fitWidth'
- 'fitHeight'
- 'none'
- 'scaleDown'

Options for `alignment` are:

- 'center'
- 'topLeft'
- 'topCenter'
- 'topRight'
- 'centerLeft'
- 'centerRight'
- 'bottomLeft'
- 'bottomCenter'
- 'bottomRight'

Depending on the size of your artboard and the size of the canvas into which it's rendering, some of the fit and alignment values may produce the same layout.

The layout can be updated at any time with the `layout` setter:

```js
const r = new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas"),
  autoplay: true
});

r.layout = new rive.Layout({
  fit: rive.Fit.Cover,
  alignment: rive.Alignment.BottomCenter
});
```

Note that either strings or enums can be used for the fit and alignment parameters.

### Playing and Mixing Animations

Setting `autoplay: true` on the Rive object will play a one-shot animation once, or a looping animation continuously.

If you want to specify which artboard or animation to play:

```js
new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas"),
  artboard: "New Artboard",
  animations: "idle",
  autoplay: true
});
```

`animations` can also take a list of animations, which will be mixed together:

```js
new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas"),
  animations: ["idle", "windshield_wipers", "bouncing"],
  autoplay: true
});
```

`animations` can take either a string for a single animation, or a list of strings for multiple animations.

You can manually start and pause playback, and check if playback is active:

```js
const r = new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas")
});

r.play();
r.pause();
r.isPlaying ? console.log("Playing") : console.log("Not playing");
```

If you want to play or mix in more animations, `play` can take an array of animation names:

```js
r.play(["windshield_wipers"]);
```

If you want to pause animations, while still have others playing, `pause` can also take an array of animation names:

```js
r.pause(["windshield_wipers", "bouncing"]);
```

Same goes for stopping animations:

```js
r.stop(["idle"]);
```

It's important to note that unless you specifically pause or stop _looping_ animations, they'll play forever. _one-shot_ animations will automatically stop when they reach the end of the animation, so you can repeatedly call `play([<one-shot>])` and it will replay the animation so long at it has finished its animation.

If Rive's data is being loaded by other means, you can pass in an ArrayBuffer:

```js
const reader = new FileReader();
reader.onload = () => {
  const riveArrayBuffer = reader.result;
  new rive.Rive({
    buffer: riveArrayBuffer,
    canvas: document.getElementById("canvas")
  });
};
reader.readAsArrayBuffer(file);
```

### State Machines

Playing state machines is much like animations; you can specify which state machine to play when creating a Rive object:

```js
new rive.Rive({
  src: "https://cdn.rive.app/animations/skills_v7.riv",
  canvas: document.getElementById("canvas"),
  stateMachines: "Designer's Test",
  autoplay: true
});
```

You can start, pause, and stop state machines with the `play`, `pause`, and `stop` functions:

```js
const r = new rive.Rive({
  src: "https://cdn.rive.app/animations/skills_v7.riv",
  canvas: document.getElementById("canvas")
});

r.play("Designer's Test");
r.pause();
```

State machine inputs can be retrieved with `stateMachineInputs`. Trigger inputs can be fired with `fire` and boolean/number inputs can have their values set with `value`:

```js
const inputs = r.stateMachineInputs("Designer's Test");
inputs.forEach(input => {
  // Trigger
  if (input.type === rive.StateMachineInputType.Trigger) {
    input.fire();
  }
  // Number
  else if (input.type === rive.StateMachineInputType.Number) {
    input.value = 10;
  }
  // Boolean
  else if (input.type === rive.StateMachineInputType.Boolean) {
    input.value = true;
  }
});
```

See [this example](https://github.com/rive-app/rive-wasm/blob/master/js/examples/state_machine/index.html) for more details.

### Events

The Rive object returned on instantiation has a number of events that you can listen for:

```js
const r = new rive.Rive({
  src: "https://cdn.rive.app/animations/off_road_car_v7.riv",
  canvas: document.getElementById("canvas")
});

// See what animations are on the artboard once the Rive file loads
r.on("load", () => {
  console.log("Animations " + r.animationNames());
});

// onloop will pass the name of the looped animation and loop type; useful when mixing multiple animations together
r.on("loop", event => {
  console.log(event.data.animation + " has looped as a " + event.data.type);
});
```

Event callbacks currently supported are:

- _onLoad_: fired when the Rive file is loaded and ready for playback
- _onLoadError_: fired if an error occurred while trying to load a Rive file
- _onPlay_: Rive has started playing an animation
- _onPause_: playback has been paused
- _onLoop_: one of the playing animations has looped (`LoopEvent`)
- _onStop_: playback has stopped (when the animation completes if not a looping animation)
- _onStateChange_: state has changed in a state machine

You can unsubscribe from a single callback, all callbacks of a specific type, or every callback using:

- `unsubscribe(type, callback)`
- `unsubscribeAll(type)`: if `type` is omitted, all callbacks are unsubscribed

### Scrubbing

Paused animations can be manually advanced (scrubbed) by a specified amount of time:

```js
animation.scrub(myAnimationName, timeInSeconds);
```

### Other Properties

The following are more properties exposed on the Rive object during instantiation from our web runtime packages:

- _source_: returns the source for the animation
- _animationNames_: returns a list of animation names on the chosen (or default) artboard
- _playingAnimationNames_: returns a list of animation names currently playing
- _pausedAnimationNames_: returns a lists of paused animation names
- _isPlaying_: are there any animations playing?
- _isPaused_: are all animations paused?
- _isStopped_: are all animation stopped?

## Examples

To run the examples in the `examples` folder, run a HTTP server at the root of the `js` directory. If you have Python installed, the following works nicely:

```bash
python3 -m http.server 8000
```

or Node:

```bash
npx http-server
```

and then navigate to the examples, e.g.: `http://localhost:8000/examples/hello_world/index.html`.

## WASM and Contributing

If you're looking for information on our low-level Web Assembly ([WASM](https://developer.mozilla.org/en-US/docs/WebAssembly)) runtime, or you're interested in contributing and building this repo locally, please check out [these docs](https://github.com/rive-app/rive-wasm/tree/master/wasm).

## v6 Users

If you're using Rive files from a v6 format, then please use the `0.6.1` version of the old `rive-js` package. Versions older than this both in `rive-js` and the newer `@rive-app/` packages have a breaking bug.

## Stars Sparkline

[![Sparkline](https://stars.medv.io/rive-app/rive-wasm.svg)](https://stars.medv.io/rive-app/rive-wasm)
