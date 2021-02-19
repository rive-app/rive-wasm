const Rive = require('../../wasm/publish/rive');

//#region Type declarations

// Loop types
enum Loop {
  OneShot,
  Loop,
  PingPong,
}

// Playback states
enum Playback {
  Play,
  Pause,
  Stop,
}

// Loop event
type LoopEvent = [name: string, loop: Loop];

// Fit types
enum Fit {
  Cover,
  Contain,
  Fill,
  FitWidth,
  FitHeight,
  ScaleDown,
  None,
};

// Alignments
enum Alignment {
  TopLeft,
  TopCenter,
  TopRight,
  CenterLeft,
  Center,
  CenterRight,
  BottomLeft,
  BottomCenter,
  BottomRight,
};

// Fit string values
const fitValues: string[] = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none',
                                   'scaleDown'];

// Canvas string values
const alignmentValues: string[] = ['topLeft', 'topCenter', 'topRight', 'centerLeft', 'center',
                                         'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];

// Alignment of Rive animations in a canvas
class CanvasAlignment {
  fit: Fit;
  alignment: Alignment;
  minX: bigint;
  minY: bigint;
  maxX: bigint | undefined;
  maxY: bigint | undefined;

  constructor(fit: Fit.None, alignment: Alignment.Center, minX: 0n, minY: 0n,
              maxX?: bigint, maxY?: bigint) {
    this.fit = fit;
    this.alignment = alignment;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }
};

//#endregion


//#region Wasm loading

// Holds a reference to the Rive runtime
export let rive: typeof Rive;

// Loads the runtime Wasm bundle
export const loadWasm = async function() : Promise<void> {
 await Rive({
    locateFile: (file) => 'file://../../wasm/publish/' + file
  }).then((r) => {
    rive = r;

    console.log('Loaded Rive ' + r);
  }).catch((e) => {
    console.error('Unable to load Wasm module');
    throw e;
  });
};

//#endregion