// Slowly moving functionality over to Typescript

// import { RiveAnimation } from "../dist/rive";

const Rive = require('../../wasm/publish/rive.js');

// #region LoopEvent

// Loop types. The index of the type is the value that comes from Wasm
export const loopTypes: Array<string> = ['oneShot', 'loop', 'pingPong'];

/// Loop events are returned through onloop callbacks
export interface LoopEvent {
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
  public runtimeFit(rive: typeof Rive): any {
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
  public runtimeAlignment(rive: typeof Rive): any {
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
export type RuntimeCallback = (rive: typeof Rive) => void;

// Runtime singleton; use getInstance to provide a callback that returns the
// Rive runtime
export class RuntimeLoader {
  
  // Singleton helpers
  private static runtime: typeof Rive;
  // Flag to indicate that loading has started/completed
  private static isLoading: boolean = false;
  // List of callbacks for the runtime that come in while loading
  private static callBackQueue = Array<RuntimeCallback>();
  // Instance of the Rive runtime
  private static rive: typeof Rive;
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
    Rive({
      // Loads Wasm bundle
      locateFile: (file: string) =>
        // if in test mode, attempts to load file locally 
        (RuntimeLoader.testMode ?
          RuntimeLoader.wasmFilePath :
          RuntimeLoader.wasmWebPath) + file
    }).then((rive: typeof Rive) => {
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
  public static awaitInstance(): Promise<typeof Rive> {
    return new Promise<typeof Rive>((resolve, reject) => 
      RuntimeLoader.getInstance((rive: typeof Rive): void => resolve(rive))
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