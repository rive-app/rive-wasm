/*
* High level API for playing Rive animationa
*/
'use strict';

const {
  createLoopEvent,
  Alignment,
  Fit,
  Layout,
  playbackStates,
  RuntimeLoader,
  Animation } = require('./utils');

// Lets webpack know to copy the Wasm file to the dist folder
const _ = require('../../wasm/publish/rive.wasm');

/*
* Rive constructor
*/
export var Rive = function ({
  src, // uri for a Rive file (.riv)
  buffer, // ArrayBuffer containing Rive data
  artboard,
  animations,
  canvas,
  layout,
  autoplay,
  onload,
  onloaderror,
  onplay,
  onpause,
  onstop,
  onplayerror,
  onloop
}) {
  const self = this;

  // If no source file url specified, it's a bust
  if (!src && !buffer) {
    console.error('Either a Rive source file or a data buffer is required.');
    return;
  }
  self._src = src;
  self._buffer = buffer;

  // Name of the artboard. Rive operates on only one artboard. If
  // you want to have multiple artboards, use multiple Rive instances.
  self._artboardName = artboard;

  // List of animations that should be played.
  self._startingAnimationNames = ensureArray(animations);

  self._canvas = canvas;
  self._layout = layout;
  self._autoplay = autoplay;

  // The Rive Wasm runtime
  self._rive = null;
  // The instantiated artboard
  self._artboard = null;
  // The canvas context
  self._ctx = null;
  // Rive renderer
  self._renderer
  // List of animation instances that will be played
  self._animations = [];

  // Tracks when the Rive file is successfully loaded and the Wasm
  // runtime is initialized.
  self._loaded = false;

  // Tracks the playback state
  self._playback = playbackStates.stop;

  // Queue of actions to take. Actions are queued if they're called before
  // Rive is initialized.
  self._queue = [];

  // Set up the event listeners
  self._onload = typeof onload === 'function' ? [{ fn: onload }] : [];
  self._onloaderror = typeof onloaderror === 'function' ? [{ fn: onloaderror }] : [];
  self._onplay = typeof onplay === 'function' ? [{ fn: onplay }] : [];
  // self._onplayerror = typeof onplayerror === 'function' ? [{ fn: onplayerror }] : [];
  self._onpause = typeof onpause === 'function' ? [{ fn: onpause }] : [];
  self._onstop = typeof onstop === 'function' ? [{ fn: onstop }] : [];
  self._onloop = typeof onloop === 'function' ? [{ fn: onloop }] : [];

  // Add 'load' task so the queue can be processed correctly on
  // successful load
  self._queue.push({
    event: 'load',
  });

  // Queue up play if necessary
  if (self._autoplay) {
    self._queue.push({
      event: 'play',
      action: () => {
        self.play();
      }
    });
  }

  // Wait for runtime to load
  // _onWasmLoaded(self._wasmLoadEvent.bind(self));
  RuntimeLoader.getInstance(self._wasmLoadEvent.bind(self));
};

/*
* Rive api
*/

