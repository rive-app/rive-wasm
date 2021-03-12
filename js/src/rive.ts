import {
  createLoopEvent,
  Alignment,
  Fit,
  Layout,
  playbackStates,
  RuntimeLoader,
  LoopEvent,
} from './utils';

// Lets webpack know to copy the Wasm file to the dist folder
const _ = require('../../wasm/publish/rive.wasm');


interface AnimationEvents {
  load: string | string[];
  loaderror: string | string[];
  play: string | string[];
  pause: string | string[];
  stop: string | string[];
  playerror: string | string[];
  loop: LoopEvent;
}
type EventNames = keyof AnimationEvents;
const eventsNames: EventNames[] = ['load', 'loaderror', 'play', 'pause', 'stop', 'playerror', 'loop'];

interface EventCallback {
  fn: (message: string | LoopEvent) => void;
}

interface Queue {
  event: EventNames;
  action?: () => any
}

interface RiveOptions {
  /** uri for a Rive file (.riv) */
  src?: string;
  /** ArrayBuffer containing Rive data */
  buffer?: ArrayBuffer;
  artboard?: any;
  animations?: any;
  canvas?: any;
  layout?: any;
  autoplay?: any;
  onload?: any;
  onloaderror?: any;
  onplay?: any;
  onpause?: any;
  onstop?: any;
  onplayerror?: any;
  onloop?: any;
}

class Rive {
  private _rive = null;
  /** uri for a Rive file (.riv) */
  private _src?: string;
  /** ArrayBuffer containing Rive data */
  private _buffer?: ArrayBuffer;
  private _file; // RiveFile
  private _layout?: Layout;
  private _autoplay?: boolean;
  private _artboard = null; // Artboard
  private _artboardName: string;
  private _canvas?: any;
  private _startingAnimationNames?: any;
  private _startingAnimations?: any[]
  /** List of animation instances that will be played */
  private _animations = []; // @question: LinearAnimation or Animation
  /** Rive renderer */
  private _renderer?: any;
  /** The canvas context */
  private _ctx: CanvasRenderingContext2D = null;
  /** Tracks when the Rive file is successfully loaded and the Wasm runtime is initialized. */
  private _loaded = false;  
  /** Tracks the playback state */
  private _playback = playbackStates.stop;
  /** Queue of actions to take. Actions are queued if they're called before Rive is initialized.*/ 
  private _queue: Queue[] = [];
  private _lastTime?: number;
  private _animReqId?: number;

  private _onload: EventCallback[] = [];
  private _onloaderror: EventCallback[] = [];
  private _onplay: EventCallback[] = [];
  private _onpause: EventCallback[] = [];
  private _onstop: EventCallback[] = [];
  private _onplayerror: EventCallback[] = [];
  private _onloop: EventCallback[] = [];
  
  constructor(private options: RiveOptions) {
    if (!options.src && !options.buffer) {
      throw new Error('Either a Rive source file or a data buffer is required.');
    }
    this._src = this.options.src;
    this._buffer = this.options.buffer;
    this._canvas = this.options.canvas;
    this._layout = this.options.layout;
    this._autoplay = this.options.autoplay;
    
    // Name of the artboard. Rive operates on only one artboard. If
    // you want to have multiple artboards, use multiple Rive instances.
    this._artboard = this.options.artboard;
    this._startingAnimationNames = ensureArray(this.options.animations);


    // Set up the event listeners
    for (const key of eventsNames) {
      if (typeof this.options[`on${key}`] === 'function') {
        this[`_on${key}`].push({ fn: this.options[`on${key}`] })
      }
    }

    // Add 'load' task so the queue can be processed correctly on
    // successful load
    this._queue.push({
      event: 'load',
    });

    // Queue up play if necessary
    if (this._autoplay) {
      this._queue.push({
        event: 'play',
        action: () => {
          this.play();
        }
      });
    }

    // Wait for runtime to load
    // _onWasmLoaded(this._wasmLoadEvent.bind(this));
    RuntimeLoader.getInstance(this._wasmLoadEvent.bind(this));
  }

  
  /** Callback when Wasm bundle is loaded */
  private _wasmLoadEvent(rive) {
    this._rive = rive;
    if (this._src) {
      this._loadRiveFile();
    } else if (this._buffer) {
      this._loadRiveData(this._buffer);
    }
  }

