let _webGL2Renderer = null;
let _webGL2RendererInitialized = false;

// This is set if the WebGL context is lost and prevents further WebGL rendering. Note
// that we don't support recovery.
let _contextLost = false;

// Reused to avoid per-frame allocations.
let _scratchTransform = null;

function scratchTransform() {
  if (!_scratchTransform) {
    _scratchTransform = new Module["Mat2D"]();
  }
  return _scratchTransform;
}

function _createWebGL2Renderer(enableMSAA) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const contextAttributes = {
    "alpha": true,
    "depth": enableMSAA,
    "stencil": enableMSAA,
    "antialias": enableMSAA,
    "premultipliedAlpha": true,
    "preserveDrawingBuffer": 0,
    "powerPreference": "high-performance",
    "failIfMajorPerformanceCaveat": 0,
    "enableExtensionsByDefault": false,
    "explicitSwapControl": 0,
    "renderViaOffscreenBackBuffer": 0,
  };

  const gl = canvas.getContext("webgl2", contextAttributes);
  if (!gl) {
    return null;
  }

  // Not calling preventDefault() leaves the context unrestorable, which is what we want.
  canvas.addEventListener("webglcontextlost", function () {
    if (!_contextLost) {
      _contextLost = true;
      console.error("WebGL context lost. Draws that rely on the WebGL2 renderer will be dropped.");
    }
  });

  const handle = GL.registerContext(gl, contextAttributes);
  GL.makeContextCurrent(handle);

  const renderer = Module["makeWebGL2Renderer"](canvas.width, canvas.height);
  if (!renderer) {
    GL.deleteContext(handle);
    return null;
  }

  renderer._handle = handle;
  renderer._canvas = canvas;
  renderer._gl = gl;
  renderer._width = canvas.width;
  renderer._height = canvas.height;

  renderer._hasPixelLocalStorage =
    Boolean(gl.getExtension("WEBGL_shader_pixel_local_storage"));
  renderer._maxRTSize = Math.min(
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    gl.getParameter(gl.MAX_TEXTURE_SIZE)
  );
  return renderer;
}

function _destroyWebGL2Renderer(renderer) {
  // Native teardown routes into glDelete*, which act on whatever context is current.
  GL.makeContextCurrent(renderer._handle);
  renderer["delete"]();
  GL.deleteContext(renderer._handle);
}

function _shouldDropMSAA(renderer) {
  if (renderer._hasPixelLocalStorage) {
    return true;
  }
  const gl = renderer._gl;
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (!debugInfo) {
    return false;
  }
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const device = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  return vendor.includes("Google") && device.includes("ANGLE Metal Renderer");
}

// Returns the renderer that draws the atlas, or null if WebGL2 isn't available.
function getWebGL2Renderer() {
  if (_contextLost) {
    return null;
  }
  if (_webGL2RendererInitialized) {
    return _webGL2Renderer;
  }
  _webGL2RendererInitialized = true;

  let renderer = _createWebGL2Renderer(/* enableMSAA = */ true);
  if (!renderer) {
    console.log("No WebGL2 support. Draws that Canvas2D can't make will be dropped.");
    return null;
  }

  if (_shouldDropMSAA(renderer)) {
    // We can't modify MSAA settings after creation, so create a new context without
    // MSAA if it's disabled.
    _destroyWebGL2Renderer(renderer);
    renderer = _createWebGL2Renderer(/* enableMSAA = */ false);
    if (!renderer) {
      return null;
    }
  }

  _webGL2Renderer = renderer;
  return _webGL2Renderer;
}

function beginWebGL2AtlasFrame(renderer, width, height) {
  GL.makeContextCurrent(renderer._handle);

  const canvas = renderer._canvas;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  if (renderer._width !== width || renderer._height !== height) {
    renderer["resize"](width, height);
    renderer._width = width;
    renderer._height = height;
  }

  // clear() is beginFrame on the C++ side, not a pixel clear.
  renderer["clear"]();
}

// Replays a path's recorded instructions into a path the Rive renderer can draw.
class RivePathBuilder {
  constructor(fillRule) {
    this._fillRule = fillRule;
    this.path = Module["makeWebGL2Path"]();
    this.path["fillRule"](fillRule);
  }

  moveTo(x, y) {
    this.path["moveTo"](x, y);
  }

  lineTo(x, y) {
    this.path["lineTo"](x, y);
  }

  cubicTo(ox, oy, ix, iy, x, y) {
    this.path["cubicTo"](ox, oy, ix, iy, x, y);
  }

  close() {
    this.path["close"]();
  }

  addPath(instructions, xx, xy, yx, yy, tx, ty) {
    const subPath = new RivePathBuilder(this._fillRule);
    for (const instruction of instructions) {
      instruction(subPath);
    }
    subPath.finalizePath();
    this.path["addPath"](subPath.path, xx, xy, yx, yy, tx, ty);
    // addRenderPath copies the verbs across, so nothing needs the sub-path after this.
    subPath.dispose();
  }

  // Rive caps a subpath that is only a moveTo, so there is nothing to stand in for it
  // here, and nothing that stops the path being extended afterwards.
  finalizePath() { }

  wasFinalized() {
    return false;
  }

  dispose() {
    this.path["unref"]();
    this.path = null;
  }
}

// Draws the atlas with the Rive WebGL2 renderer. Each entry's contents is a function that
// takes the renderer, already transformed and clipped to the entry's slot.
class WebGL2OffscreenBackend {
  constructor() {
    this.supportsPaths = true;
  }

  maxAtlasSize() {
    const renderer = getWebGL2Renderer();
    return renderer ? renderer._maxRTSize : 0;
  }

  canvas() {
    return _contextLost || !_webGL2Renderer ? null : _webGL2Renderer._canvas;
  }

  makeRivePathBuilder(fillRule) {
    return new RivePathBuilder(fillRule);
  }

  attachImage(renderImage, htmlImage) {
    renderImage._webGL2Image =
      Module["adoptWebGL2Image"](htmlImage, htmlImage.width, htmlImage.height);
  }

  releaseImage(renderImage) {
    if (renderImage._webGL2Image) {
      renderImage._webGL2Image["unref"]();
      renderImage._webGL2Image = null;
    }
  }

  render(width, height, entries) {
    const renderer = getWebGL2Renderer();
    if (!renderer) {
      return;
    }
    beginWebGL2AtlasFrame(renderer, width, height);

    const transform = scratchTransform();
    for (const entry of entries) {
      renderer["save"]();
      if (entry.needsScissor) {
        renderer["saveClipRect"](
          entry.atlasX,
          entry.atlasY,
          entry.atlasX + entry.widthInAtlas,
          entry.atlasY + entry.heightInAtlas
        );
      }

      const m = entry.atlasMatrix;
      transform["xx"] = m[0];
      transform["xy"] = m[1];
      transform["yx"] = m[2];
      transform["yy"] = m[3];
      transform["tx"] = m[4];
      transform["ty"] = m[5];
      renderer["transform"](transform);

      entry.contents(renderer);

      if (entry.needsScissor) {
        renderer["restoreClipRect"]();
      }
      renderer["restore"]();
    }

    renderer["flush"]();
  }
}

const canvasOffscreenRenderer = new CanvasOffscreenRenderer(new WebGL2OffscreenBackend());
