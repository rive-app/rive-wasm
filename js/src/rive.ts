import * as rc from './rive_canvas.js';

/**
 * Generic type for a parameterless void callback
 */
export type VoidCallback = () => void;

// Tracks playback states; numbers map to the runtime's numerical values
// i.e. play: 0, pause: 1, stop: 2
enum PlaybackState {
  Play = 0,
  Pause,
  Stop
}

/**
 * Interface for artboard bounds
 */
export interface Bounds extends rc.AABB {}

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
  private cachedRuntimeFit: rc.Fit;
  private cachedRuntimeAlignment: rc.Alignment;

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
  public runtimeFit(rive: rc.RiveCanvas): rc.Fit {
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
  public runtimeAlignment(rive: rc.RiveCanvas): rc.Alignment {
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
export type RuntimeCallback = (rive: rc.RiveCanvas) => void;

// Runtime singleton; use getInstance to provide a callback that returns the
// Rive runtime
export class RuntimeLoader {

  // Singleton helpers
  private static runtime: rc.RiveCanvas;
  // Flag to indicate that loading has started/completed
  private static isLoading: boolean = false;
  // List of callbacks for the runtime that come in while loading
  private static callBackQueue: RuntimeCallback[] = [];
  // Instance of the Rive runtime
  private static rive: rc.RiveCanvas;  
  // Path to the Wasm file; default path works for testing only;
  // if embedded wasm is used then this is never used.
  private static wasmURL: string = 'dist/rive.wasm';

  // Class is never instantiated
  private constructor() { }

  // Loads the runtime
  private static loadRuntime(): void {
    rc.default({
      // Loads Wasm bundle
      locateFile: (_: string) => RuntimeLoader.wasmURL
    }).then((rive: rc.RiveCanvas) => {
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
  public static awaitInstance(): Promise<rc.RiveCanvas> {
    return new Promise<rc.RiveCanvas>((resolve, reject) =>
      RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => resolve(rive))
    );
  }

  // Manually sets the wasm url
  public static setWasmUrl(url: string): void {
    RuntimeLoader.wasmURL = url;
  }
}

// #endregion

// #region animations

// Wraps animations and instances from the runtime and keeps track of playback
// state
class Animation {
  public loopCount: number = 0;
  public readonly instance: rc.LinearAnimationInstance;

  // Time to which the animation should move to on the next render
  public scrubTo: number | null = null;

  /**
   * Constructs a new animation
   * @constructor
   * @param {any} animation: runtime animation object
   * @param {any} instance: runtime animation instance object
   */
  constructor(private animation: rc.LinearAnimation, runtime: rc.RiveCanvas, public playing: boolean) {
    this.instance = new runtime.LinearAnimationInstance(animation);
  }

  // Returns the animation's name
  public get name(): string {
    return this.animation.name;
  }

  // Returns the animation's current time
  public get time(): number {
      return this.instance.time;
  }

  // Sets the animation's current time
  public set time(value: number) {
      this.instance.time = value;
  }

  // Returns the animation's loop type
  public get loopValue(): number {
    return this.animation.loopValue;
  }

  /**
   * Advances the animation by the give time. If the animation needs scrubbing,
   * time is ignored and the stored scrub value is used.
   * @param time the time to advance the animation by if no scrubbing required
   */
  public advance(time: number) {
    if (this.scrubTo === null) {
      this.instance.advance(time);
    } else {
      this.instance.time = 0;
      this.instance.advance(this.scrubTo);
      this.scrubTo = null;
    }
  }

  public get needsScrub(): boolean {
    return this.scrubTo !== null;
  }

  /**
   * Deletes the backing Wasm animation instance; once this is called, this
   * animation is no more.
   */
  public cleanup() {
    this.instance.delete();
  }
}

// #endregion

// #region state machines

export enum StateMachineInputType {
  Number = 56,
  Trigger = 58,
  Boolean = 59,
}

/**
 * An input for a state machine
 */
export class StateMachineInput {

  constructor(public readonly type: StateMachineInputType, private runtimeInput: rc.SMIInput) { }

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
  public readonly instance: rc.StateMachineInstance;

  /**
   * @constructor
   * @param stateMachine runtime state machine object
   * @param instance runtime state machine instance object
   */
  constructor(private stateMachine: rc.StateMachine, runtime: rc.RiveCanvas, public playing: boolean) {
    this.instance = new runtime.StateMachineInstance(stateMachine);
    this.initInputs(runtime);
  }

  public get name(): string {
    return this.stateMachine.name;
  }

  /**
   * Returns a list of state names that have changed on this frame
   */
  public get statesChanged(): string[] {
    const names: string[] = [];
    for (let i = 0; i < this.instance.stateChangedCount(); i++) {
      names.push(this.instance.stateChangedNameByIndex(i));
    }
    return names;
  }

  /**
   * Fetches references to the state machine's inputs and caches them
   * @param runtime an instance of the runtime; needed for the SMIInput types
   */
  private initInputs(runtime: rc.RiveCanvas): void {
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
  private mapRuntimeInput(input: rc.SMIInput, runtime: rc.RiveCanvas): StateMachineInput {
    if (input.type === runtime.SMIInput.bool) {
      return new StateMachineInput(StateMachineInputType.Boolean, input.asBool());
    }
    else if (input.type === runtime.SMIInput.number) {
      return new StateMachineInput(StateMachineInputType.Number, input.asNumber());
    }
    else if (input.type === runtime.SMIInput.trigger) {
      return new StateMachineInput(StateMachineInputType.Trigger, input.asTrigger());
    }
  }

  /**
   * Deletes the backing Wasm state machine instance; once this is called, this
   * state machine is no more.
   */
     public cleanup() {
      this.instance.delete();
    }
}

// #endregion

// #region animator

/**
 * Manages animation
 */
class Animator {

  /**
   * Constructs a new animator
   * @constructor
   * @param runtime Rive runtime; needed to instance animations & state machines
   * @param artboard the artboard that holds all animations and state machines
   * @param animations optional list of animations
   * @param stateMachines optional list of state machines
   */
  constructor(
    private runtime: rc.RiveCanvas,
    private artboard: rc.Artboard,
    private eventManager: EventManager,
    public readonly animations: Animation[] = [],
    public readonly stateMachines: StateMachine[] = []) {}

  /**
   * Adds animations and state machines by their names. If names are shared
   * between animations & state machines, then the first one found will be
   * created. Best not to use the same names for these in your Rive file.
   * @param animatable the name(s) of animations and state machines to add
   * @returns a list of names of the playing animations and state machines
   */
  public add(animatables: string | string[], playing: boolean, fireEvent = true): string[] {
    animatables = mapToStringArray(animatables);
    // If animatables is empty, play or pause everything
    if (animatables.length === 0) {
      this.animations.forEach(a => a.playing = playing);
      this.stateMachines.forEach(m => m.playing = playing);
    } else {
      // Play/pause already instanced items, or create new instances
      const instancedAnimationNames = this.animations.map(a => a.name);
      const instancedMachineNames = this.stateMachines.map(m => m.name);
      for (const i in animatables) {
        const aIndex = instancedAnimationNames.indexOf(animatables[i]);
        const mIndex = instancedMachineNames.indexOf(animatables[i]);
        if (aIndex >= 0 || mIndex >= 0) {
          if (aIndex >= 0) {
            // Animation is instanced, play/pause it
            this.animations[aIndex].playing = playing;
          } else {
            // State machine is instanced, play/pause it
            this.stateMachines[mIndex].playing = playing;
          }
       } else {
          // Try to create a new animation instance
          const anim = this.artboard.animationByName(animatables[i]);
          if(anim) {
            this.animations.push(new Animation(anim, this.runtime, playing));
          } else {
            // Try to create a new state machine instance
            const sm = this.artboard.stateMachineByName(animatables[i]);
            if (sm) {
              this.stateMachines.push(new StateMachine(sm, this.runtime, playing));
            }
          }
        }
      }
    }
    // Fire play/paused events for animations
    if (fireEvent) {
      if (playing) {
        this.eventManager.fire({
          type: EventType.Play,
          data: this.playing,
        });
      } else {
        this.eventManager.fire({
          type: EventType.Pause,
          data: this.paused,
        });
      }
    }

    return playing ? this.playing : this.paused;
  }

  /**
   * Play the named animations/state machines
   * @param animatables the names of the animations/machines to play; plays all if empty
   * @returns a list of the playing items
   */
  public play(animatables: string | string[]): string[] {
    return this.add(animatables, true);
  }

    /**
   * Pauses named animations and state machines, or everything if nothing is
   * specified
   * @param animatables names of the animations and state machines to pause
   * @returns a list of names of the animations and state machines paused
   */
     public pause(animatables: string[]): string[] {
      return this.add(animatables, false);
    }

    /**
     * Set time of named animations
     * @param animations names of the animations to scrub
     * @param value time scrub value, a floating point number to which the playhead is jumped
     * @returns a list of names of the animations that were scrubbed
     */
    public scrub(animatables: string[], value: number): string[] {
      const forScrubbing = this.animations.filter(a => animatables.includes(a.name));
      forScrubbing.forEach(a => a.scrubTo = value);
      return forScrubbing.map(a => a.name);
    }

  /**
   * Returns a list of names of all animations and state machines currently
   * playing
   */
  public get playing(): string[] {
    return this.animations.filter(a => a.playing).map(a => a.name).concat(
           this.stateMachines.filter(m => m.playing).map(m => m.name)
    );
  }

  /**
   * Returns a list of names of all animations and state machines currently
   * paused
   */
     public get paused(): string[] {
      return this.animations.filter(a => !a.playing).map(a => a.name).concat(
             this.stateMachines.filter(m => !m.playing).map(m => m.name)
      );
    }

  /**
   * Stops and removes all named animations and state machines
   * @param animatables animations and state machines to remove
   * @returns a list of names of removed items
   */
  public stop(animatables?: string[] | string): string[] {
    animatables = mapToStringArray(animatables);

    // If nothing's specified, wipe them out, all of them
    let removedNames: string[] = [];
    // Stop everything
    if (animatables.length === 0) {
      removedNames = this.animations.map(a => a.name).concat(
        this.stateMachines.map(m => m.name)
      );
      // Clean up before emptying the arrays
      this.animations.forEach(a => a.cleanup());
      this.stateMachines.forEach(m => m.cleanup());
      // Empty out the arrays
      this.animations.splice(0, this.animations.length);
      this.stateMachines.splice(0, this.stateMachines.length);
    } else {
      // Remove only the named animations/state machines
      const animationsToRemove = this.animations.filter(
        a => animatables.includes(a.name)
      );
      
      animationsToRemove.forEach(a => {
        a.cleanup();
        this.animations.splice(this.animations.indexOf(a), 1);
      });
      const machinesToRemove = this.stateMachines.filter(
        m => animatables.includes(m.name)
      );
      machinesToRemove.forEach(m => {
        m.cleanup();
        this.stateMachines.splice(this.stateMachines.indexOf(m), 1);
      });
      removedNames = animationsToRemove.map(a => a.name).concat(
        machinesToRemove.map(m => m.name));
    }

    this.eventManager.fire({
      type: EventType.Stop,
      data: removedNames,
    });

    // Return the list of animations removed
    return removedNames;
  }

  /**
   * Returns true if at least one animation is active
   */
  public get isPlaying(): boolean {
    return this.animations.reduce((acc, curr) => acc || curr.playing, false)
        || this.stateMachines.reduce((acc, curr) => acc || curr.playing, false);
  }

  /**
   * Returns true if all animations are paused and there's at least one animation
   */
  public get isPaused(): boolean {
    return !this.isPlaying && 
           (this.animations.length > 0 || this.stateMachines.length > 0);  
  }

  /**
   * Returns true if there are no playing or paused animations/state machines
   */
  public get isStopped(): boolean {
    return this.animations.length === 0 && this.stateMachines.length === 0;
  }

  /**
   * If there are no animations or state machines, add the first one found
   * @returns the name of the animation or state machine instanced
   */
   public atLeastOne(playing: boolean, fireEvent = true): string {
    let instancedName: string;
    if (this.animations.length === 0 && this.stateMachines.length === 0) {
      if(this.artboard.animationCount() > 0) {
        // Add the first animation
        this.add([instancedName = this.artboard.animationByIndex(0).name], playing, fireEvent);
      } else if(this.artboard.stateMachineCount() > 0) {
        // Add the first state machine
        this.add([instancedName = this.artboard.stateMachineByIndex(0).name], playing, fireEvent);
      }
    }
    return instancedName;
  }

  /**
   * Checks if any animations have looped and if so, fire the appropriate event
   */
  public handleLooping() {
    for (const animation of this.animations.filter(a => a.playing)) {
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
  }

  /**
   * Checks if states have changed in state machines and fires a statechange
   * event
   */
  public handleStateChanges() {
    const statesChanged: string[] = [];
    for (const stateMachine of this.stateMachines.filter(sm => sm.playing)) {
     statesChanged.push(...stateMachine.statesChanged);
    }
    if (statesChanged.length > 0) {
      this.eventManager.fire({
        type: EventType.StateChange,
        data: statesChanged,
      });
    }
  }

}

// #endregion

// #region events

/**
 * Supported event types triggered in Rive
 */
export enum EventType {
  Load        = 'load',
  LoadError   = 'loaderror',
  Play        = 'play',
  Pause       = 'pause',
  Stop        = 'stop',
  Loop        = 'loop',
  Draw        = 'draw',
  StateChange = 'statechange',
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

  /**
   * Removes a listener
   * @param listener the listener with the callback to be removed
   */
  public remove(listener: EventListener): void {
    // We can't simply look for the listener as it'll be a different instance to
    // one originally subscribed. Find all the listeners of the right type and
    // then check their callbacks which should match.
    for (let i = 0; i < this.listeners.length; i++) {
      const currentListener = this.listeners[i];
      if (currentListener.type === listener.type) {
        if (currentListener.callback === listener.callback) {
          this.listeners.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Clears all listeners of specified type, or every listener if no type is
   * specified
   * @param type the type of listeners to clear, or all listeners if not
   * specified
   */
  public removeAll(type?: EventType) {
    if (!type) {
      this.listeners.splice(0, this.listeners.length);
    } else {
      this.listeners
        .filter((l) => l.type === type)
        .forEach((l) => this.remove(l));
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
  action: VoidCallback,
  event?: Event,
}

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
  animations?: string | string[],
  stateMachines?: string | string[],
  layout?: Layout,
  autoplay?: boolean,
  onLoad?: EventCallback,
  onLoadError?: EventCallback,
  onPlay?: EventCallback,
  onPause?: EventCallback,
  onStop?: EventCallback,
  onLoop?: EventCallback,
  onStateChange?: EventCallback,
  /**
   * @deprecated Use `onLoad()` instead
   */
  onload?: EventCallback,
  /**
   * @deprecated Use `onLoadError()` instead
   */
  onloaderror?: EventCallback,
  /**
   * @deprecated Use `onPoad()` instead
   */
  onplay?: EventCallback,
  /**
   * @deprecated Use `onPause()` instead
   */
  onpause?: EventCallback,
  /**
   * @deprecated Use `onStop()` instead
   */
  onstop?: EventCallback,
  /**
   * @deprecated Use `onLoop()` instead
   */
  onloop?: EventCallback,
  /**
   * @deprecated Use `onStateChange()` instead
   */
  onstatechange?: EventCallback,
}

// Interface to Rive.load function
export interface RiveLoadParameters {
  src?: string,
  buffer?: ArrayBuffer,
  autoplay?: boolean,
  artboard?: string,
  animations?: string | string[],
  stateMachines?: string | string[],
}

// Interface ot Rive.reset function
export interface RiveResetParameters {
  artboard?: string,
  animations?: string | string[],
  stateMachines?: string | string[],
  autoplay?: boolean,
}

export class Rive {

  // Canvas in which to render the artboard
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas;

  // A url to a Rive file; may be undefined if a buffer is specified
  private src: string;

  // Raw Rive file data; may be undefined if a src is specified
  private buffer: ArrayBuffer;

  // The layout for rendering in the canvas
  private _layout: Layout;

  // Flag to indicate if the layout has changed; used by the renderer to know
  // when to align
  private _updateLayout: boolean = true;

  // The canvas 2D context
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  // The runtime renderer
  private renderer: rc.Renderer;

  /**
   * Flag to active/deactivate renderer
   */
  private isRendererActive = true;

  // Tracks if a Rive file is loaded
  private loaded: boolean = false;

  /**
   * Tracks if a Rive file is loaded; we need this in addition to loaded as some
   * commands (e.g. contents) can be called as soon as the file is loaded.
   * However, playback commands need to be queued and run in order once initial
   * animations and autoplay has been sorted out. This applies to play, pause,
   * and start.
   */
  private readyForPlaying: boolean = false;

  // Wasm runtime
  private runtime: rc.RiveCanvas;

  // Runtime artboard
  private artboard: rc.Artboard | null = null;

  // Runtime file
  private file: rc.File;

  // Holds event listeners
  private eventManager: EventManager;

  // Manages the loading task queue
  private taskQueue: TaskQueueManager;

  // Animator: manages animations and state machines
  private animator: Animator;

  // Error message for missing source or buffer
  private static readonly missingErrorMessage: string =
    'Rive source file or data buffer required';

  constructor(params: RiveParameters) {
    this.canvas = params.canvas;
    this.src = params.src;
    this.buffer = params.buffer;
    this.layout = params.layout ?? new Layout();

    // Fetch the 2d context from the canvas
    this.ctx = this.canvas.getContext('2d');

    // New event management system
    this.eventManager = new EventManager();
    if (params.onLoad) this.on(EventType.Load, params.onLoad);
    if (params.onLoadError) this.on(EventType.LoadError, params.onLoadError);
    if (params.onPlay) this.on(EventType.Play, params.onPlay);
    if (params.onPause) this.on(EventType.Pause, params.onPause);
    if (params.onStop) this.on(EventType.Stop, params.onStop);
    if (params.onLoop) this.on(EventType.Loop, params.onLoop);
    if (params.onStateChange) this.on(EventType.StateChange, params.onStateChange);
    
    /**
     * @deprecated Use camelCase'd versions instead.
     */
    if (params.onload && !params.onLoad) this.on(EventType.Load, params.onload);
    if (params.onloaderror && !params.onLoadError) this.on(EventType.LoadError, params.onloaderror);
    if (params.onplay && !params.onPlay) this.on(EventType.Play, params.onplay);
    if (params.onpause && !params.onPause) this.on(EventType.Pause, params.onpause);
    if (params.onstop && !params.onStop) this.on(EventType.Stop, params.onstop);
    if (params.onloop && !params.onLoop) this.on(EventType.Loop, params.onloop);
    if (params.onstatechange && !params.onStateChange) this.on(EventType.StateChange, params.onstatechange);

    // Hook up the task queue
    this.taskQueue = new TaskQueueManager(this.eventManager);

    this.init({
      src: this.src,
      buffer: this.buffer,
      autoplay: params.autoplay,
      animations: params.animations,
      stateMachines: params.stateMachines,
      artboard: params.artboard
    });
  }

  // Alternative constructor to build a Rive instance from an interface/object
  public static new(params: RiveParameters): Rive {
    console.warn('This function is deprecated: please use `new Rive({})` instead');
    return new Rive(params);
  }

  // Initializes the Rive object either from constructor or load()
  private init({ src, buffer, animations, stateMachines, artboard, autoplay = false }: RiveLoadParameters): void {
    this.src = src;
    this.buffer = buffer;

    // If no source file url specified, it's a bust
    if (!this.src && !this.buffer) {
      throw new Error(Rive.missingErrorMessage);
    }

    // List of animations that should be initialized.
    const startingAnimationNames = mapToStringArray(animations);

    // List of state machines that should be initialized
    const startingStateMachineNames = mapToStringArray(stateMachines);

    // Ensure loaded is marked as false if loading new file
    this.loaded = false;
    this.readyForPlaying = false;

    // Ensure the runtime is loaded
    RuntimeLoader.awaitInstance().then((runtime) => {
      this.runtime = runtime;
      // Load Rive data from a source uri or a data buffer
      this.initData(artboard, startingAnimationNames, startingStateMachineNames, autoplay).catch(e => {
        console.error(e);
      });
    }).catch(e => {
      console.error(e);
    });
  }

  // Initializes runtime with Rive data and preps for playing
  private async initData(
    artboardName: string,
    animationNames: string[],
    stateMachineNames: string[],
    autoplay: boolean
  ): Promise<void> {
    // Load the buffer from the src if provided
    if (this.src) {
      this.buffer = await loadRiveFile(this.src);
    }
    // Load the Rive file
    this.file = await this.runtime.load(new Uint8Array(this.buffer));
    if (this.file) {
      // Initialize and draw frame
      this.initArtboard(artboardName, animationNames, stateMachineNames, autoplay);

      // Everything's set up, emit a load event
      this.loaded = true;
      this.eventManager.fire({
        type: EventType.Load,
        data: this.src ?? 'buffer'
      });

      // Flag ready for playback commands and clear the task queue; this order
      // is important or it may infinitely recurse
      this.readyForPlaying = true;
      this.taskQueue.process();

      this.drawFrame();

      return Promise.resolve();
    } else {
      const msg = 'Problem loading file; may be corrupt!';
      console.warn(msg);
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      return Promise.reject(msg);
    }
  }

  // Initialize for playback
  private initArtboard(
    artboardName: string,
    animationNames: string[],
    stateMachineNames: string[],
    autoplay: boolean
  ): void {

    // Fetch the artboard
    const rootArtboard = artboardName ?
      this.file.artboardByName(artboardName) :
      this.file.defaultArtboard();
    
    // Check we have a working artboard
    if (!rootArtboard) {
      const msg = 'Invalid artboard name or no default artboard';
      console.warn(msg);
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      return;
    }

    // Instance the artboard
    this.artboard = rootArtboard.instance();

    // Check that the artboard has at least 1 animation
    if (this.artboard.animationCount() < 1) {
      const msg = 'Artboard has no animations';
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      throw msg;
    }

    // Initialize the animator
    this.animator = new Animator(this.runtime, this.artboard, this.eventManager);

    // Get the canvas where you want to render the animation and create a renderer
    this.renderer = new this.runtime.CanvasRenderer(this.ctx);


    // Initialize the animations; as loaded hasn't happened yet, we need to
    // suppress firing the play/pause events until the load event has fired. To
    // do this we tell the animator to suppress firing events, and add event
    // firing to the task queue.
    let instanceNames: string[];
    if (animationNames.length > 0 || stateMachineNames.length > 0) {
      instanceNames = animationNames.concat(stateMachineNames);
      this.animator.add(instanceNames, autoplay, false);
    } else {
      instanceNames = [this.animator.atLeastOne(autoplay, false)];
    }
    // Queue up firing the playback events
    this.taskQueue.add({
      action: () => {},
      event: {
        type: autoplay ? EventType.Play : EventType.Pause,
        data: instanceNames,
      }
    });
  }

  // Draws the current artboard frame
  public drawFrame() {
    this.startRendering();
  }

  // Tracks the last timestamp at which the animation was rendered. Used only in
  // draw().
  private lastRenderTime: number;

  // Tracks the current animation frame request
  private frameRequestId: number | null;

  /**
   * Used be draw to track when a second of active rendering time has passed. Used for debugging purposes
   */
  private renderSecondTimer: number = 0;

  /**
   * Draw rendering loop; renders animation frames at the correct time interval.
   * @param time the time at which to render a frame
   */
  private draw(time: number, onSecond?: VoidCallback): void {
    // Clear the frameRequestId, as we're now rendering a fresh frame
    this.frameRequestId = null;

    // On the first pass, make sure lastTime has a valid value
    if (!this.lastRenderTime) {
      this.lastRenderTime = time;
    }

    // Handle the onSecond callback
    this.renderSecondTimer += (time - this.lastRenderTime);
    if (this.renderSecondTimer > 5000) {
      this.renderSecondTimer = 0;
      onSecond?.();
    }

    // Calculate the elapsed time between frames in seconds
    const elapsedTime = (time - this.lastRenderTime) / 1000;
    this.lastRenderTime = time;

    // Advance non-paused animations by the elapsed number of seconds
    // Also advance any animations that require scrubbing
    const activeAnimations = this.animator.animations.filter(a => a.playing || a.needsScrub)
      // The scrubbed animations must be applied first to prevent weird artifacts
      // if the playing animations conflict with the scrubbed animating attribuates.
      .sort((first, second) => first.needsScrub ? -1 : 1);
    for (const animation of activeAnimations) {
      animation.advance(elapsedTime);
      if (animation.instance.didLoop) {
        animation.loopCount += 1;
      }
      animation.instance.apply(this.artboard, 1.0);
    }

    // Advance non-paused state machines by the elapsed number of seconds
    const activeStateMachines = this.animator.stateMachines.filter(a => a.playing);
    for (const stateMachine of activeStateMachines) {
      stateMachine.instance.advance(this.artboard, elapsedTime);
      // stateMachine.instance.apply(this.artboard);
    }

    // Once the animations have been applied to the artboard, advance it
    // by the elapsed time.
    this.artboard.advance(elapsedTime);

    // Update the renderer alignment if necessary
    this.alignRenderer();

    this.artboard.draw(this.renderer);

    // Check for any animations that looped
    this.animator.handleLooping();

    // Check for any state machines that had a state change
    this.animator.handleStateChanges();

    // Calling requestAnimationFrame will rerun draw() at the correct rate:
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    if (this.animator.isPlaying) {
      // Request a new rendering frame
      this.startRendering();
    } else if (this.animator.isPaused) {
      // Reset the end time so on playback it starts at the correct frame
      this.lastRenderTime = 0;
    } else if (this.animator.isStopped) {
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
  }

  /**
   * Cleans up any Wasm-generated objects that need to be manually destroyed:
   * artboard instances, animation instances, state machine instances.
   *
   * Once this is called, things will need to be reinitialized or bad things
   * might happen.
   */
  public cleanup() {
    this.artboard.delete();
    // TODO: delete animation and state machine instances
  }

  // Plays specified animations; if none specified, it unpauses everything.
  public play(animationNames?: string | string[], autoplay?: true): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, queue up the play
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.play(animationNames, autoplay),
      });
      return;
    }
    this.animator.play(animationNames);
    this.startRendering();
  }

  // Pauses specified animations; if none specified, pauses all.
  public pause(animationNames?: string | string[]): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.pause(animationNames),
      });
      return;
    }
    this.animator.pause(animationNames);
  }

  public scrub(animationNames?: string | string[], value?: number): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
        this.taskQueue.add({
            action: () => this.scrub(animationNames, value),
        });
        return;
    }

    // Scrub the animation time; we draw a single frame here so that if
    // nothing's currently playing, the scrubbed animation is still rendered/
    this.animator.scrub(animationNames, value || 0);
    this.drawFrame();
  }

  // Stops specified animations; if none specifies, stops them all.
  public stop(animationNames?: string | string[] | undefined): void {
    animationNames = mapToStringArray(animationNames);
    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.stop(animationNames),
      });
      return;
    }
    this.animator.stop(animationNames);
  }

  /**
   * Resets the animation
   * @param artboard the name of the artboard, or default if none given
   * @param animations the names of animations for playback
   * @param stateMachines the names of state machines for playback
   * @param autoplay whether to autoplay when reset, defaults to false
   *
   */
  public reset(params?: RiveResetParameters): void {
    // Get the current artboard, animations, state machines, and playback states
    const artBoardName = params?.artboard;
    const animationNames = mapToStringArray(params?.animations);
    const stateMachineNames = mapToStringArray(params?.stateMachines);
    const autoplay = params?.autoplay ?? false;

    // Stop everything and clean up
    this.stop();
    this.cleanup();

    // Reinitialize an artboard instance with the state
    this.initArtboard(artBoardName, animationNames, stateMachineNames, autoplay);
  }


  // Loads a new Rive file, keeping listeners in place
  public load(params: RiveLoadParameters): void {
    // Stop all animations
    this.stop();
    // Reinitialize
    this.init(params);
  }

  // Sets a new layout
  public set layout(layout: Layout) {
    this._layout = layout;
    // If the maxX or maxY are 0, then set them to the canvas width and height
    if (!layout.maxX || !layout.maxY) {
      this.resizeToCanvas();
    }
    if (this.loaded && !this.animator.isPlaying) {
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
  }

  // Returns the animation source, which may be undefined
  public get source(): string {
    return this.src;
  }

  /**
   * Returns the name of the active artboard
   */
  public get activeArtboard(): string {
    return this.artboard.name;
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

  /**
   * Returns the inputs for the specified instanced state machine, or an empty
   * list if the name is invalid or the state machine is not instanced
   * @param name the state machine name
   * @returns the inputs for the named state machine
   */
  public stateMachineInputs(name: string): StateMachineInput[] {
    // If the file's not loaded, early out, nothing to pause
    if (!this.loaded) {
      return;
    }
    const stateMachine = this.animator.stateMachines.find(m => m.name === name);
    return stateMachine?.inputs;
  }

  // Returns a list of playing machine names
  public get playingStateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.stateMachines
      .filter(m => m.playing)
      .map(m => m.name);
  }

  // Returns a list of playing animation names
  public get playingAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.animations
      .filter(a => a.playing)
      .map(a => a.name);
  }


  // Returns a list of paused animation names
  public get pausedAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.animations
      .filter(a => !a.playing)
      .map(a => a.name);
  }

  /**
   *  Returns a list of paused machine names
   * @returns a list of state machine names that are paused
   */
  public get pausedStateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.stateMachines
      .filter(m => !m.playing)
      .map(m => m.name);
  }

  /**
   * @returns true if any animation is playing
   */
  public get isPlaying(): boolean {
    return this.animator.isPlaying;
  }

  /**
   * @returns true if all instanced animations are paused
   */
  public get isPaused(): boolean {
    return this.animator.isPaused;
  }

  /**
   * @returns true if no animations are playing or paused
   */
  public get isStopped(): boolean {
    return this.animator.isStopped;
  }

  /**
   * @returns the bounds of the current artboard, or undefined if the artboard
   * isn't loaded yet.
   */
  public get bounds(): Bounds {
    return this.artboard ? this.artboard.bounds : undefined;
  }

  /**
   * Subscribe to Rive-generated events
   * @param type the type of event to subscribe to
   * @param callback callback to fire when the event occurs
   */
  public on(type: EventType, callback: EventCallback) {
    this.eventManager.add({
      type: type,
      callback: callback,
    });
  }

  /**
   * Unsubscribes from a Rive-generated event
   * @param callback the callback to unsubscribe from
   */
  public unsubscribe(type: EventType, callback: EventCallback) {
    this.eventManager.remove({
      type: type,
      callback: callback,
    });
  }

  /**
   * Unsubscribes all listeners from an event type, or everything if no type is
   * given
   * @param type the type of event to unsubscribe from, or all types if
   * undefined
   */
  public unsubscribeAll(type?: EventType) {
    this.eventManager.removeAll(type);
  }

  /**
   * Stops the rendering loop; this is different from pausing in that it doesn't
   * change the state of any animation. It stops rendering from occurring. This
   * is designed for situations such as when Rive isn't visible.
   *
   * The only way to start rendering again is to call `startRendering`.
   * Animations that are marked as playing will start from the position that
   * they would have been at if rendering had not been stopped.
   */
  public stopRendering() {
    if (this.loaded && this.frameRequestId) {
      cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
  }

  /**
   * Starts the rendering loop if it has been previously stopped. If the
   * renderer is already active, then this will have zero effect.
   */
  public startRendering() {
    if (this.loaded && !this.frameRequestId) {
      this.frameRequestId = requestAnimationFrame(this.draw.bind(this));
    }
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
        const name = stateMachine.name;
        const instance = new this.runtime.StateMachineInstance(stateMachine);
        const inputContents: StateMachineInputContents[] = [];
        for (let l = 0; l < instance.inputCount(); l++) {
          const input = instance.input(l);
          inputContents.push({name: input.name, type: input.type});
        }
        artboardContents.stateMachines.push({name: name, inputs: inputContents});
      }
      riveContents.artboards.push(artboardContents);
    }
    return riveContents;
  }
}

/**
 * Contents of a state machine input
 */
interface StateMachineInputContents {
  name: string;
  type: StateMachineInputType;
  initialValue?: boolean | number;
}

/**
 * Contents of a state machine
 */
interface StateMachineContents {
  name: string;
  inputs: StateMachineInputContents[];
}

/**
 * Contents of an artboard
 */
interface ArtboardContents {
  animations: string[];
  stateMachines: StateMachineContents[];
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

// #region testing utilities

// Exports to only be used for tests
export const Testing = {
  EventManager: EventManager,
  TaskQueueManager: TaskQueueManager,
}

// #endregion