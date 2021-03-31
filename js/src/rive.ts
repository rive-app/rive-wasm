import Runtime from '../../wasm/publish/rive.js';

// #region LoopEvent

// Loop types. The index of the type is the value that comes from Wasm
export const loopTypes: string[] = ['oneShot', 'loop', 'pingPong'];

/// Loop events are returned through onloop callbacks
interface LoopEvent {
  animation: string;
  name: string;
  type: number;
}

// Creates a new LoopEvent
export const createLoopEvent = (animation: string, loopValue: number): LoopEvent => {
  if (loopValue < 0 || loopValue >= loopTypes.length) {
    throw 'Invalid loop value';
  }
  return {
    animation: animation,
    type: loopValue,
    name: loopTypes[loopValue],
  }
}

// #endregion

// Maps the playback state to the Wasm enum values
export const playbackStates = { 'play': 0, 'pause': 1, 'stop': 2 };

// #region layout

// Fit options for the canvas
export enum Fit {
  Cover     = 'cover',
  Contain   = 'contain',
  Fill      = 'fill',
  FitWidth  = 'fitWidth',
  FitHeight = 'fitHeight',
  None      = 'none',
  ScaleDown = 'scaleDown'
}

// Alignment options for the canvas
export enum Alignment {
  Center       = 'center',
  TopLeft      = 'topLeft',
  TopCenter    = 'topCenter',
  TopRight     = 'topRight',
  CenterLeft   = 'centerLeft',
  CenterRight  = 'centerRight',
  BottomLeft   = 'bottomLeft',
  BottomCenter = 'bottomCenter',
  BottomRight  = 'bottomRight'
}

// Interface for the Layout static method contructor
export interface LayoutParameters {
  fit: Fit,
  alignment: Alignment,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
}

// Alignment options for Rive animations in a HTML canvas
export class Layout {

  constructor(
    public fit: Fit = Fit.None,
    public alignment: Alignment = Alignment.Center,
    public minX: number = 0,
    public minY: number = 0,
    public maxX: number = 0,
    public maxY: number = 0
  ) {}

  // Alternative constructor to build a Layout from an interface/object
  static new({fit, alignment, minX, minY, maxX, maxY}: LayoutParameters) : Layout {
    return new Layout(fit, alignment, minX, minY, maxX, maxY);
  }

  // Returns fit for the Wasm runtime format
  public runtimeFit(rive: any): any {
    switch (this.fit) {
      case Fit.Cover:
        return rive.Fit.cover;
      case Fit.Contain:
        return rive.Fit.contain;
      case Fit.Fill:
        return rive.Fit.fill;
      case Fit.FitWidth:
        return rive.Fit.fitWidth;
      case Fit.FitHeight:
        return rive.Fit.fitHeight;
      case Fit.ScaleDown:
        return rive.Fit.scaleDown;
      case Fit.None:
      default:
        return rive.Fit.none;
    }
  }

  // Returns alignment for the Wasm runtime format
  public runtimeAlignment(rive: any): any {
    switch (this.alignment) {
      case Alignment.TopLeft:
        return rive.Alignment.topLeft;
      case Alignment.TopCenter:
        return rive.Alignment.topCenter;
      case Alignment.TopRight:
        return rive.Alignment.topRight;
      case Alignment.CenterLeft:
        return rive.Alignment.centerLeft;
      case Alignment.CenterRight:
        return rive.Alignment.centerRight;
      case Alignment.BottomLeft:
        return rive.Alignment.bottomLeft;
      case Alignment.BottomCenter:
        return rive.Alignment.bottomCenter;
      case Alignment.BottomRight:
        return rive.Alignment.bottomRight;
      case Alignment.Center:
      default:
        return rive.Alignment.center;
    }
  }
}

// #endregion

// #region runtime

// Callback type when looking for a runtime instance
export type RuntimeCallback = (rive: typeof Runtime) => void;

// Runtime singleton; use getInstance to provide a callback that returns the
// Rive runtime
export class RuntimeLoader {
  
  // Singleton helpers
  private static runtime: typeof Runtime;
  // Flag to indicate that loading has started/completed
  private static isLoading: boolean = false;
  // List of callbacks for the runtime that come in while loading
  private static callBackQueue: RuntimeCallback[] = [];
  // Instance of the Rive runtime
  private static rive: typeof Runtime;
  // The url for the Wasm file
  private static wasmWebPath: string = 'https://unpkg.com/rive-js@latest/dist/';
  // Local path to the Wasm file; for testing purposes
  private static wasmFilePath: string = 'dist/';
  // Are we in test mode?
  private static testMode: boolean = false;

