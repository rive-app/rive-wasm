import { runInThisContext } from 'node:vm';
import Runtime from '../../wasm/publish/rive.js';
import { rive } from '../dist/rive.dev.js';

// Tracks playback states; numbers map to the runtime's numerica values
// i.e. play: 0, pause: 1, stop: 2
enum PlaybackState {
  Play = 0,
  Pause,
  Stop
}

// #region layout

// Fit options for the canvas
export enum Fit {
  Cover = 'cover',
  Contain = 'contain',
  Fill = 'fill',
  FitWidth = 'fitWidth',
  FitHeight = 'fitHeight',
  None = 'none',
  ScaleDown = 'scaleDown'
}

// Alignment options for the canvas
export enum Alignment {
  Center = 'center',
  TopLeft = 'topLeft',
  TopCenter = 'topCenter',
  TopRight = 'topRight',
  CenterLeft = 'centerLeft',
  CenterRight = 'centerRight',
  BottomLeft = 'bottomLeft',
  BottomCenter = 'bottomCenter',
  BottomRight = 'bottomRight'
}

// Interface for the Layout static method contructor
export interface LayoutParameters {
  fit?: Fit,
  alignment?: Alignment,
  minX?: number,
  minY?: number,
  maxX?: number,
  maxY?: number
}

// Alignment options for Rive animations in a HTML canvas
export class Layout {

  // Runtime fit and alignment are accessed every frame, so we cache their
  // values to save cycles
  private cachedRuntimeFit: any;
  private cachedRuntimeAlignment: any;

  public readonly fit: Fit;
  public readonly alignment: Alignment;
  public readonly minX: number;
  public readonly minY: number;
  public readonly maxX: number;
  public readonly maxY: number;

  constructor(params?: LayoutParameters) {
    this.fit = params?.fit ?? Fit.Contain;
    this.alignment = params?.alignment ?? Alignment.Center;
    this.minX = params?.minX ?? 0;
    this.minY = params?.minY ?? 0;
    this.maxX = params?.maxX ?? 0;
    this.maxY = params?.maxY ?? 0;
  }

  // Alternative constructor to build a Layout from an interface/object
  static new({ fit, alignment, minX, minY, maxX, maxY }: LayoutParameters): Layout {
    console.warn('This function is deprecated: please use `new Layout({})` instead');
    return new Layout({ fit, alignment, minX, minY, maxX, maxY });
  }

  /**
   * Makes a copy of the layout, replacing any specified parameters
   */
  public copyWith({ fit, alignment, minX, minY, maxX, maxY }: LayoutParameters): Layout {
    return new Layout({
      fit: fit ?? this.fit,
      alignment: alignment ?? this.alignment,
      minX: minX ?? this.minX,
      minY: minY ?? this.minY,
      maxX: maxX ?? this.maxX,
      maxY: maxY ?? this.maxY
    });
  }

  // Returns fit for the Wasm runtime format
  public runtimeFit(rive: any): any {
    if (this.cachedRuntimeFit) return this.cachedRuntimeFit;

    let fit;
    if (this.fit === Fit.Cover) fit = rive.Fit.cover;
    else if (this.fit === Fit.Contain) fit = rive.Fit.contain;
    else if (this.fit === Fit.Fill) fit = rive.Fit.fill;
    else if (this.fit === Fit.FitWidth) fit = rive.Fit.fitWidth;
    else if (this.fit === Fit.FitHeight) fit = rive.Fit.fitHeight;
    else if (this.fit === Fit.ScaleDown) fit = rive.Fit.scaleDown;
    else fit = rive.Fit.none;

    this.cachedRuntimeFit = fit;
    return fit;
  }