  /** Loads a Rive file */
  private _loadRiveFile() {
    const req = new Request(this._src);
    return fetch(req).then((res) => {
      return res.arrayBuffer();
    }).then((buffer) => {
      // Save the buffer in case a reset is needed
      this._buffer = buffer;
      this._loadRiveData(buffer);
    }).catch((e) => {
      this._emit('loaderror', 'Unable to load file ' + this._src);
      console.error('Unable to load Rive file: ' + this._src);
      throw e;
    });
  }

  /*
      * Loads and initializes Rive data from an ArrayBuffer
      */
  private _loadRiveData(buffer: ArrayBuffer) {
  
    // The raw bytes of the animation are in the buffer, load them into a
    // Rive file
    this._file = this._rive.load(new Uint8Array(buffer));
    // Fire the 'load' event and trigger the task queue
    if (this._file) {
      this._loaded = true;

      // Initialize playback and paint first frame; do this here
      // so that if play() has already beren called, things are
      // initialized before we start firing loaded events
      this._initializePlayback();

      // Paint the first frame
      this._drawFrame();

      // Emit the load event, which will also kick off processing
      // the load queue
      this._emit('load', 'File ' + (this._src ? this._src : 'buffer') + ' loaded');
    } else {
      this._emit('loaderror', 'Unable to load buffer');
      console.error('Unable to load buffer');
    }
  }

  /** Emits events of specified type */
  private _emit<K extends keyof AnimationEvents>(event: K, msg: AnimationEvents[K]) {
    
    const events = this[`_on${key}`];

    // Loop through event store and fire all functions.
    for (let i = events.length - 1; i >= 0; i--) {
      setTimeout(function (fn: Function) {
        fn.call(this, msg);
      }.bind(this, events[i].fn), 0);
    }

    // Step through any tasks in the queue
    this._loadQueue(event);

    return this;
  }

  /**
    * Actions queued up before the animation was initialized.
    * Takes an optional event parameter; if the event matches the next
    * task in the queue, that task is skipped as it's already occurred.
    */
  private _loadQueue(event?: EventNames) {
    if (this._queue.length > 0) {
      var task = this._queue[0];
      // Remove the task  if its event has occurred and trigger the
      // next task. 
      if (task.event === event) {
        this._queue.shift();
        this._loadQueue();
      }

      if (!event) {
        task.action();
      }
    }

    return this;
  }

  /** Initializes artboard, animations, etc. prior to playback */
  private _initializePlayback() {
    // Get the artboard that contains the animations you want to play.
    // You animate the artboard, using animations it contains.
    this._artboard = this._artboardName ?
      this._file.artboard(this._artboardName) :
      this._file.defaultArtboard();

    // Check that the artboard has at least 1 animation
    if (this._artboard.animationCount() < 1) {
      this._emit('loaderror', 'Artboard has no animations');
      throw 'Artboard has no animations';
    }

    // Get the canvas where you want to render the animation and create a renderer
    this._ctx = this._canvas.getContext('2d');
    this._renderer = new this._rive.CanvasRenderer(this._ctx);

    // Initialize the animations
    if (this._startingAnimationNames.length > 0) {
      this._addAnimations(this._startingAnimationNames);
    }
  }