  // Class is never instantiated
  private constructor() {}

  // Loads the runtime
  private static loadRuntime() : void {
    Runtime({
      // Loads Wasm bundle
      locateFile: (file: string) =>
        // if in test mode, attempts to load file locally 
        (RuntimeLoader.testMode ?
          RuntimeLoader.wasmFilePath :
          RuntimeLoader.wasmWebPath) + file
    }).then((rive: typeof Runtime) => {
      RuntimeLoader.runtime = rive;
      // Fire all the callbacks
      while (RuntimeLoader.callBackQueue.length > 0) {
        RuntimeLoader.callBackQueue.shift()?.(RuntimeLoader.runtime);
      }
    });
  }

  // Provides a runtime instance via a callback
  public static getInstance(callback: RuntimeCallback): void {
    // If it's not loading, start loading runtime
    if (!RuntimeLoader.isLoading) {
      RuntimeLoader.isLoading = true;
      RuntimeLoader.loadRuntime();
    }
    if (!RuntimeLoader.runtime) {
      RuntimeLoader.callBackQueue.push(callback);
    } else {
      callback(RuntimeLoader.runtime);
    }
  }

  // Provides a runtime instance via a promise
  public static awaitInstance(): Promise<typeof Runtime> {
    return new Promise<typeof Runtime>((resolve, reject) => 
      RuntimeLoader.getInstance((rive: typeof Runtime): void => resolve(rive))
    );
  }

  // Places the loader in test mode
  public static setTestMode(mode: boolean): void {
    RuntimeLoader.testMode = mode;
  }
}

// #endregion

// #region animations

// Wraps animations and instances from the runtime and keeps track of playback
// state
export class Animation {  
  public loopCount: number = 0;
  public paused: boolean = false;

  constructor(private animation: any, public readonly instance: any) {}

  // Returns the animation's name
  public get name(): string {
    return this.animation.name;
  }

  // Returns the animation's loop type
  public get loopValue(): number {
    return this.animation.loopValue;
  } 
}

// #endregion

// #region events

// Events that Rive fires
export enum EventType {
  Load      = 'load',
  LoadError = 'loaderror',
  Play      = 'play',
  Pause     = 'pause',
  Stop      = 'stop',
  Loop      = 'loop',
}

// Event fired by Rive
export interface Event {
  type: EventType,
  data?: string | string[],
}

// Callback type for event listeners
export type EventCallback = (event: Event) => void;

// An event listener
export interface EventListener {
  type: EventType,
  callback: EventCallback, 
}

// Manages Rive events and listeners
class EventManager {

  constructor(private listeners: EventListener[] = []) {}

  // Gets listeners of specified type
  private getListeners(type: EventType): EventListener[] {
    return this.listeners.filter(e => e.type === type);
  }

  // Adds a listener
  public add(listener: EventListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  // Removes listener
  public remove(listener: EventListener): void {
    const index = this.listeners.indexOf(listener, 0);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Fires an event
  public fire(event: Event, ignoreDuplicate = false): void {
    const eventListeners = this.getListeners(event.type);
    eventListeners.forEach(
      listener => listener.callback(event)
    );
  }
}

// #endregion

// #region Manages a queue of tasks

// A task in the queue; will fire the action when the queue is processed; will
// also optionally fire an event.
export interface Task {
  action: ActionCallback,
  event?: Event,
}

// Callback type for task actions
export type ActionCallback = () => void;

// Manages a queue of tasks
class TaskQueueManager {
  private queue: Task[] = [];

  constructor(private eventManager: EventManager) {}

  // Adds a task top the queue
  public add(task: Task): void {
    this.queue.push(task);
  }

  // Processes all tasks in the queue
  public process(): void {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      task?.action();
      if (task?.event) {
        this.eventManager.fire(task.event);
      }
    }
  }
}

// #endregion

// #region Rive

// Interface for the Rive static method contructor
export interface RiveParameters {
  canvas: HTMLCanvasElement | OffscreenCanvas, // canvas is required
  src?: string, // one of src or buffer is required
  buffer?: ArrayBuffer, // one of src or buffer is required
  artboard?: string,
  animations?: string[],
  layout?: Layout,
  autoplay?: boolean,
  onload?: () => void,
  onloaderror?: () => void,
  onplay?: () => void,
  onpause?: () => void,
  onstop?: () => void,
  onloop?: () => void,
}

// Interface for storing playback callbacks
interface RiveCallback {
  fn: () => void,
}

// Interface to Rive.load function
export interface RiveLoadParameters {
  src?: string,
  buffer?: ArrayBuffer,
  autoplay?: boolean,
}

// Interface for typing a runtime Artboard
interface RuntimeArtboard {
  animationCount: () => number,
  bounds: any,
  advance: (elapsedTime: number) => void
  draw: (renderer: any) => void,
  animation: (name: string) => any,
  animationAt: (index: number) => any,
}

export class Rive {

