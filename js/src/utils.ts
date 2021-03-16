// Slowly moving functionality over to Typescript

// import { RiveAnimation } from "../dist/rive";

const Runtime = require('../../wasm/publish/rive.js');

// #region LoopEvent

// Loop types. The index of the type is the value that comes from Wasm
export const loopTypes: Array<string> = ['oneShot', 'loop', 'pingPong'];

/// Loop events are returned through onloop callbacks
interface LoopEvent {
  animation: string;
  name: string;
  type: number;
}

// Creates a new LoopEvent
export let createLoopEvent = function (animation: string, loopValue: number) : LoopEvent {
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

// #region Layout

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
  public fit?: Fit;
  public alignment?: Alignment;
  public minX?: number;
  public minY?: number;
  public maxX?: number;
  public maxY?: number;

  constructor(
    fit: Fit = Fit.None,
    alignment: Alignment = Alignment.Center,
    minX: number = 0,
    minY: number = 0,
    maxX: number = 0,
    maxY: number = 0
  ) {
    this.fit = fit;
    this.alignment = alignment;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  // Alternative constructor to build a Layout from an interface/object
  static new({fit, alignment, minX, minY, maxX, maxY}: LayoutParameters) : Layout {
    return new Layout(
      fit,
      alignment,
      minX,
      minY,
      maxX,
      maxY
    );
  }

  // Returns fit for the Wasm runtime format
  public runtimeFit(rive: typeof Runtime): any {
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
  public runtimeAlignment(rive: typeof Runtime): any {
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
  private static callBackQueue = Array<RuntimeCallback>();
  // Instance of the Rive runtime
  private static rive: typeof Runtime;
  // The url for the Wasm file
  private static wasmWebPath: string = 'https://unpkg.com/rive-js@latest/dist/';
  // Local oath to the Wasm file; for testing purposes
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
        RuntimeLoader.callBackQueue.shift()(RuntimeLoader.runtime);
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
  loopCount: number = 0;
  paused: boolean = false;

  constructor(private animation: any, private instance: any) {}

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

// #region Rive

// Interface for the Rive static method contructor
export interface RiveParameters {
  canvas: HTMLCanvasElement, // canvas is required
  src?: string, // one of src or buffer is required
  buffer?: ArrayBuffer, // one of src or buffer is required
  artboard?: string,
  animations?: Array<string>,
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

export class Rive {

  // Stores a reference to 

  // Temporary variables while code is ported from js
  private _src: string;
  private _buffer: ArrayBuffer;
  private _artboardName: string;
  private _startingAnimationNames: Array<string>;
  private _canvas: HTMLCanvasElement;
  private _layout: Layout;
  private _autoplay: boolean;
  private _rive: typeof Runtime;
  private _artboard: any;
  private _ctx: CanvasRenderingContext2D;
  private _renderer: any;
  private _animations: Animation[];
  private _loaded: boolean = false;
  private _playback: number;
  private _queue: Array<any>;
  private _onload: Array<RiveCallback>;
  private _onloaderror: Array<RiveCallback>;
  private _onplay: Array<RiveCallback>;
  private _onpause: Array<RiveCallback>;
  private _onstop: Array<RiveCallback>;
  private _onloop: Array<RiveCallback>;
  private _file: any;

  constructor(
    private src: string, // uri for a (.riv) Rive file
    private buffer: ArrayBuffer, // ArrayBuffer containing Rive data
    private artboard: string, // name of the artboard to use
    private animations: Array<string> = [], // list of names of animations to queue for playback
    private canvas: HTMLCanvasElement, // canvas in which to render the artboard
    private layout: Layout = new Layout(Fit.Contain, Alignment.Center), // rendering layout inside the canvas
    private autoplay: boolean = false, // should playback begin immediately?
    private onload: () => void, // callback triggered when Rive file is loaded
    private onloaderror: () => void, // callback triggered if loading fails
    private onplay: () => void, // callback triggered when a play event occurs
    private onpause: () => void, // callback triggered when a pause event occurs
    private onstop: () => void, // callback triggered when a stop event occurs
    private onloop: () => void, // callback triggered when a loop event occurs
  ) {
    // If no source file url specified, it's a bust
    if (!src && !buffer) {
      const msg = 'Either a Rive source file or a data buffer is required.';
      console.error(msg);
      throw msg;
    }
    this._src = src;
    this._buffer = buffer;
  
    // Name of the artboard. Rive operates on only one artboard. If
    // you want to have multiple artboards, use multiple Rive instances.
    this._artboardName = artboard;
  
    // List of animations that should be played.
    this._startingAnimationNames = animations;
  
    this._canvas = canvas;
    this._layout = layout;
    this._autoplay = autoplay;
  
    // The Rive Wasm runtime
    this._rive = null;
    // The instantiated artboard
    this._artboard = null;
    // The canvas context
    this._ctx = null;
    // Rive renderer
    this._renderer
    // List of animation instances that will be played
    this._animations = [];
  
    // Tracks when the Rive file is successfully loaded and the Wasm
    // runtime is initialized.
    this._loaded = false;
  
    // Tracks the playback state
    this._playback = playbackStates.stop;
  
    // Queue of actions to take. Actions are queued if they're called before
    // Rive is initialized.
    this._queue = [];
  
    // Set up the event listeners
    this._onload = typeof onload === 'function' ? [{ fn: onload }] : [];
    this._onloaderror = typeof onloaderror === 'function' ? [{ fn: onloaderror }] : [];
    this._onplay = typeof onplay === 'function' ? [{ fn: onplay }] : [];
    this._onpause = typeof onpause === 'function' ? [{ fn: onpause }] : [];
    this._onstop = typeof onstop === 'function' ? [{ fn: onstop }] : [];
    this._onloop = typeof onloop === 'function' ? [{ fn: onloop }] : [];
  
    // Add 'load' task so the queue can be processed correctly on
    // successful load
    this._queue.push({event: 'load'});
  
    // Queue up play if necessary
    if (this._autoplay) {
      this._queue.push({
        event: 'play',
        action: () => this.play()
      });
    }

    // Wait for runtime to load
    RuntimeLoader.awaitInstance().then((runtime) => {
      this._rive = runtime;
      // Load from a source uri or a data buffer
      this.initialize();
    });
  }

  // Alternative constructor to build a Rive instance from an interface/object
  static new({
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
        this._emit('load', this.src ?? 'buffer');
      } else {
        throw '';
      }
    } catch (e) {
      const msg = `Unable to load ${this.src ?? 'buffer'}`;
      this._emit('loaderror', msg);
      console.error(msg);
      throw e ?? msg;
    }
  }

  // Initialize for playback
  private initializeArtboard(): void {
    this._artboard = this._artboardName ?
      this._file.artboard(this._artboardName) :
      this._file.defaultArtboard();

    // Check that the artboard has at least 1 animation
    if (this._artboard.animationCount() < 1) {
      const msg = 'Artboard has no animations';
      this._emit('loaderror', msg);
      throw msg;
    }

    // Get the canvas where you want to render the animation and create a renderer
    this._ctx = this._canvas.getContext('2d');
    this._renderer = new this._rive.CanvasRenderer(this._ctx);

    // Initialize the animations
    if (this._startingAnimationNames.length > 0) {
      this.playAnimations(this._startingAnimationNames);
    }
  }

  // Draws the current artboard frame
  private drawFrame() {
    // Choose how you want the animation to align in the canvas
    this._ctx.save();
    this._renderer.align(
      this._layout.runtimeFit(this._rive),
      this._layout.runtimeAlignment(this._rive),
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
    console.log(`Layout is ${this._layout}`);
  }

  // Adds animations contained in the artboard for playback
  private playAnimations(animationNames: string[]): string[] {
    const instancedAnimationNames = this._animations.map(a => a.name);
    for (const i in animationNames) {
      const index = instancedAnimationNames.indexOf(animationNames[i]);
      if (index >= 0) {
        // Animation is already instanced, unpause it
        this._animations[index].paused = false;
      } else {
        // Create a new animation instance and add it to the list
        const anim = this._artboard.animation(animationNames[i]);
        const inst = new this._rive.LinearAnimationInstance(anim);
        this._animations.push(new Animation(anim, inst));
      }
    }
  
    return this._animations.filter(a => !a.paused).map(a => a.name);
  }

  private _emit(event: string, msg: string) {}
  public play() {}
}

// Loads Rive data from a URI via fetch. Implemented in constructor so it can
// be used there.
let loadRiveFile = async (src: string): Promise<ArrayBuffer> => {
    const req = new Request(src);
    const res = await fetch(req);
    const buffer = await res.arrayBuffer();
    return buffer;
}

// #endregion