  /**
    * Updates which animations will play back. This will remove any existing
    * animations, and add the named animations. If any animation is not
    * found, then the function returns false; true otherwise. If
    * animationNames is not passed, then the default animation will be
    * added.
    */
  private _addAnimations(animationNames: string[]) {
    
    // Go through each of the animation names, first checking to see if it's
    // already instanced and unpause, and then instance any missing animations.
    const instancedAnimationNames = this._animations.map(a => a.name());
    for (const i in animationNames) {
      const index = instancedAnimationNames.indexOf(animationNames[i]);
      if (index >= 0) {
        // Animation is already instanced, unpause it
        this._animations[index].paused = false;
      } else {
        // Create a new animation instance and add it to the list
        const anim = this._artboard.animation(animationNames[i]);
        const inst = new this._rive.LinearAnimationInstance(anim);
        this._animations.push(new _Animation({animation: anim, instance: inst}));
      }
    }

    return this._animations.filter(a => !a.paused).map(a => a.name());
  }

  /**
   * Removes animations from playback. Returns the list of animations
   * that are stopped.
   */
  private _removeAnimations(animationNames: string[]): string[] {
    // Get the animations to remove from the list
    const animationsToRemove = this._animations.filter(
      a => animationNames.indexOf(a.name()) >= 0
    );

    // Remove the animations
    animationsToRemove.forEach(a =>
      this._animations.splice(this._animations.indexOf(a), 1)
    );

    // Return the list of animations removed
    return animationsToRemove.map(a => a.name());
  }

  /**
   * Removes all animations, returning the names of the stopped animations
   */
  private _removeAllAnimations() {
    
    const names = this._animations.map(animation => animation.name());
    this._animations.splice(0, this._animations.length);
    return names;
  }

  /** Pauses animations */
  private _pauseAnimations(animationNames?: string | string[]) {
    const pausedAnimationNames: string[] = [];

    this._animations.forEach((a, i) => {
      if (animationNames.indexOf(a.name()) >= 0) {
        a.paused = true;
        pausedAnimationNames.push(a.name());
      }
    });

    return pausedAnimationNames;
  }

  /**
   * Returns true if there are animations for playback, false if there are
   * none or if all of them are paused
   */
  private _hasActiveAnimations() {
    return this._animations.length !== 0 && this._animations.reduce((acc, curr) => acc || !curr.paused, false);
  }

  /**
   * Ensure that there's at least one animation for playback
   */
  private _validateAnimations() {
    if (this._animations.length === 0 && this._artboard.animationCount() > 0) {
      // Add the default animation
      const animation = this._artboard.animationAt(0);
      const instance = new this._rive.LinearAnimationInstance(animation);
      this._animations.push(new _Animation({ animation: animation, instance: instance }));
    }
  }

  /**
    * Draws the first frame on the animation
    */
  private _drawFrame() {
    // Choose how you want the animation to align in the canvas
    this._ctx.save();
    this._renderer.align(
      this._layout ? this._layout.runtimeFit(this._rive) : this._rive.Fit.contain,
      this._layout ? this._layout.runtimeAlignment(this._rive) : this._rive.Alignment.center,
      {
        minX: this._layout ? this._layout.minX : 0,
        minY: this._layout ? this._layout.minY : 0,
        maxX: (this._layout && this._layout.maxX) ? this._layout.maxX : this._canvas.width,
        maxY: (this._layout && this._layout.maxY) ? this._layout.maxY : this._canvas.height
      },
      this._artboard.bounds
    );

    // Advance to the first frame and draw the artboard
    this._artboard.advance(0);
    this._artboard.draw(this._renderer);
    this._ctx.restore();
  }