  private artboard: RuntimeArtboard | null = null;
  private artboardName: string;

  // Temporary variables while code is ported from js
  private _startingAnimationNames: string[];
  private _canvas: HTMLCanvasElement | OffscreenCanvas;
  private _autoplay: boolean;
  private _rive: any;
  private _animations: Animation[];
  private _loaded: boolean = false;
  private _playback: number;
  private _file: any;

  // Converted variables
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  private renderer: any;

  // Holds event listeners
  private eventManager: EventManager;

  // Manages the loading task queue
  private taskQueue: TaskQueueManager;

  // Error message for missingh source or buffer
  private static readonly missingErrorMessage: string =
    'Either a Rive source file or a data buffer is required.';

  constructor(
    private src: string, // uri for a (.riv) Rive file
    private buffer: ArrayBuffer, // ArrayBuffer containing Rive data
    artboard: string, // name of the artboard to use
    private animations: string[] = [], // list of names of animations to queue for playback
    private canvas: HTMLCanvasElement | OffscreenCanvas, // canvas in which to render the artboard
    private _layout: Layout = new Layout(Fit.Contain, Alignment.Center), // rendering layout inside the canvas
    private autoplay: boolean = false, // should playback begin immediately?
    private onload: EventCallback = () => {}, // callback triggered when Rive file is loaded
    private onloaderror: EventCallback = () => {}, // callback triggered if loading fails
    private onplay: EventCallback = () => {}, // callback triggered when a play event occurs
    private onpause: EventCallback = () => {}, // callback triggered when a pause event occurs
    private onstop: EventCallback = () => {}, // callback triggered when a stop event occurs
    private onloop: EventCallback = () => {}, // callback triggered when a loop event occurs
  ) {
    // If no source file url specified, it's a bust
    if (!this.src && !this.buffer) {
      console.error(Rive.missingErrorMessage);
      throw Rive.missingErrorMessage;
    }  
    // Name of the artboard. Rive operates on only one artboard. If
    // you want to have multiple artboards, use multiple Rive instances.
    this.artboardName = artboard;
  
    // List of animations that should be played.
    this._startingAnimationNames = animations;
  
    this._canvas = canvas;
    // Fetch the 2d context from the canvas
    this.ctx = this._canvas.getContext('2d');


    this._autoplay = autoplay;
  
    // The Rive Wasm runtime
    this._rive = null;

    // List of animation instances that will be played
    this._animations = [];
  
    // Tracks when the Rive file is successfully loaded and the Wasm
    // runtime is initialized.
    this._loaded = false;
  
    // Tracks the playback state
    this._playback = playbackStates.stop;
  
    // New event management system
    this.eventManager = new EventManager([
      {type: EventType.Load, callback: onload},
      {type: EventType.LoadError, callback: onloaderror},
      {type: EventType.Play, callback: onplay},
      {type: EventType.Pause, callback: onpause},
      {type: EventType.Stop, callback: onstop},
      {type: EventType.Loop, callback: onloop},
    ]);

    // Hook up the task queue
    this.taskQueue = new TaskQueueManager(this.eventManager);
    
    // Queue up play action and event if necessary
    if (this._autoplay) {
      this.taskQueue.add({ action: () => this.play() });
    }

    // Wait for runtime to load
    RuntimeLoader.awaitInstance().then((runtime) => {
      this._rive = runtime;
      // Load from a source uri or a data buffer
      this.initialize();
    });
  }

  // Alternative constructor to build a Rive instance from an interface/object
  public static new({
    src,
    buffer,
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
    onloop }: RiveParameters) : Rive {
    return new Rive(
      src, buffer, artboard, animations, canvas, layout, autoplay,
      onload, onloaderror, onplay, onpause, onstop, onloop,
    );
  }