Rive.prototype = {

  /* 
  * Callback when Wasm bundle is loaded
  */
  _wasmLoadEvent: function (rive) {
    const self = this;

    self._rive = rive;
    if (self._src) {
      self._loadRiveFile();
    } else if (self._buffer) {
      self._loadRiveData(self._buffer);
    }
  },

  /*
      * Loads a Rive file
      */
  _loadRiveFile: function () {
    const self = this;

    const req = new Request(self._src);
    return fetch(req).then((res) => {
      return res.arrayBuffer();
    }).then((buffer) => {
      // Save the buffer in case a reset is needed
      self._buffer = buffer;
      self._loadRiveData(buffer);
    }).catch((e) => {
      self._emit('loaderror', 'Unable to load file ' + self._src);
      console.error('Unable to load Rive file: ' + self._src);
      throw e;
    });
  },

  /*
      * Loads and initializes Rive data from an ArrayBuffer
      */
  _loadRiveData: function (buffer) {
    const self = this;

    // The raw bytes of the animation are in the buffer, load them into a
    // Rive file
    self._file = self._rive.load(new Uint8Array(buffer));
    // Fire the 'load' event and trigger the task queue
    if (self._file) {
      self._loaded = true;

      // Initialize playback and paint first frame; do this here
      // so that if play() has already beren called, things are
      // initialized before we start firing loaded events
      self._initializePlayback();

      // Paint the first frame
      self._drawFrame();

      // Emit the load event, which will also kick off processing
      // the load queue
      self._emit('load', 'File ' + (self._src ? self._src : 'buffer') + ' loaded');
    } else {
      self._emit('loaderror', 'Unable to load buffer');
      console.error('Unable to load buffer');
    }
  },

  /*
      * Emits events of specified type
      */
  _emit: function (event, msg) {
    const self = this;
    const events = self['_on' + event];

    // Loop through event store and fire all functions.
    for (var i = events.length - 1; i >= 0; i--) {
      setTimeout(function (fn) {
        fn.call(this, msg);
      }.bind(self, events[i].fn), 0);
    }

    // Step through any tasks in the queue
    self._loadQueue(event);

    return self;
  },

  /*
      * Actions queued up before the animation was initialized.
      * Takes an optional event parameter; if the event matches the next
      * task in the queue, that task is skipped as it's already occurred.
      */
  _loadQueue: function (event) {
    const self = this;

    if (self._queue.length > 0) {
      var task = self._queue[0];
      // Remove the task  if its event has occurred and trigger the
      // next task. 
      if (task.event === event) {
        self._queue.shift();
        self._loadQueue();
      }

      if (!event) {
        task.action();
      }
    }

    return self;
  },

  /*
  * Initializes artboard, animations, etc. prior to playback
  */
  _initializePlayback: function () {
    const self = this;

    // Get the artboard that contains the animations you want to play.
    // You animate the artboard, using animations it contains.
    self._artboard = self._artboardName ?
      self._file.artboard(self._artboardName) :
      self._file.defaultArtboard();

    // Check that the artboard has at least 1 animation
    if (self._artboard.animationCount() < 1) {
      self._emit('loaderror', 'Artboard has no animations');
      throw 'Artboard has no animations';
    }

    // Get the canvas where you want to render the animation and create a renderer
    self._ctx = self._canvas.getContext('2d');
    self._renderer = new self._rive.CanvasRenderer(self._ctx);

    // Initialize the animations
    if (self._startingAnimationNames.length > 0) {
      self._addAnimations(self._startingAnimationNames);
    }
  },

  /*
    * Updates which animations will play back. This will remove any existing
    * animations, and add the named animations. If any animation is not
    * found, then the function returns false; true otherwise. If
    * animationNames is not passed, then the default animation will be
    * added.
    */
  _addAnimations: function (animationNames) {
    const self = this;
    // Go through each of the animation names, first checking to see if it's
    // already instanced and unpause, and then instance any missing animations.
    const instancedAnimationNames = self._animations.map(a => a.name);
    for (const i in animationNames) {
      const index = instancedAnimationNames.indexOf(animationNames[i]);
      if (index >= 0) {
        // Animation is already instanced, unpause it
        self._animations[index].paused = false;
      } else {
        // Create a new animation instance and add it to the list
        const anim = self._artboard.animation(animationNames[i]);
        const inst = new self._rive.LinearAnimationInstance(anim);
        self._animations.push(new Animation(anim, inst));
      }
    }

    return self._animations.filter(a => !a.paused).map(a => a.name);
  },

  /*
   * Removes animations from playback. Returns the list of animations
   * that are stopped.
   */
  _removeAnimations: function (animationNames) {
    const self = this;

    // Get the animations to remove from the list
    const animationsToRemove = self._animations.filter(
      a => animationNames.indexOf(a.name) >= 0
    );

    // Remove the animations
    animationsToRemove.forEach(a =>
      self._animations.splice(self._animations.indexOf(a), 1)
    );

    // Return the list of animations removed
    return animationsToRemove.map(a => a.name);
  },

  /*
   * Removes all animations, returning the names of the stopped animations
   */
  _removeAllAnimations: function () {
    const self = this;
    const names = self._animations.map(animation => animation.name);
    self._animations.splice(0, self._animations.length);
    return names;
  },

  /*
   * Pauses animations
   */
  _pauseAnimations: function(animationNames) {
    const self = this;
    const pausedAnimationNames = [];

    self._animations.forEach((a, i) => {
      if (animationNames.indexOf(a.name) >= 0) {
        a.paused = true;
        pausedAnimationNames.push(a.name);
      }
    });

    return pausedAnimationNames;
  },

  /*
   * Returns true if there are animations for playback, false if there are
   * none or if all of them are paused
   */
  _hasActiveAnimations: function () {
    const self = this;
    return self._animations.length !== 0 && self._animations.reduce((acc, curr) => acc || !curr.paused, false);
  },

  /*
   * Ensure that there's at least one animation for playback
   */
  _validateAnimations: function () {
    const self = this;

    if (self._animations.length === 0 && self._artboard.animationCount() > 0) {
      // Add the default animation
      const animation = self._artboard.animationAt(0);
      const instance = new self._rive.LinearAnimationInstance(animation);
      self._animations.push(new Animation(animation, instance));
    }
  },

  /*
    * Draws the first frame on the animation
    */
  _drawFrame: function () {
    const self = this;

    // Choose how you want the animation to align in the canvas
    self._ctx.save();
    self._renderer.align(
      self._layout ? self._layout.runtimeFit(self._rive) : self._rive.Fit.contain,
      self._layout ? self._layout.runtimeAlignment(self._rive) : self._rive.Alignment.center,
      {
        minX: self._layout ? self._layout.minX : 0,
        minY: self._layout ? self._layout.minY : 0,
        maxX: (self._layout && self._layout.maxX) ? self._layout.maxX : self._canvas.width,
        maxY: (self._layout && self._layout.maxY) ? self._layout.maxY : self._canvas.height
      },
      self._artboard.bounds
    );

    // Advance to the first frame and draw the artboard
    self._artboard.advance(0);
    self._artboard.draw(self._renderer);
    self._ctx.restore();
  },

  /*
    * The draw rendering loop. This is the looping function where the
    * animation frames will be rendered at the correct time interval.
    */
  _draw: function (time) {
    const self = this;

    // On the first pass, make sure lastTime has a valid value
    if (!self._lastTime) {
      self._lastTime = time;
    }
    // Calculate the elapsed time between frames in seconds
    const elapsedTime = (time - self._lastTime) / 1000;
    self._lastTime = time;

    // Advance non-paused animations by the elapsed number of seconds
    const activeAnimations = self._animations.filter(a => !a.paused);
    for (const i in activeAnimations) {
      activeAnimations[i].instance.advance(elapsedTime);
      if (activeAnimations[i].instance.didLoop) {
        activeAnimations[i].loopCount += 1;
      }
      // Apply the animation to the artboard. The reason of this is that
      // multiple animations may be applied to an artboard, which will
      // then mix those animations together.
      activeAnimations[i].instance.apply(self._artboard, 1.0);
    }

    // Once the animations have been applied to the artboard, advance it
    // by the elapsed time.
    self._artboard.advance(elapsedTime);

    // Clear the current frame of the canvas
    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);
    // Render the frame in the canvas
    self._ctx.save();
    self._renderer.align(
      self._layout ? self._layout.runtimeFit(self._rive) : self._rive.Fit.contain,
      self._layout ? self._layout.runtimeAlignment(self._rive) : self._rive.Alignment.center,
      {
        minX: self._layout ? self._layout.minX : 0,
        minY: self._layout ? self._layout.minY : 0,
        maxX: (self._layout && self._layout.maxX) ? self._layout.maxX : self._canvas.width,
        maxY: (self._layout && self._layout.maxY) ? self._layout.maxY : self._canvas.height
      },
      self._artboard.bounds
    );
    self._artboard.draw(self._renderer);
    self._ctx.restore();

    for (var i in self._animations) {
      // Emit if the animation looped
      switch (self._animations[i].loopValue) {
        case 0:
          if (self._animations[i].loopCount) {
            self._animations[i].loopCount = 0;
            // This is a one-shot; if it has ended, delete the instance
            self.stop([self._animations[i].name]);
          }
          break;
        case 1:
          if (self._animations[i].loopCount) {
            self._emit('loop', createLoopEvent(
              self._animations[i].name,
              self._animations[i].loopValue,
            ));
            self._animations[i].loopCount = 0;
          }
          break;
        case 2:
          // Wasm indicates a loop at each time the animation
          // changes direction, so a full loop/lap occurs every
          // two didLoops
          if (self._animations[i].loopCount > 1) {
            self._emit('loop', new createLoopEvent(
              self._animations[i].name,
              self._animations[i].loopValue,
            ));
            self._animations[i].loopCount = 0;
          }
          break;
      }
    }

    // Calling requestAnimationFrame will call the draw function again
    // at the correct refresh rate. See
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    // for more details.
    // TODO: move handling state change to event listeners?
    if (self._playback === playbackStates.play) {
      self._animReqId = requestAnimationFrame(self._draw.bind(self));
    } else if (self._playback === playbackStates.pause) {
      // Reset the end time so on playback it starts at the correct frame
      self._lastTime = 0;
    } else if (self._playback === playbackStates.stop) {
      // Reset animation instances, artboard and time
      // TODO: implement this properly when we have instancing
      self._initializePlayback();
      self._drawFrame();
      self._lastTime = 0;
    }
  },

  /*
    * Registers a callback for a named event
    */
  on: function (event, fn) {
    var self = this;
    var events = self['_on' + event];

    if (typeof fn === 'function') {
      events.push({ fn: fn });
    }

    return self;
  },

  /*
    * Starts/continues playback
    */
  play: function (animationNames) {
    const self = this;
    animationNames = ensureArray(animationNames);

    if (!self._loaded) {
      self._queue.push({
        event: 'play',
        action: () => {
          self._addAnimations(animationNames);
          self.play();
        }
      });
      return;
    }

    // Add any new animations to the list
    const playingAnimations = self._addAnimations(animationNames);

    // Ensure there's at least one animation flagged for playback
    self._validateAnimations();

    self._playback = playbackStates.play;

    // Starts animating by calling draw on the next refresh cycle.
    self._animReqId = requestAnimationFrame(self._draw.bind(self));

    // Emits a play event, returning an array of animation names being
    // played
    self._emit('play', playingAnimations);
  },

  /*
    * Pauses playback
    */
  pause: function (animationNames) {
    const self = this;
    animationNames = ensureArray(animationNames);

    self._pauseAnimations(animationNames);

    if (!self._hasActiveAnimations() || animationNames.length === 0) {
      self._playback = playbackStates.pause;
    }

    // Emits a pause event
    self._emit('pause', animationNames);
  },

  /*
    * Stops playback;
    */
  stop: function (animationNames) {
    const self = this;
    animationNames = ensureArray(animationNames);
    var stoppedAnimationNames = [];
    // Stop all animations if none passed in
    if (animationNames.length === 0) {
      stoppedAnimationNames = self._removeAllAnimations();
    } else {
      stoppedAnimationNames = self._removeAnimations(animationNames);

      if (!self._hasActiveAnimations() || animationNames.length === 0) {
        // Immediately cancel the next frame draw; if we don't do this,
        // strange things will happen if the Rive file/buffer is
        // reloaded.
        cancelAnimationFrame(self._animReqId);
        self._playback = playbackStates.stop;
      }
    }

    // Emits a stop event
    self._emit('stop', stoppedAnimationNames);
  },

  /*
      * Loads a new Rive file; this will reset all artboard and animations,
      * but will keep the event listeners in place.
      * TODO: better abstract this with the Rive constructor
      */
  load: function ({ src, buffer, canvas, autoplay }) {
    const self = this;

    self._src = src;
    self._buffer = buffer;
    self._autoplay = autoplay;
    self._canvas = canvas ? canvas : self._canvas;

    // Stop any current animations
    self.stop();

    // If no source file url specified, it's a bust
    if (!src && !buffer) {
      console.error('Either a Rive source file or a data buffer is required.');
      return;
    }

    // Reset internals
    self._file = null;
    self._artboard = null;
    self._artboardName = null;
    self._animations = [];
    self._startingAnimations = [];
    self._loaded = false;

    // Add 'load' task so the queue can be processed correctly on
    // successful load
    self._queue.push({
      event: 'load',
    });

    // Queue up play if necessary
    if (self._autoplay) {
      self._queue.push({
        event: 'play',
        action: () => {
          self.play();
        }
      });
    }

    // Wait for Wasm to load
    // _onWasmLoaded(self._wasmLoadEvent.bind(self));
    RuntimeLoader.getInstance(self._wasmLoadEvent.bind(self));
  },

  /*
      * Draws the current artboard state to the canvas Useful if the canvas
      * has been wiped, and you want to draw the last frame of the animation.
      * Does nothing if the file isn't loaded, as that draws the initial
      * frame by default.
      */
  draw: function () {
    const self = this;
    if (!self._loaded) {
      return;
    }
    self._drawFrame();
  },

  /*
   * Updates the fit and alignment of the animation in the canvas
   */
  setLayout: function (layout) {
    const self = this;

    if (!layout.constructor === Layout) {
      return;
    }
    self._layout = layout;

    // If it's not actively playing (i.e. drawing), draw a single frame
    self._drawFrame();
  },

  /*
   * Returns the animation source/name
   */
  source: function () {
    const self = this;
    return self._src;
  },

  /*
   * Returns a list of the names of animations on the chosen artboard
   */
  animationNames: function () {
    const self = this;
    if (!self._loaded) {
      return [];
    }

    var animationNames = [];
    for (var i = 0; i < self._artboard.animationCount(); i++) {
      animationNames.push(self._artboard.animationAt(i).name);
    }
    return animationNames;
  },

  /*
   * Returns a list of playing animation names
   */
  playingAnimationNames: function () {
    const self = this;
    if (!self._loaded) {
      return [];
    }

    var animationNames = [];
    for (const i in self._animations) {
      if (!self._animations[i].paused) {
        animationNames.push(self._animations[i].name);
      }
    }
    return animationNames;
  },

  /*
   * Returns true if playback is playing
   */
  isPlaying: function () {
    const self = this;
    return self._playback === playbackStates.play;
  },

  /*
   * Returns true if playback is paused
   */
  isPaused: function () {
    const self = this;
    return self._playback === playbackStates.pause;
  },

  /*
   * Returns true if playback state is stopped
   */
  isStopped: function () {
    const self = this;
    return self._playback === playbackStates.stop;
  },
};

