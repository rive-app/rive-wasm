var Rive = {
  load: function () {},
  RenderPaintStyle: {
    fill: {},
    stroke: {},
  },
  FillRule: {
    evenOdd: {},
    nonZero: {},
  },
  StrokeCap: {
    butt: {},
    round: {},
    square: {},
  },
  StrokeJoin: {
    miter: {},
    round: {},
    bevel: {},
  },
  BlendMode: {
    srcOver: {},
    screen: {},
    overlay: {},
    darken: {},
    lighten: {},
    colorDodge: {},
    colorBurn: {},
    hardLight: {},
    softLight: {},
    difference: {},
    exclusion: {},
    multiply: {},
    hue: {},
    saturation: {},
    color: {},
    luminosity: {},
  },
  Renderer: {},
  Artboard: {},
  AudioSource: {},
  CanvasRenderer: {},
  RenderPath: {},
  RenderPaint: {},
  RenderImage: {},
  FileAssetLoader: {
    loadContents: function () {},
  },
  FallbackFileAssetLoader: {
    addLoader: function () {},
  },
  CustomFileAssetLoader: {},
  CDNFileAssetLoader: {},
  renderFactory: {
    makeRenderPaint: function () {},
    makeRenderPath: function () {},
    makeRenderImage: function () {},
  },
  Factory: {
    decodeAudio: function () {},
    decodeImage: function () {},
    decodeFont: function () {},
  },
  FileAsset: {
    name: {},
    fileExtension: {},
    cdnBaseUrl: {},
    isImage: {},
    isFont: {},
    isAudio: {},
    cdnUuid: {},
  },
  onRuntimeInitialized: function () {},
  makeRenderer: function () {},
  ptrToFileAsset: function () {},
  ptrToAudioAsset: function () {},
  ptrToImageAsset: function () {},
  ptrToFontAsset: function () {},
};

// miniaudio keeps all of its audio state on a single shared `window.miniaudio`
// global. When two separately-built Rive runtimes (e.g. c2d and webgl2) run on
// the same page, the first to start audio creates this object and the second REUSES it.
// If Closure renames these property names, each build mangles them differently,
// so the second runtime reads the object with names the first never wrote -> `undefined` -> crash
// (`TypeError: Cannot read properties of undefined (reading 'xa')`). Listing
// them here keeps the names literal and identical across every build, so the
// shared global is safe to share.
var miniaudio = {
  referenceCount: {},
  device_type: {
    playback: {},
    capture: {},
    duplex: {},
  },
  device_state: {
    stopped: {},
    started: {},
  },
  devices: {},
  track_device: function () {},
  untrack_device: function () {},
  untrack_device_by_index: function () {},
  get_device_by_index: function () {},
  unlock: function () {},
  unlock_event_types: {},
};