  // Initializes runtime with Rive data and preps for playing
  private async initialize() : Promise<void> {
    try {
      // Load the buffer from the src if provided
      if (this.src) {
        this.buffer = await loadRiveFile(this.src);
      }
      // Load the Rive file
      this._file = this._rive.load(new Uint8Array(this.buffer));
      if (this._file) {
        this._loaded = true;
        // Initialize and draw frame
        this.initializeArtboard();
        this.drawFrame();
        // Everything's set up, emit a load event
        this.eventManager.fire({
          type: EventType.Load,
          data: this.src ?? 'buffer'
        });
        // Clear the task queue
        this.taskQueue.process();
      } else {
        throw '';
      }
    } catch (e) {
      const msg = `Unable to load ${this.src ?? 'buffer'}`;
      this.eventManager.fire({type: EventType.LoadError, data:msg});
      console.error(msg);
      throw e ?? msg;
    }
  }

  // Initialize for playback
  private initializeArtboard(): void {
    this.artboard = this.artboardName ?
      this._file.artboard(this.artboardName) :
      this._file.defaultArtboard();

    // Check that the artboard has at least 1 animation
    if (this.artboard.animationCount() < 1) {
      const msg = 'Artboard has no animations';
      this.eventManager.fire({type: EventType.LoadError, data: msg});
      throw msg;
    }

    // Get the canvas where you want to render the animation and create a renderer
    this.renderer = new this._rive.CanvasRenderer(this.ctx);

    // Initialize the animations
    if (this._startingAnimationNames.length > 0) {
      this.playAnimations(this._startingAnimationNames);
    }
  }

  // Draws the current artboard frame
  public drawFrame() {
    // Choose how you want the animation to align in the canvas
    this.ctx.save();
    this.renderer.align(
      this._layout.runtimeFit(this._rive),
      this._layout.runtimeAlignment(this._rive),
      {
        minX: this._layout ? this._layout.minX : 0,
        minY: this._layout ? this._layout.minY : 0,
        maxX: (this._layout && this._layout.maxX) ? this._layout.maxX : this._canvas.width,
        maxY: (this._layout && this._layout.maxY) ? this._layout.maxY : this._canvas.height
      },
      this.artboard.bounds
    );

    // Advance to the first frame and draw the artboard
    this.artboard.advance(0);
    this.artboard.draw(this.renderer);
    this.ctx.restore();
  }

  // Adds animations contained in the artboard for playback
  private playAnimations(animationNames?: string | string[]): string[] {
    animationNames = mapToStringArray(animationNames);
    const instancedAnimationNames = this._animations.map(a => a.name);
    for (const i in animationNames) {
      const index = instancedAnimationNames.indexOf(animationNames[i]);
      if (index >= 0) {
        // Animation is already instanced, unpause it
        this._animations[index].paused = false;
      } else {
        // Create a new animation instance and add it to the list
        const anim = this.artboard.animation(animationNames[i]);
        const inst = new this._rive.LinearAnimationInstance(anim);
        this._animations.push(new Animation(anim, inst));
      }
    }
  
    return this._animations.filter(a => !a.paused).map(a => a.name);
  }

  // Removes animations from playback
  private removeAnimations(animationNames: string[]): string[] {
    // Determine which animations need to be removed
    const animationsToRemove = this._animations.filter(
      a => animationNames.indexOf(a.name) >= 0
    );

    // Remove the animations
    animationsToRemove.forEach(a =>
      this._animations.splice(this._animations.indexOf(a), 1)
    );

    // Return the list of animations removed
    return animationsToRemove.map(a => a.name);
  }

  // Removes all animations from playback
  private removeAllAnimations(): string[] {
    const names = this._animations.map(animation => animation.name);
    this._animations.splice(0, this._animations.length);
    return names;
  }

  // Pauses animations
  private pauseAnimations(animationNames: string[]): string[] {
    const pausedAnimationNames: string[] = [];

    this._animations.forEach((a, i) => {
      if (animationNames.indexOf(a.name) >= 0) {
        a.paused = true;
        pausedAnimationNames.push(a.name);
      }
    });
    return pausedAnimationNames;
  }

  // Returns true if at least one animation is active
  private get hasPlayingAnimations(): boolean {
    return this._animations.reduce((acc, curr) => acc || !curr.paused, false);
  }