  /**
    * The draw rendering loop. This is the looping function where the
    * animation frames will be rendered at the correct time interval.
    */
  private _draw(time: number) {
    

    // On the first pass, make sure lastTime has a valid value
    if (!this._lastTime) {
      this._lastTime = time;
    }
    // Calculate the elapsed time between frames in seconds
    const elapsedTime = (time - this._lastTime) / 1000;
    this._lastTime = time;

    // Advance non-paused animations by the elapsed number of seconds
    const activeAnimations = this._animations.filter(a => !a.paused);
    for (const i in activeAnimations) {
      activeAnimations[i].instance.advance(elapsedTime);
      if (activeAnimations[i].instance.didLoop) {
        activeAnimations[i].loopCount += 1;
      }
      // Apply the animation to the artboard. The reason of this is that
      // multiple animations may be applied to an artboard, which will
      // then mix those animations together.
      activeAnimations[i].instance.apply(this._artboard, 1.0);
    }

    // Once the animations have been applied to the artboard, advance it
    // by the elapsed time.
    this._artboard.advance(elapsedTime);

    // Clear the current frame of the canvas
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    // Render the frame in the canvas
    this._ctx.save();
    this._renderer.align(
      this._layout ? this._layout.runtimeFit(this._rive) : this._rive.Fit.contain,
      this._layout ? this._layout.runtimeAlignment(this._rive) : this._rive.Alignment.center,
      {
        minX: this._layout ? this._layout.minX : 0,
        minY: this._layout ? this._layout.minY : 0,
        maxX: (this._layout && this._layout.maxX) ? this._layout.maxX : this._canvas.width,
        maxY: (this._layout && this._layout.maxY) ? this._layout.maxY : this._canvas.height
      },
      this._artboard.bounds
    );
    this._artboard.draw(this._renderer);
    this._ctx.restore();

    for (var i in this._animations) {
      // Emit if the animation looped
      switch (this._animations[i].loopValue()) {
        case 0:
          if (this._animations[i].loopCount) {
            this._animations[i].loopCount = 0;
            // This is a one-shot; if it has ended, delete the instance
            this.stop([this._animations[i].name()]);
          }
          break;
        case 1:
          if (this._animations[i].loopCount) {
            this._emit('loop', createLoopEvent(
              this._animations[i].name(),
              this._animations[i].loopValue(),
            ));
            this._animations[i].loopCount = 0;
          }
          break;
        case 2:
          // Wasm indicates a loop at each time the animation
          // changes direction, so a full loop/lap occurs every
          // two didLoops
          if (this._animations[i].loopCount > 1) {
            this._emit('loop', createLoopEvent(
              this._animations[i].name(),
              this._animations[i].loopValue(),
            ));
            this._animations[i].loopCount = 0;
          }
          break;
      }
    }

    // Calling requestAnimationFrame will call the draw function again
    // at the correct refresh rate. See
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    // for more details.
    // TODO: move handling state change to event listeners?
    if (this._playback === playbackStates.play) {
      this._animReqId = requestAnimationFrame(this._draw.bind(this));
    } else if (this._playback === playbackStates.pause) {
      // Reset the end time so on playback it starts at the correct frame
      this._lastTime = 0;
    } else if (this._playback === playbackStates.stop) {
      // Reset animation instances, artboard and time
      // TODO: implement this properly when we have instancing
      this._initializePlayback();
      this._drawFrame();
      this._lastTime = 0;
    }
  }

  /** Registers a callback for a named event */
  on<K extends keyof AnimationEvents>(event: K, fn: (event: AnimationEvents[K]) => void) {
    const events = this[`_on${event}`];

    if (typeof fn === 'function') {
      events.push({ fn: fn });
    }

    return this;
  }

  /** Starts/continues playback */
  play(animationNames?: string | string[]) {
    
    const names = ensureArray(animationNames);

    if (!this._loaded) {
      this._queue.push({
        event: 'play',
        action: () => {
          this._addAnimations(names);
          this.play();
        }
      });
      return;
    }

    // Add any new animations to the list
    const playingAnimations = this._addAnimations(names);

    // Ensure there's at least one animation flagged for playback
    this._validateAnimations();

    this._playback = playbackStates.play;

    // Starts animating by calling draw on the next refresh cycle.
    this._animReqId = requestAnimationFrame(this._draw.bind(this));

    // Emits a play event, returning an array of animation names being
    // played
    this._emit('play', playingAnimations);
  }

  /** Pauses playback */
  pause(animationNames?: string | string[]) {
    
    const names = ensureArray(animationNames);

    this._pauseAnimations(names);

    if (!this._hasActiveAnimations() || names.length === 0) {
      this._playback = playbackStates.pause;
    }

    // Emits a pause event
    this._emit('pause', names);
  }

