![Build Status](https://github.com/rive-app/rive-wasm/actions/workflows/build.yml/badge.svg) 
![Discord badge](https://img.shields.io/discord/532365473602600965)
![Twitter handle](https://img.shields.io/twitter/follow/rive_app.svg?style=social&label=Follow)
![npm](https://img.shields.io/npm/v/rive-js)
# Rive.js

[Rive's](https://rive.app) web runtime.

Detailed runtime documentation can be found in [Rive's help center](https://help.rive.app/runtimes).

Please see the [changelog](https://github.com/rive-app/rive-wasm/blob/master/js/CHANGELOG.md) for info on latest updates.

## WASM (and local builds)

If you're looking for information on our low-level WASM runtime, or you're interested in contributing and building this repo locally, please check out [these docs](https://github.com/rive-app/rive-wasm/tree/master/wasm).

## v6 Users
If you're using Rive files in v6 format, then please use the `0.6.1` version of this package. Versions older than this have a breaking bug.

## Installing
The easiest way to run this is to copy ```dist/rive.min.js``` into your project and embed with a ```script``` tag:

```javascript
<script src="https://unpkg.com/rive-js@latest/dist/rive.min.js"></script>
```

If you're using a bundler, you can get the package from npm:

```npm install rive-js```

Which will add it to your dependencies:
```json
{
  "name": "my-app",
  "dependencies": {
    "rive-js": "^0.7.0"
  }
}
``` 

## Importing the Rive-JS module
When importing or requiring the Rive module from our npm package, it's important to note that there are three options.
- Rive module
- Rive Single module
- Rive Light module

### Rive module
Offers the best Performance & Fidelity, our recommended way to use Rive-JS.
```
import * as rive from 'rive';
```
This uses Rive's WebGL renderer, offering the best performance and fidelity with edit-time experience. There are upcoming features to Rive that will only be availble with the WebGL renderer. Furthermore, when using this module the WASM is downloaded externally which allows it to be cached across sites using Rive. You can override the WASM location if you wish to self host it. We strongly recommend brotli compressing the WASM file to optimize download size.
```
RuntimeLoader.setWasmUrl('https://my.site.come/rive_canvas.wasm');
```

### Rive Single module
Offers the best Performance & Fidelity in a single js file.
```
import * as rive from 'rive/dist/rive_single.js';
```
Same as above, uses the WebGL renderer but the rive_canvas.wasm file is encoded into the js. The WASM bytes will not be externally downloaded but it will also not be as well cached and will incur an overall larger download size.

### Rive Light module
No WebGL, supporting rendering to many canvases concurrently.
```
import * as rive from 'rive/dist/rive_light.js';
```
This module uses a lightweight renderer which only uses the native CanvasRenderingContext2D (no WebGL). Use this on sites were you intend to display lots of different Canvases with Rive content concurrently. With WebGL you will be limited by the maximum number of contexts allowed by the browser. The lightweight renderer works around this limitation by using the native high level canvas renderer (CanvasRenderingContext2D). WASM is encoded into the js like in rive_single.


## Quick Start

Play the first animation in the default artboard:

```html
<canvas id="canvas" width="400" height="300"></canvas>
<script src="https://unpkg.com/rive-js@latest/dist/rive.min.js"></script>
<script>
    // autoplays the first animation in the default artboard
    new rive.Rive({
        src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
        canvas: document.getElementById('canvas'),
        autoplay: true,
    });
</script>
```

## Layout

Rive.js lets you decide how your animations will be laid out in the canvas. The ```Layout``` objects lets you set the fit, alignment and optinonally the min and max of the x/y coordinates.

These can be set when a Rive object is first created:

```js
new rive.Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
    canvas: document.getElementById('canvas'),
    layout: new rive.Layout({fit: 'contain', alignment: 'topRight'}),
    autoplay: true,
});
```

Options for ```fit``` are:
- 'cover'
- 'contain'
- 'fill'
- 'fitWidth'
- 'fitHeight'
- 'none'
- 'scaleDown'

Options for ```alignment``` are:
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

The layout can be updated at any time with the ```layout``` setter:

```js
    const r = new rive.Rive({
        src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
        canvas: document.getElementById('canvas'),
        autoplay: true,
    });

    r.layout = new rive.Layout({fit: rive.Fit.Cover, alignment: rive.Alignment.BottomCenter});
```

Note that either strings or enums can be used for the fit and alignment parameters.

## Playing and Mixing Animations

Rive.js requires two things: a link to the Rive file, and a canvas element where the animation should be rendered. Setting ```autoplay: true``` will play a one-shot animation once, or a looping animation continuously.

If you want to specify which artboard or animation to play:

```js
new rive.Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
    canvas: document.getElementById('canvas'),
    artboard: 'New Artboard',
    animations: 'idle',
    autoplay: true,
});
```

```animations``` can also take a list of animations, which will be mixed together:

```js
new rive.Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
    canvas: document.getElementById('canvas'),
    animations: ['idle', 'windshield_wipers', 'bouncing'],
    autoplay: true,
});
```

```animations``` can take either a string for a single animation, or a list of strings for multiple animations.

You can manually start and pause playback, and check if playback is active:

```js
const r = new rive.Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
    canvas: document.getElementById('canvas'),
});

r.play();
r.pause();
r.isPlaying ? console.log('Playing') : console.log('Not playing');
```

If you want to play, or mix in, more animations, ```play``` can take an array of animation names:

```js
r.play(['windshield_wipers']);
```

If you want to pause animations, while still have others playing, ```pause``` can also take an array of animation names:

```js
r.pause(['windshield_wipers', 'bouncing']);
```

Same goes for stopping animations:

```js
r.stop(['idle']);
```

It's important to note that unless you specifically pause or stop *looping* animations, they'll play forever. *one-shot* animations will automatically stop when they reach the end of the animation, so you can repeatedly call ```play([<one-shot>])``` and it will replay the animation so long at it has finished its animation.

If Rive's data is being loaded by other means, you can pass in an ArrayBuffer:

```js
const reader = new FileReader();
reader.onload = () => {
    const riveArrayBuffer = reader.result;
    new rive.Rive({
        buffer: riveArrayBuffer,
        canvas: document.getElementById('canvas'),
    });
};
reader.readAsArrayBuffer(file);
```

## State Machines

Playing state machines is much like animations; you can specify which state machine to play when creating a Rive object:

```js
new rive.Rive({
    src: 'https://cdn.rive.app/animations/skills_v7.riv',
    canvas: document.getElementById('canvas'),
    stateMachines: 'Designer\'s Test',
    autoplay: true,
});
```

You can start, pause, and stop state machines with the ```play```, ```pause```, and ```stop``` functions:

```js
const r = new rive.Rive({
    src: 'https://cdn.rive.app/animations/skills_v7.riv',
    canvas: document.getElementById('canvas'),
});

r.play('Designer\'s Test');
r.pause();
```

State machine inputs can be retrieved with ```stateMachineInputs```. Trigger inputs can be fired with ```fire``` and boolean/number inputs can have their values set with ```value```:

```js
const inputs = r.stateMachineInputs('Designer\'s Test');
inputs.forEach((input) => {
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

## Events

Rive.js has a number of events that you can listen for:

```js
const r = new rive.Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
    canvas: document.getElementById('canvas'),
});

// See what animations are on the artboard once the Rive file loads
r.on('load', () => {
    console.log('Animations ' + r.animationNames());
});

// onloop will pass the name of the looped animation and loop type; useful when mixing multiple animations together
r.on('loop', (event) => {
    console.log(event.data.animation + ' has looped as a ' + event.data.type);
});
```

Event callbacks currently supported are:
  - *onLoad*: fired when the Rive file is loaded and ready for playback
  - *onLoadError*: fired if an error occurred while trying to load a Rive file
  - *onPlay*: Rive has started playing an animation
  - *onPause*: playback has been paused
  - *onLoop*: one of the playing animations has looped (```LoopEvent```)
  - *onStop*: playback has stopped (when the animation completes if not a looping animation)
  - *onStateChange*: state has changed in a state machine

You can unsubscribe from a single callback, all callbacks of a specific type, or every callback using:
  - ```unsubscribe(type, callback)```
  - ```unsubscribeAll(type)```: if ```type``` is omitted, all callbacks are unsubscribed

## Scrubbing

Paused animations can be manually advanced (scrubbed) by a specified amount of time:

```js
animation.scrub(myAnimationName, timeInSeconds);
```

## Other Properties

 - *source*: returns the source for the animation
 - *animationNames*: returns a list of animation names on the chosen (or default) artboard
 - *playingAnimationNames*: returns a list of animation names currently playing
 - *pausedAnimationNames*: returns a lists of paused animation names
 - *isPlaying*: are there any animations playing?
 - *isPaused*: are all animations paused?
 - *isStopped*: are all animation stopped?
 
## Examples

To run the examples in the ```examples``` folder, run a HTTP server at the root of the ```js``` directory. If you have Python installed, the following works nicely:

```bash
python3 -m http.server 8000
```

or Node:

```bash
npx http-server
```

and then navigate to the examples, e.g.: ```http://localhost:8000/examples/hello_world/index.html```.

## Stars Sparkline

[![Sparkline](https://stars.medv.io/rive-app/rive-wasm.svg)](https://stars.medv.io/rive-app/rive-wasm)
