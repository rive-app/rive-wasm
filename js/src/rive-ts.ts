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
let _runtime: typeof Rive;

// Is the Wasm bundle loaded?
let _isWasmLoaded = () : boolean => _runtime !== undefined;

// Is the Wasm bundle loading; prevents multiple concurrent Wasm loads
let _isWasmLoading: boolean = false;

// type definitions
type OnWasmLoadedCallback = (runtime: typeof Rive) => void;

// Queue of callbacks called when Wasm is loaded
let _wasmLoadQueue: Array<(cb: OnWasmLoadedCallback) => void> = [];

// Loads the runtime Wasm bundle
export const _loadWasm = async () : Promise<void> => {
  await Rive({
    // fetches the Wasm bundle
    locateFile: (file) => 'file://../../wasm/publish/' + file
  }).then((r: typeof Rive) => {
    _runtime = r;
    // Fire all the callbacks
    while (_wasmLoadQueue.length > 0) {
      _wasmLoadQueue.shift()?.(_runtime);
    }
  }).catch((e) => {
    console.error('Unable to load Wasm module');
    throw e;
  });
};

// Adds a listener for Wasm load
const _onWasmLoaded = (cb: OnWasmLoadedCallback) : void => {
  if (!_isWasmLoading) {
    // Start loading Wasm
    _isWasmLoading = true;
    _loadWasm();
  }
  if (_runtime !== undefined) {
    // Wasm already loaded, fire immediately
    cb(_runtime);
  } else {
    // Add to the callback queue
    _wasmLoadQueue.push(cb);
  }
};

// Unloads the Wasm bundle; used in testing
let _unloadWasm = () : void => {
  _runtime = undefined;
  _isWasmLoading = false;
};

//#endregion

// Exports for testing purposes only
export const testables = {
  loadWasm: _loadWasm,
  isWasmLoaded: _isWasmLoaded,
  onWasmLoaded: _onWasmLoaded,
  unloadWasm: _unloadWasm,
}