  // Returns alignment for the Wasm runtime format
  public runtimeAlignment(rive: any): any {
    if (this.cachedRuntimeAlignment) return this.cachedRuntimeAlignment;

    let alignment;
    if (this.alignment === Alignment.TopLeft) alignment = rive.Alignment.topLeft;
    else if (this.alignment === Alignment.TopCenter) alignment = rive.Alignment.topCenter;
    else if (this.alignment === Alignment.TopRight) alignment = rive.Alignment.topRight;
    else if (this.alignment === Alignment.CenterLeft) alignment = rive.Alignment.centerLeft;
    else if (this.alignment === Alignment.CenterRight) alignment = rive.Alignment.centerRight;
    else if (this.alignment === Alignment.BottomLeft) alignment = rive.Alignment.bottomLeft;
    else if (this.alignment === Alignment.BottomCenter) alignment = rive.Alignment.bottomCenter;
    else if (this.alignment === Alignment.BottomRight) alignment = rive.Alignment.bottomRight;
    else alignment = rive.Alignment.center;

    this.cachedRuntimeAlignment = alignment;
    return alignment;
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
  private static wasmWebPath: string = '/dist/'; // 'https://unpkg.com/rive-js@0.7.7/dist/';
  // Local path to the Wasm file; for testing purposes
  private static wasmFilePath: string = 'dist/';
  // Are we in test mode?
  private static testMode: boolean = false;

  // Class is never instantiated
  private constructor() { }

  // Loads the runtime
  private static loadRuntime(): void {
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
class Animation {
  public loopCount: number = 0;
  public paused: boolean = false;

  /**
   * Constructs a new animation
   * @constructor
   * @param {any} animation: runtime animation object
   * @param {any} instance: runtime animation instance object
   */
  constructor(private animation: any, public readonly instance: any) { }

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

// #region state machines

export enum StateMachineInputType {
  Trigger = 'trigger',
  Boolean = 'boolean',
  Number = 'number',
}

/**
 * An input for a state machine
 */
class StateMachineInput {

  constructor(public readonly type: StateMachineInputType, private runtimeInput: any) { }

  /**
   * Returns the name of the input
   */
  public get name(): string {
    return this.runtimeInput.name;
  }

  /**
   * Returns the current value of the input
   */
  public get value(): number | boolean {
    return this.runtimeInput.value;
  }

  /**
   * Sets the value of the input
   */
  public set value(value: number | boolean) {
    this.runtimeInput.value = value;
  }

  /**
   * Fires a trigger; does nothing on Number or Boolean input types
   */
  public fire(): void {
    if (this.type === StateMachineInputType.Trigger) {
      this.runtimeInput.fire();
    }
  }
}


class StateMachine {

  /**
   * Caches the inputs from the runtime
   */
  public readonly inputs: StateMachineInput[] = [];

  /**
   * Runtime state machine instance
   */
  private instance: any;

  /**
   * @constructor
   * @param stateMachine runtime state machine object
   * @param instance runtime state machine instance object
   */
  constructor(private stateMachine: any, runtime: any) {
    this.instance = new runtime.StateMachineInstance(stateMachine);
    this.initInputs(runtime);
  }

  public get name() {
    return this.stateMachine.name;
  }

  /**
   * Fetches references to the state amchine's inputs and caches them
   * @param runtime an instance of the runtime; needed for the SMIInput types
   */
  private initInputs(runtime: any): void {
    // Fetch the inputs from the runtime if we don't have them
    for (let i = 0; i < this.instance.inputCount(); i++) {
      const input = this.instance.input(i);
      this.inputs.push(this.mapRuntimeInput(input, runtime));
    }
  }

  /**
   * Maps a runtime input to it's appropriate type
   * @param input 
   */
  private mapRuntimeInput(input: any, runtime: any): StateMachineInput {
    if (input.type == runtime.SMIInput.bool) {
      return new StateMachineInput(StateMachineInputType.Boolean, input.asBool());
    }
    else if (input.type == runtime.SMIInput.number) {
      return new StateMachineInput(StateMachineInputType.Number, input.asNumber());
    }
    else if (input.type == runtime.SMIInput.trigger) {
      return new StateMachineInput(StateMachineInputType.Trigger, input.asTrigger());
    }
  }

}

// #endregion

// #region events

/**
 * Supported event types triggered in Rive
 */
export enum EventType {
  Load = 'load',
  LoadError = 'loaderror',
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Loop = 'loop',
  Draw = 'draw',
}

// Event fired by Rive
export interface Event {
  type: EventType,
  data?: string | string[] | LoopEvent,
}

/**
 * Looping types: one-shot, loop, and ping-pong
 */
export enum LoopType {
  OneShot = 'oneshot',  // has value 0 in runtime
  Loop = 'loop',        // has value 1 in runtime
  PingPong = 'pingpong' // has value 2 in runtime
}

/**
 * Loop events are returned through onloop callbacks
 */
export interface LoopEvent {
  animation: string;
  type: LoopType;
}

/**
 * Loop events are returned through onloop callbacks
 */
export type EventCallback = (event: Event) => void;

/**
 * Event listeners registered with the event manager
 */
export interface EventListener {
  type: EventType,
  callback: EventCallback,
}

// Manages Rive events and listeners
class EventManager {

  constructor(private listeners: EventListener[] = []) { }

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
  public fire(event: Event): void {
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

  constructor(private eventManager: EventManager) { }

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
  onload?: EventCallback,
  onloaderror?: EventCallback,
  onplay?: EventCallback,
  onpause?: EventCallback,
  onstop?: EventCallback,
  onloop?: EventCallback,
}

// Interface to Rive.load function
export interface RiveLoadParameters {
  src?: string,
  buffer?: ArrayBuffer,
  autoplay?: boolean,
  artboard?: string,
  animations?: string | string[],
}

// Interface for typing a runtime Artboard
interface RuntimeArtboard {
  animationCount: () => number,
  stateMachineCount: () => number,
  bounds: any,
  advance: (elapsedTime: number) => void
  draw: (renderer: any) => void,
  animationByName: (name: string) => any,
  animationByIndex: (index: number) => any,
  stateMachineByIndex: (index: number) => any,
}

export class Rive {

  // Canvas in which to render the artboard
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas;

  // Should the animations autoplay?
  private autoplay: boolean;

  // A url to a Rive file; may be undefined if a buffer is specified
  private src: string;

  // Raw Rive file data; may be undefined if a src is specified
  private buffer: ArrayBuffer;

  // The layout for rendering in the canvas
  private _layout: Layout;

  // Flag to indicate if the layout has changed; used by the renderer to know
  // when to align
  private _updateLayout: boolean = true;

  // Used to track artboard and starting animation names passed into the
  // constructor
  private artboardName: string;

  private startingAnimationNames: string[];

  // Holds instantiated animations
  private animations: Animation[] = [];

  // The canvas 2D context
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  // The runtime renderer
  private renderer: any;

  // Tracks the playback state
  private playState: PlaybackState = PlaybackState.Stop;

  // Tracks if a Rive file is loaded
  private loaded: boolean = false;

  // Wasm runtime
  private runtime: any;

  // Runtime artboard
  private artboard: RuntimeArtboard | null = null;

  // Runtime file
  private file: any;

  // Holds event listeners
  private eventManager: EventManager;

  // Manages the loading task queue
  private taskQueue: TaskQueueManager;

  // Error message for missing source or buffer
  private static readonly missingErrorMessage: string =
    'Rive source file or data buffer required';

  constructor(params: RiveParameters) {
    this.canvas = params.canvas;
    this.autoplay = params.autoplay ?? false;
    this.src = params.src;
    this.buffer = params.buffer;
    this.layout = params.layout ?? new Layout();
    this._updateLayout = true;

    // Fetch the 2d context from the canvas
    this.ctx = this.canvas.getContext('2d');

    // New event management system
    this.eventManager = new EventManager();
    if (params.onload) this.on(EventType.Load, params.onload);
    if (params.onloaderror) this.on(EventType.LoadError, params.onloaderror);
    if (params.onplay) this.on(EventType.Play, params.onplay);
    if (params.onpause) this.on(EventType.Pause, params.onpause);
    if (params.onstop) this.on(EventType.Stop, params.onstop);
    if (params.onloop) this.on(EventType.Loop, params.onloop);

    // Hook up the task queue
    this.taskQueue = new TaskQueueManager(this.eventManager);

    this.init({
      src: this.src,
      buffer: this.buffer,
      autoplay: this.autoplay,
      animations: params.animations,
      artboard: params.artboard
    });
  }

  // Alternative constructor to build a Rive instance from an interface/object
  public static new(params: RiveParameters): Rive {
    console.warn('This function is deprecated: please use `new Rive({})` instead');
    return new Rive(params);
  }

  // Initializes the Rive object either from constructor or load()
  private init({ src, buffer, animations, artboard, autoplay = false }: RiveLoadParameters): void {
    this.src = src;
    this.buffer = buffer;
    this.autoplay = autoplay;

    // If no source file url specified, it's a bust
    if (!this.src && !this.buffer) {
      throw new Error(Rive.missingErrorMessage);
    }

    // Name of the artboard. Rive operates on only one artboard. If
    // you want to have multiple artboards, use multiple Rive instances.
    this.artboardName = artboard;

    // List of animations that should be played.
    this.startingAnimationNames = mapToStringArray(animations);

    // Queue up play action and event if necessary
    if (this.autoplay) {
      this.taskQueue.add({ action: () => this.play() });
    }

    // Reset the animations list if loading new file
    this.animations = [];

    // Ensure loaded is marked as false if loading new file
    this.loaded = false;

    // Queue up play action and event if necessary
    if (this.autoplay) {
      this.taskQueue.add({ action: () => this.play() });
    }

    // Ensure the runtime is loaded
    RuntimeLoader.awaitInstance().then((runtime) => {
      this.runtime = runtime;
      // Load Rive data from a source uri or a data buffer
      this.initData().catch(e => {
        console.error(e);
      });
    }).catch(e => {
      console.error(e);
    });
  }

  // Initializes runtime with Rive data and preps for playing
  private async initData(): Promise<void> {
    // Load the buffer from the src if provided
    if (this.src) {
      this.buffer = await loadRiveFile(this.src);
    }
    // Load the Rive file
    this.file = await this.runtime.load(new Uint8Array(this.buffer));
    if (this.file) {
      this.loaded = true;
      // Initialize and draw frame
      this.initArtboard();
      this.drawFrame();
      // Everything's set up, emit a load event
      this.eventManager.fire({
        type: EventType.Load,
        data: this.src ?? 'buffer'
      });
      // Clear the task queue
      this.taskQueue.process();
      return Promise.resolve();
    } else {
      const msg = 'Problem loading file; may be corrupt!';
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      return Promise.reject(msg);
    }
  }

  // Initialize for playback
  private initArtboard(): void {
    this.artboard = this.artboardName ?
      this.file.artboard(this.artboardName) :
      this.file.defaultArtboard();

    // Check that the artboard has at least 1 animation
    if (this.artboard.animationCount() < 1) {
      const msg = 'Artboard has no animations';
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      throw msg;
    }

    // Get the canvas where you want to render the animation and create a renderer
    this.renderer = new this.runtime.CanvasRenderer(this.ctx);

    // Initialize the animations
    if (this.startingAnimationNames.length > 0) {
      this.playAnimations(this.startingAnimationNames);
    }
  }

  // Draws the current artboard frame
  public drawFrame() {
    // Update the renderer's alignment if necessary
    this.alignRenderer();

    // Advance to the first frame and draw the artboard
    this.artboard.advance(0);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.artboard.draw(this.renderer);
    this.ctx.restore();
  }

  // Adds animations contained in the artboard for playback
  private playAnimations(animationNames?: string | string[]): string[] {
    animationNames = mapToStringArray(animationNames);
    const instancedAnimationNames = this.animations.map(a => a.name);
    for (const i in animationNames) {
      const index = instancedAnimationNames.indexOf(animationNames[i]);
      if (index >= 0) {
        // Animation is already instanced, unpause it
        this.animations[index].paused = false;
      } else {
        // Create a new animation instance and add it to the list
        const anim = this.artboard.animationByName(animationNames[i]);
        const inst = new this.runtime.LinearAnimationInstance(anim);
        this.animations.push(new Animation(anim, inst));
      }
    }

    return this.animations.filter(a => !a.paused).map(a => a.name);
  }

  // Removes animations from playback
  private removeAnimations(animationNames: string[]): string[] {
    // Determine which animations need to be removed
    const animationsToRemove = this.animations.filter(
      a => animationNames.indexOf(a.name) >= 0
    );

    // Remove the animations
    animationsToRemove.forEach(a =>
      this.animations.splice(this.animations.indexOf(a), 1)
    );

    // Return the list of animations removed
    return animationsToRemove.map(a => a.name);
  }

  // Removes all animations from playback
  private removeAllAnimations(): string[] {
    const names = this.animations.map(a => a.name);
    this.animations.splice(0, this.animations.length);
    return names;
  }

  // Pauses animations
  private pauseAnimations(animationNames: string[]): string[] {
    const pausedAnimationNames: string[] = [];

    this.animations.forEach((a, i) => {
      if (animationNames.indexOf(a.name) >= 0) {
        a.paused = true;
        pausedAnimationNames.push(a.name);
      }
    });
    return pausedAnimationNames;
  }

  // Returns true if at least one animation is active
  private get hasPlayingAnimations(): boolean {
    return this.animations.reduce((acc, curr) => acc || !curr.paused, false);
  }

  // Ensure there's at least one animation for playback; if there are none
  // marked for playback, then ad the first animation in the artboard.
  private atLeastOneAnimationForPlayback(): void {
    if (this.animations.length === 0 && this.artboard.animationCount() > 0) {
      // Add the default animation
      const animation = this.artboard.animationByIndex(0);
      const instance = new this.runtime.LinearAnimationInstance(animation);
      this.animations.push(new Animation(animation, instance));
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
    const activeAnimations = this.animations.filter(a => !a.paused);
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update the renderer alignment if necessary
    this.alignRenderer();

    // this.ctx.clearRect(artboard.bounds.min[0], artboard.bounds.min[1], artboard.bounds.width, artboard.bounds.height);

    // Render the frame in the canvas
    this.ctx.save();
    this.artboard.draw(this.renderer);
    this.ctx.restore();

    for (const animation of this.animations) {
      // Emit if the animation looped
      if (animation.loopValue === 0 && animation.loopCount) {
        animation.loopCount = 0;
        // This is a one-shot; if it has ended, delete the instance
        this.stop(animation.name);
      }
      else if (animation.loopValue === 1 && animation.loopCount) {
        this.eventManager.fire({
          type: EventType.Loop,
          data: { animation: animation.name, type: LoopType.Loop }
        });
        animation.loopCount = 0;
      }
      // Wasm indicates a loop at each time the animation
      // changes direction, so a full loop/lap occurs every
      // two loop counts
      else if (animation.loopValue === 2 && animation.loopCount > 1) {
        this.eventManager.fire({
          type: EventType.Loop,
          data: { animation: animation.name, type: LoopType.PingPong }
        });
        animation.loopCount = 0;
      }
    }

    // Calling requestAnimationFrame will rerun draw() at the correct rate:
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    if (this.playState === PlaybackState.Play) {
      this.frameRequestId = requestAnimationFrame(this.draw.bind(this));
    } else if (this.playState === PlaybackState.Pause) {
      // Reset the end time so on playback it starts at the correct frame
      this.lastRenderTime = 0;
    } else if (this.playState === PlaybackState.Stop) {
      // Reset animation instances, artboard and time
      // TODO: implement this properly when we have instancing
      // this.initArtboard();
      // this.drawFrame();
      this.lastRenderTime = 0;
    }
  }

  /**
   * Align the renderer
   */
  private alignRenderer(): void {
    // Update the renderer alignment if necessary
    if (this._updateLayout) {
      // Restore from previous save in case a previous align occurred
      this.ctx.restore();
      // Canvas must be wiped to prevent artifacts
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Now save so that future changes to align can restore
      this.ctx.save();
      // Align things up safe in the knowledge we can restore if changed
      this.renderer.align(
        this._layout.runtimeFit(this.runtime),
        this._layout.runtimeAlignment(this.runtime),
        {
          minX: this._layout.minX,
          minY: this._layout.minY,
          maxX: this._layout.maxX,
          maxY: this._layout.maxY
        },
        this.artboard.bounds
      );
      this._updateLayout = false;
    }
  }

  // Plays specified animations; if none specified, it plays paused ones.
  public play(animationNames?: string | string[]): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, queue up the play
    if (!this.loaded) {
      this.taskQueue.add({
        action: () => this.play(animationNames),
      });
      return;
    }

    const playingAnimations = this.playAnimations(animationNames);
    this.atLeastOneAnimationForPlayback();
    this.playState = PlaybackState.Play;
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
      this.playState = PlaybackState.Pause;
    }
    this.eventManager.fire({
      type: EventType.Pause,
      data: this.pausedAnimationNames,
    });
  }

  // Stops specified animations; if none specifies, stops them all.
  public stop(animationNames?: string | string[] | undefined): void {
    animationNames = mapToStringArray(animationNames);

    const stoppedAnimationNames: string[] = animationNames.length === 0 ?
      this.removeAllAnimations() :
      this.removeAnimations(animationNames);

    if (!this.hasPlayingAnimations || animationNames.length === 0) {
      // Immediately cancel the next frame draw; if we don't do this,
      // strange things will happen if the Rive file/buffer is
      // reloaded.
      cancelAnimationFrame(this.frameRequestId);
      this.playState = PlaybackState.Stop;
    }
    this.eventManager.fire({
      type: EventType.Stop,
      data: stoppedAnimationNames,
    });
  }

  // Loads a new Rive file, keeping listeners in place
  public load(params: RiveLoadParameters): void {
    // Stop all animations
    this.stop();
    // Update the layout to account for new renderer
    this._updateLayout = true;
    // Reinitialize
    this.init(params);
  }

  // Sets a new layout
  public set layout(layout: Layout) {
    this._layout = layout;
    this._updateLayout = true;
    // If the maxX or maxY are 0, then set them to the canvas width and height
    if (!layout.maxX || !layout.maxY) {
      this.resizeToCanvas();
    }
    if (this.loaded && !this.hasPlayingAnimations) {
      this.drawFrame();
    }
  }

  /**
   * Returns the current layout. Note that layout should be treated as
   * immutable. If you want to change the layout, create a new one use the
   * layout setter
   */
  public get layout() {
    return this._layout;
  }

  /** 
   * Sets the layout bounds to the current canvas size; this is typically called
   * when the canvas is resized
   */
  public resizeToCanvas() {
    this._layout = this.layout.copyWith({
      minX: 0,
      minY: 0,
      maxX: this.canvas.width,
      maxY: this.canvas.height
    });
    this._updateLayout = true;
  }

  // Returns the animation source, which may be undefined
  public get source(): string {
    return this.src;
  }

  // Returns a list of animation names on the chosen artboard
  public get animationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    const animationNames: string[] = [];
    for (let i = 0; i < this.artboard.animationCount(); i++) {
      animationNames.push(this.artboard.animationByIndex(i).name);
    }
    return animationNames;
  }

  /**
   * Returns a list of state machine names from the current artboard
   */
  public get stateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    const stateMachineNames: string[] = [];
    for (let i = 0; i < this.artboard.stateMachineCount(); i++) {
      stateMachineNames.push(this.artboard.stateMachineByIndex(i).name);
    }
    return stateMachineNames;
  }

  private getRuntimeStateMachine(name: string): any {
    for (let i = 0; i < this.artboard.stateMachineCount(); i++) {
      const stateMachine = this.artboard.stateMachineByIndex(i);
      if (stateMachine.name === name) {
        return stateMachine;
      }
    }
  }

  /**
   * Returns the inputs for the specified state machine, or an empty list if the
   * name is invalid
   * @param name the state machine name
   * @returns the inputs for the named state machine
   */
  public stateMachineInputs(name: string): StateMachineInput[] {
    const runtimeStateMachine = this.getRuntimeStateMachine(name);
    if (!runtimeStateMachine) {
      return [];
    }
    const stateMachine = new StateMachine(runtimeStateMachine, this.runtime);
    return stateMachine.inputs;
  }

  // Returns a list of playing animation names
  public get playingAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animations
      .filter(a => !a.paused)
      .map(a => a.name);
  }

  // Returns a list of paused animation names
  public get pausedAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animations
      .filter(a => a.paused)
      .map(a => a.name);
  }

