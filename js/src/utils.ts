// Slowly moving functionality over to Typescript

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

// Maps the playback state to the Wasm enum values
export const playbackStates = { 'play': 0, 'pause': 1, 'stop': 2 };

// Canvas fit values used in Wasm runtime
const canvasFitValues: Array<string> = [
  'cover',
  'contain',
  'fill',
  'fitWidth',
  'fitHeight',
  'none',
  'scaleDown'
];

// Canvas alignment values used in Wasm runtime
const canvasAlignmentValues: Array<string> = [
  'center',
  'topLeft',
  'topCenter',
  'topRight',
  'centerLeft',
  'centerRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight'
];

// Alignment options for Rive animations in a HTML canvas
export class CanvasAlignment {
  public fit: string;
  public alignment: string;
  public minX: number;
  public minY: number;
  public maxX: number;
  public maxY: number;

  constructor(fit: string = 'none', alignment: string = 'center', minX: number = 0, minY: number = 0, maxX: number = 0, maxY: number = 0) {
    this.fit = fit;
    this.alignment = alignment;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  // Returns fit for the Wasm runtime format
  public riveFit(rive: any): any {
    switch (this.fit) {
      case 'cover':
        return rive.Fit.cover;
      case 'contain':
        return rive.Fit.contain;
      case 'fill':
        return rive.Fit.fill;
      case 'fitWidth':
        return rive.Fit.fitWidth;
      case 'fitHeight':
        return rive.Fit.fitHeight;
      case 'scaleDown':
        return rive.Fit.scaleDown;
      case 'none':
      default:
        return rive.Fit.none;
    }
  }

  // Returns alignment for the Wasm runtime format
  public riveAlignment(rive: any): any {
    switch (this.alignment) {
      case 'topLeft':
        return rive.Alignment.topLeft;
      case 'topCenter':
        return rive.Alignment.topCenter;
      case 'topRight':
        return rive.Alignment.topRight;
      case 'centerLeft':
        return rive.Alignment.centerLeft;
      case 'centerRight':
        return rive.Alignment.centerRight;
      case 'bottomLeft':
        return rive.Alignment.bottomLeft;
      case 'bottomCenter':
        return rive.Alignment.bottomCenter;
      case 'bottomRight':
        return rive.Alignment.bottomRight;
      case 'center':
      default:
        return rive.Alignment.center;
    }
  }

}