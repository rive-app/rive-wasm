# Rive.js -- Rive's Web API

## ALPHA RELEASE! (latest 0.0.4)

Rive.js is fresh off the presses and in an alpha state; the api is subject to change as we try to make it fit for purpose. Please file issues and PRs for anything busted, missing, or just plain wrong.

The api surface is highly likely to change with each release, so please make sure to specify which version you're using when importing the script:

```javascript
<script src="https://unpkg.com/rive-js@0.0.4/dist/rive.js"></script>
```

```json
{
  "name": "my-app",
  "dependencies": {
    "rive-js": "0.0.4"
  }
}
```

Please see the [changelog](https://github.com/rive-app/rive-wasm/blob/master/js/CHANGELOG.md) for info on changes.

## Installing
The simplest way to get this running is copy ```dist/rive.js``` into your project.

## Quick Start

Play the first animation in the default artboard:

```html
<canvas id="canvas"></canvas>
<script src="https://unpkg.com/rive-js@0.0.4/dist/rive.js"></script>
<script>
    // autoplays the first animation in the default artboard
    new Rive({
        src: 'https://cdn.rive.app/animations/off_road_car_blog_0_6.riv',
        canvas: document.getElementById('canvas'),
        autoplay: true,
    });
</script>
```

## Playing and Mixing Animations

Rive.js requires two things: a link to the Rive file, and a canvas element where the animation should be rendered. Setting ```autoplay: true``` will play a one-shot animation once, or a looping animation continuously.

If you want to specify which artboard or animation to play:

```js
new Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_blog_0_6.riv',
    canvas: document.getElementById('canvas'),
    artboard: 'New Artboard',
    animations: 'idle',
    autoplay: true,
});
```

```animations``` can also take a list of animations, which will be mixed together:

```js
new Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_blog_0_6.riv',
    canvas: document.getElementById('canvas'),
    animations: ['idle', 'windshield_wipers', 'bouncing'],
    autoplay: true,
});
```

You can manually start and pause playback, and check if playback is active:

```js
const rive = new Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_blog_0_6.riv',
    canvas: document.getElementById('canvas'),
});

rive.play();
rive.pause();
rive.isPlaying();
```

If you want to play, or mix in, more animations, ```play``` can take an array of animation names:

```js
rive.play(['windshield_wipers']);
```

If you want to pause animations, while still have others playing, ```pause``` can also take an array of animation names:

```js
rive.pause(['windshield_wipers', 'bouncing']);
```

Same goes for stopping animations:

```js
rive.stop(['idle']);
```

It's important to note that unless you specifically pause or stop *looping* animations, they'll play forever. *one-shot* animations will automatically stop when they reach the end of the animation, so you can repeatedly call ```play([<one-shot>])``` and it will replay the animation so long at it has finished its animation.

If Rive's data is being loaded by other means, you can pass in an ArrayBuffer:

```js
const reader = new FileReader();
reader.onload = () => {
    const riveArrayBuffer = reader.result;
    new Rive({
        buffer: riveArrayBuffer,
        canvas: document.getElementById('canvas'),
    });
};
reader.readAsArrayBuffer(file);
```

## Events

Rive.js has a number of events that you can listen for:

```js
const rive = new Rive({
    src: 'https://cdn.rive.app/animations/off_road_car_blog_0_6.riv',
    canvas: document.getElementById('canvas'),
});

// See what animations are on the artboard once the Rive file loads
rive.on('load', () => {
    console.log('Animations ' + rive.animationNames());
});

// onloop will pass the name of the looped animation and loop type; useful when mixing multiple animations together
rive.on('loop', (event) => {
    console.log(event.animationName + ' has looped as a ' + event.loopName);
});
```

Event callbacks currently supported are:
  - *onload*: fired when the Rive file is loaded and ready for playback
  - *onloaderror*: fired if an error occurred while trying to load a Rive file
  - *onplay*: Rive has started playing an animation
  - *onpause*: playback has been paused
  - *onloop*: one of the playing animations has looped (```LoopEvent```)
  - *onstop*: playback has stopped (when the animation completes if not a looping animation)

## Other Functions

 - *source()*: returns the source for the animation
 - *animationNames()*: returns a list of animations on the chosen (or default) artboard
 - *setAlignment()*: changes the alignment properties of the animation. 

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