![Build Status](https://github.com/rive-app/rive-wasm/actions/workflows/build.yml/badge.svg) 
![Discord badge](https://img.shields.io/discord/532365473602600965)
![Twitter handle](https://img.shields.io/twitter/follow/rive_app.svg?style=social&label=Follow)
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
<script src="https://unpkg.com/rive-js@0.7.16/dist/rive.min.js"></script>
```

If you're using npm, you can include it in your dependencies:

```json
{
  "name": "my-app",
  "dependencies": {
    "rive-js": "0.7.16"
  }
}
``` 
## Quick Start

Play the first animation in the default artboard:

```html
<canvas id="canvas" width="400" height="300"></canvas>
<script src="https://unpkg.com/rive-js@0.7.16/dist/rive.min.js"></script>
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