  // Ensure there's at least one animation for playback; if there are none
  // marked for playback, then ad the first animation in the artboard.
  private atLeastOneAnimationForPlayback(): void {
    if (this._animations.length === 0 && this.artboard.animationCount() > 0) {
      // Add the default animation
      const animation = this.artboard.animationAt(0);
      const instance = new this._rive.LinearAnimationInstance(animation);
      this._animations.push(new Animation(animation, instance));
    }
  }

  // Tracks the last timestamp at which the animation was rendered. Used only in
  // draw().
  private lastRenderTime: number;

  // Tracks the current animation frame request
  private frameRequestId: number;

  // Draw rendering loop; renders animation frames at the correct time interval.
  private draw(time: number): void {

    // On the first pass, make sure lastTime has a valid value
    if (!this.lastRenderTime) {
      this.lastRenderTime = time;
    }
    // Calculate the elapsed time between frames in seconds
    const elapsedTime = (time - this.lastRenderTime) / 1000;
    this.lastRenderTime = time;
  
    // Advance non-paused animations by the elapsed number of seconds
    const activeAnimations = this._animations.filter(a => !a.paused);
    for (const animation of activeAnimations) {
      animation.instance.advance(elapsedTime);
      if (animation.instance.didLoop) {
        animation.loopCount += 1;
      }
      // Apply the animation to the artboard. The reason of this is that
      // multiple animations may be applied to an artboard, which will
      // then mix those animations together.
      animation.instance.apply(this.artboard, 1.0);
    }
  
    // Once the animations have been applied to the artboard, advance it
    // by the elapsed time.
    this.artboard.advance(elapsedTime);
  
    // Clear the current frame of the canvas
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    // Render the frame in the canvas
    this.ctx.save();
    this.renderer.align(
      this._layout.runtimeFit(this._rive),
      this._layout.runtimeAlignment(this._rive),
      {
        minX: this._layout.minX,
        minY: this._layout.minY,
        maxX: this._layout.maxX ? this._layout.maxX : this._canvas.width,
        maxY: this._layout.maxY ? this._layout.maxY : this._canvas.height
      },
      this.artboard.bounds
    );
    this.artboard.draw(this.renderer);
    this.ctx.restore();
  
    for (const animation of this._animations) {
      // Emit if the animation looped
      switch (animation.loopValue) {
        case 0:
          if (animation.loopCount) {
            animation.loopCount = 0;
            // This is a one-shot; if it has ended, delete the instance
            this.stop(animation.name);
          }
          break;
        case 1:
          if (animation.loopCount) {
            // TODO: Fix this to return more info
            this.eventManager.fire({
              type: EventType.Loop,
              data: `${animation.name} looped`
            });
            // this._emit('loop', createLoopEvent(
            //   animation.name,
            //   animation.loopValue,
            // ));
            animation.loopCount = 0;
          }
          break;
        case 2:
          // Wasm indicates a loop at each time the animation
          // changes direction, so a full loop/lap occurs every
          // two didLoops
          if (animation.loopCount > 1) {
            // TODO: Fix this to return more info
            this.eventManager.fire({
              type: EventType.Loop,
              data: `${animation.name} looped`
            });
            // this._emit('loop', createLoopEvent(
            //   animation.name,
            //   animation.loopValue,
            // ));
            animation.loopCount = 0;
          }
          break;
      }
    }

    // Calling requestAnimationFrame will rerun draw() at the correct rate:
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    // TODO: move handling state change to event listeners?
    if (this._playback === playbackStates.play) {
      this.frameRequestId = requestAnimationFrame(this.draw.bind(this));
    } else if (this._playback === playbackStates.pause) {
      // Reset the end time so on playback it starts at the correct frame
      this.lastRenderTime = 0;
    } else if (this._playback === playbackStates.stop) {
      // Reset animation instances, artboard and time
      // TODO: implement this properly when we have instancing
      this.initializeArtboard();
      this.drawFrame();
      this.lastRenderTime = 0;
    }
  }

  // Plays specified animations; if none specified, it plays paused ones.
  public play(animationNames?: string | string[]): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, queue up the play
    if (!this._loaded) {
      this.taskQueue.add({
        action: () => this.play(animationNames),
      });
      return;
    }

    const playingAnimations = this.playAnimations(animationNames);
    this.atLeastOneAnimationForPlayback();
    this._playback = playbackStates.play;
    this.frameRequestId = requestAnimationFrame(this.draw.bind(this));
    this.eventManager.fire({
      type: EventType.Play,
      data: this.playingAnimationNames
    });
  }