// Exports needed to expose these for some reason as ES2015 export not working
if (typeof exports !== 'undefined') {
  exports.Rive = Rive;
  exports.Alignment = Alignment;
  exports.Fit = Fit;
  exports.Layout = Layout;
  // Exporting things to be tested
  // exports.testables = {
  //   createLoopEvent: LoopEvent
  // }
}

// Tie these to global/window for use directly in browser
if (typeof global !== 'undefined') {
  global.Rive = Rive;
  global.Rive.Alignment = Alignment;
  global.Rive.Fit = Fit;
  global.Rive.Layout = Layout;
} else if (typeof window !== 'undefined') {
  window.Rive = Rive;
  window.Rive.Alignment = Alignment;
  window.Rive.Fit = Fit;
  window.Rive.Layout = Layout;
}

/*
 * Utility function to ensure a parameter is an array
 */
function ensureArray(param) {
  if (!param) {
    return [];
  } else if (typeof param === 'string') {
    return [param];
  } else if (param.constructor === Array) {
    return param;
  }
  return [];
}

function printAnimationState(animations) {
  console.log(' ------------- ');
  for (const i in animations) {
    console.log(' -------- ' + animations[i].name + ' ' + i.toString() + ' ' + (animations[i].paused ? 'paused' : 'playing'));
  }
  console.log(' ------------- ');
}