  // Returns true if playing
  public get isPlaying(): boolean {
    return this.playState === PlaybackState.Play;
  }

  // Returns trus if all animations are paused
  public get isPaused(): boolean {
    return this.playState === PlaybackState.Pause;
  }

  // Returns true if all animations are stopped
  public get isStopped(): boolean {
    return this.playState === PlaybackState.Stop;
  }

  // Register a new listener
  public on(type: EventType, callback: EventCallback) {
    this.eventManager.add({
      type: type,
      callback: callback,
    });
  }

  /**
   * Returns the contents of a Rive file: the artboards, animations, and state machines
   */
  public get contents(): RiveFileContents {
    if (!this.loaded) {
      return undefined;
    }
    const riveContents: RiveFileContents = {
      artboards: [],
    };
    for (let i = 0; i < this.file.artboardCount(); i++) {
      const artboard = this.file.artboardByIndex(i);
      const artboardContents: ArtboardContents = {
        name: artboard.name,
        animations: [],
        stateMachines: [],
      };
      for (let j = 0; j < artboard.animationCount(); j++) {
        const animation = artboard.animationByIndex(j);
        artboardContents.animations.push(animation.name);
      }
      for (let k = 0; k < artboard.stateMachineCount(); k++) {
        const stateMachine = artboard.stateMachineByIndex(k);
        artboardContents.stateMachines.push(stateMachine.name);
      }
      riveContents.artboards.push(artboardContents);
    }
    return riveContents;
  }
}

/**
 * Contents of an artboard
 */
interface ArtboardContents {
  animations: string[];
  stateMachines: string[];
  name: string;
}

/**
 * contents of a Rive file
 */
interface RiveFileContents {
  artboards?: ArtboardContents[];
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