  // Pauses specified animations; if none specified, pauses all.
  public pause(animationNames?: string | string[]): void {
    animationNames = mapToStringArray(animationNames);

    this.pauseAnimations(animationNames);
    if (!this.hasPlayingAnimations || animationNames.length === 0) {
      this._playback = playbackStates.pause;
    }
    this.eventManager.fire({
      type: EventType.Pause,
      data: this.pausedAnimationNames,
    });
  }

  // Stops specified animations; if none specifies, stops them all.
  public stop(animationNames?:string | string[] | undefined):void {
    animationNames = mapToStringArray(animationNames);
    
    const stoppedAnimationNames: string[] = animationNames.length === 0 ?
        this.removeAllAnimations() :
        this.removeAnimations(animationNames);
  
    if (!this.hasPlayingAnimations || animationNames.length === 0) {
      // Immediately cancel the next frame draw; if we don't do this,
      // strange things will happen if the Rive file/buffer is
      // reloaded.
      cancelAnimationFrame(this.frameRequestId);
      this._playback = playbackStates.stop;
    }
    this.eventManager.fire({
      type: EventType.Stop,
      data: stoppedAnimationNames,
    });
  }

  // Loads a new Rive file, keeping listeners in place.
  // TODO: remove duplication with constructor
  public load({src, buffer, autoplay = false}: RiveLoadParameters): void {
    this.src = src;
    this.buffer = buffer;
    this._autoplay = autoplay;

    // Stop all animations
    this.stop();
  
    // If no source file url specified, it's a bust
    if (!src && !buffer) {
      console.error(Rive.missingErrorMessage);
      return;
    }

    // Reset internals
    this._file = null;
    this.artboard = null;
    this.artboardName = null;
    this._animations = [];
    this._startingAnimationNames = [];
    this._loaded = false;
    
    // Queue up play action and event if necessary
    if (this._autoplay) {
      this.taskQueue.add({ action: () => this.play() });
    }
  
    // Wait for runtime to load
    RuntimeLoader.awaitInstance().then((runtime) => {
      this._rive = runtime;
      // Load from a source uri or a data buffer
      this.initialize();
    });
  }

  // Sets a new layout
  public set layout(layout: Layout) {
    this._layout = layout;
    if(!this.hasPlayingAnimations) {
      this.drawFrame();
    }
  }

  // Returns the animation source, which may be undefined
  public get source(): string {
    return this.src;
  }

  // Returns a list of animation names on the chosen artboard
  public get animationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this._loaded) {
      return [];
    }
    const animationNames: string[] = [];
    for (let i = 0; i < this.artboard.animationCount(); i++) {
      animationNames.push(this.artboard.animationAt(i).name);
    }
    return animationNames;
  }

  // Returns a list of playing animation names
  public get playingAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this._loaded) {
      return [];
    }
    return this._animations
      .filter(a => !a.paused)
      .map(a => a.name);
  }

  // Returns a list of paused animation names
  public get pausedAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this._loaded) {
      return [];
    }
    return this._animations
      .filter(a => a.paused)
      .map(a => a.name);
  }

  // Returns true if playing
  public get isPlaying(): boolean {
    return this._playback === playbackStates.play;
  }

  // Returns trus if all animations are paused
  public get isPaused(): boolean {
    return this._playback === playbackStates.pause;
  }

  // Returns true if all animations are stopped
  public get isStopped(): boolean {
    return this._playback === playbackStates.stop;
  }

  // Register a new listener
  public on(type: EventType, callback: EventCallback) {
    this.eventManager.add({
      type: type,
      callback: callback, 
    });
  }

}


// Loads Rive data from a URI via fetch.
const loadRiveFile = async (src: string): Promise<ArrayBuffer> => {
    const req = new Request(src);
    const res = await fetch(req);
    const buffer = await res.arrayBuffer();
    return buffer;
}

// #endregion

// #region utility functions

/*
 * Utility function to ensure an object is a string array
 */
let mapToStringArray = (obj?: string[] | string | undefined): string[] => {
  if (typeof obj === 'string') {
    return [obj];
  } else if (obj instanceof Array) {
    return obj;
  }
  // If obj is undefined, return empty array
  return [];
}

// #endregion

// #region exports for testing

// Exports to only be used for tests
export const Testing = {
  EventManager: EventManager,
  TaskQueueManager: TaskQueueManager,
} 

// #endregion