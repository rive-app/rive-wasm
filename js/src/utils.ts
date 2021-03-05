// Slowly moving functionality over to Typescript

// import { RiveAnimation } from "../dist/rive";

const Rive = require('../../wasm/publish/rive.js');

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

// #region CanvasAlignment

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