  /** Stops playback */
  stop(animationNames?: string | string[]) {
    
    const names = ensureArray(animationNames);
    let stoppedAnimationNames: string[] = [];
    // Stop all animations if none passed in
    if (names.length === 0) {
      stoppedAnimationNames = this._removeAllAnimations();
    } else {
      stoppedAnimationNames = this._removeAnimations(names);

      if (!this._hasActiveAnimations() || names.length === 0) {
        // Immediately cancel the next frame draw; if we don't do this,
        // strange things will happen if the Rive file/buffer is
        // reloaded.
        cancelAnimationFrame(this._animReqId);
        this._playback = playbackStates.stop;
      }
    }

    // Emits a stop event
    this._emit('stop', stoppedAnimationNames);
  }

  /**
    * Loads a new Rive file; this will reset all artboard and animations,
    * but will keep the event listeners in place.
    * TODO: better abstract this with the Rive constructor
    */
  load({ src, buffer, canvas, autoplay }: Partial<RiveOptions>) {
    

    this._src = src;
    this._buffer = buffer;
    this._autoplay = autoplay;
    this._canvas = canvas ? canvas : this._canvas;

    // Stop any current animations
    this.stop();

    // If no source file url specified, it's a bust
    if (!src && !buffer) {
      console.error('Either a Rive source file or a data buffer is required.');
      return;
    }

    // Reset internals
    this._file = null;
    this._artboard = null;
    this._artboardName = null;
    this._animations = [];
    this._startingAnimations = [];
    this._loaded = false;

    // Add 'load' task so the queue can be processed correctly on
    // successful load
    this._queue.push({
      event: 'load',
    });

    // Queue up play if necessary
    if (this._autoplay) {
      this._queue.push({
        event: 'play',
        action: () => {
          this.play();
        }
      });
    }

    // Wait for Wasm to load
    // _onWasmLoaded(this._wasmLoadEvent.bind(this));
    RuntimeLoader.getInstance(this._wasmLoadEvent.bind(this));
  }

  /*
      * Draws the current artboard state to the canvas Useful if the canvas
      * has been wiped, and you want to draw the last frame of the animation.
      * Does nothing if the file isn't loaded, as that draws the initial
      * frame by default.
      */
  draw() {
    
    if (!this._loaded) {
      return;
    }
    this._drawFrame();
  }

  /*
   * Updates the fit and alignment of the animation in the canvas
   */
  setLayout(layout: Layout) {
    if (!layout.constructor === Layout) {
      return;
    }
    this._layout = layout;

    // If it's not actively playing (i.e. drawing), draw a single frame
    this._drawFrame();
  }

  /** Returns the animation source/name */
  source() {
    
    return this._src;
  }

  /** Returns a list of the names of animations on the chosen artboard */
  animationNames() {
    if (!this._loaded) {
      return [];
    }

    const animationNames = [];
    for (var i = 0; i < this._artboard.animationCount(); i++) {
      animationNames.push(this._artboard.animationAt(i).name);
    }
    return animationNames;
  }

  /** Returns a list of playing animation names */
  playingAnimationNames() {
    if (!this._loaded) {
      return [];
    }

    const animationNames = [];
    for (const i in this._animations) {
      if (!this._animations[i].paused) {
        animationNames.push(this._animations[i].name());
      }
    }
    return animationNames;
  }

  /** Returns true if playback is playing */
  isPlaying() {
    return this._playback === playbackStates.play;
  }

  /** Returns true if playback is paused */
  isPaused() {
    return this._playback === playbackStates.pause;
  }

  /** Returns true if playback state is stopped */
  isStopped() {
    return this._playback === playbackStates.stop;
  }
}

export { Alignment, Fit, Layout, Rive };





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
function ensureArray<T>(param?: T | T[]): T[] {
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
    console.log(' -------- ' + animations[i].name() + ' ' + i.toString() + ' ' + (animations[i].paused ? 'paused' : 'playing'));
  }
  console.log(' ------------- ');
}