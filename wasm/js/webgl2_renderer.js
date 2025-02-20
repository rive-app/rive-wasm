const webglOnRuntimeInitialized = Module["onRuntimeInitialized"];

Module["onRuntimeInitialized"] = function () {
  // If an initialize function is already configured, execute that first.
  webglOnRuntimeInitialized && webglOnRuntimeInitialized();

  let _offscreenGL = null;
  const _pendingOffscreenRenderers = new Set();

  function OffscreenRenderer(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext("2d");

    this._realRenderer = _offscreenGL;

    this._drawList = [];
    this._saveCount = 0;

    this["clear"] = function () {
      // This is not expected to be called when there are any saves on the canvas.
      console.assert(this._saveCount == 0);
      this._drawList = [];
      _pendingOffscreenRenderers.delete(this);
    };

    this["save"] = function () {
      ++this._saveCount;
      this._drawList.push(_offscreenGL["save"].bind(_offscreenGL));
    };

    this["restore"] = function () {
      if (this._saveCount > 0) {
        this._drawList.push(_offscreenGL["restore"].bind(_offscreenGL));
        --this._saveCount;
      }
    };

    this["transform"] = function (xform) {
      this._drawList.push(_offscreenGL["transform"].bind(_offscreenGL, xform));
    };

    this["align"] = function (fit, align, from, to, scaleFactor = 1.0) {
      this._drawList.push(
        _offscreenGL["align"].bind(
          _offscreenGL,
          fit,
          align,
          from,
          to,
          scaleFactor
        )
      );
    };

    this["flush"] = function () {
      console.assert(this._saveCount == 0);
      _pendingOffscreenRenderers.add(this);
      if (!_offscreenGL._hasPixelLocalStorage) {
        // The atlas gets poor performance with blend modes when we have to break the render pass
        // and do readbacks. Don't use it if we don't have WEBGL_shader_pixel_local_storage.
        flushOffscreenRenderers();
      }
    };

    // Empty delete method to allow calling delete from the rive file without causing a crash
    this["delete"] = function () {
    };
  }

  function makeGLRenderer(canvas, enableMSAA = false) {
    var contextAttributes = {
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

    var gl = canvas.getContext("webgl2", contextAttributes);
    if (!gl) {
      return null;
    }
    var handle = GL.registerContext(gl, contextAttributes);

    GL.makeContextCurrent(handle);

    const renderer = makeRenderer(canvas.width, canvas.height);
    renderer._handle = handle;
    renderer._canvas = canvas;
    renderer._width = canvas.width;
    renderer._height = canvas.height;
    renderer._gl = gl;
    var nativeDelete = renderer.delete;
    renderer.delete = function () {
      nativeDelete.call(this);
      GL.deleteContext(this._handle);
      this._handle = this._canvas = this._width = this._width = this._gl = null;
    };
    return renderer;
  }

  const makeRenderer = Module.makeRenderer;
  Module.makeRenderer = function (canvas, useOffScreenRenderer) {
    if (!_offscreenGL) {
      function MakeOffscreenGL(enableMSAA) {
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = 1;
        offscreenCanvas.height = 1;
        _offscreenGL = makeGLRenderer(offscreenCanvas, enableMSAA);

        _offscreenGL._hasPixelLocalStorage =
              Boolean(_offscreenGL._gl.getExtension("WEBGL_shader_pixel_local_storage"));

        _offscreenGL._maxRTSize = Math.min(
          _offscreenGL._gl.getParameter(_offscreenGL._gl.MAX_RENDERBUFFER_SIZE),
          _offscreenGL._gl.getParameter(_offscreenGL._gl.MAX_TEXTURE_SIZE)
        );

        // WEBGL_shader_pixel_local_storage works without MSAA.
        _offscreenGL._enableAntialiasCanvas = !_offscreenGL._hasPixelLocalStorage

        const webglDebugInfo = _offscreenGL._gl.getExtension("WEBGL_debug_renderer_info")
        if (webglDebugInfo) {
          const vendor = _offscreenGL._gl.getParameter(webglDebugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = _offscreenGL._gl.getParameter(webglDebugInfo.UNMASKED_RENDERER_WEBGL);
          if (vendor.includes("Google") && renderer.includes("ANGLE Metal Renderer")) {
            // We experience flickering on Chrome/Metal when using a WebGL context with
            // "antialias:true". This appears to be a synchronization issue internal to the browser.
            // Avoid "antialias:true" in this case, opting instead to do our own internal MSAA.
            _offscreenGL._enableAntialiasCanvas = false;
          }
        }

        return _offscreenGL;
      }

      _offscreenGL = MakeOffscreenGL(/*enableMSAA =*/true);
      if (!_offscreenGL._enableAntialiasCanvas) {
        // This browser prefers "antialias:false". Re-create the offscreen without MSAA.
        _offscreenGL = MakeOffscreenGL(/*enableMSAA =*/false);
      }
    }
    if (useOffScreenRenderer) {
      return new OffscreenRenderer(canvas);
    }
    return makeGLRenderer(
      canvas,
      /*enableMSAA =*/ _offscreenGL._enableAntialiasCanvas
    );
  };

  const nativeDelete = Module["Artboard"]["prototype"]["delete"];

  Module["Artboard"]["prototype"]["delete"] = function () {
    this.artboardDeleted = true;
    nativeDelete.call(this);
  };

  const wasmDraw = Module["Artboard"]["prototype"]["draw"];
  Module["Artboard"]["prototype"]["draw"] = function (renderer) {
    if (renderer._drawList) {
      // TODO: Is this safe? If the artboard is mutable, are we OK with rendering whatever
      // state it's in during flush time, rather than right now?
      renderer._drawList.push(() => {
        if (this.artboardDeleted) {
          return;
        }
        wasmDraw.call(this, renderer._realRenderer);
      });
    } else {
      wasmDraw.call(this, renderer);
    }
  };

  // Finds the next power/log of 2 that is >= n:
  //
  //    nextpow2(7) => 8
  //    nextpow2(8) => 8
  //    nextpow2(9) => 16
  //
  function nextlog2(n) {
    return n <= 0 ? 0 : 32 - Math.clz32(n - 1);
  }
  function nextpow2(n) {
    return 1 << nextlog2(n);
  }

  const _atlasMaxRecentWidth = new MaxRecentSize(
    1000 /*1sec*/,
    8 /*aligned to multiples of 256*/
  );
  const _atlasMaxRecentHeight = new MaxRecentSize(
    1000 /*1sec*/,
    8 /*aligned to multiples of 256*/
  );

  // Draws the offscreen renderers all together in a single atlas.
  function flushOffscreenRenderers() {
    if (!_offscreenGL) {
      return;
    }
    const maxRTSize = _offscreenGL._maxRTSize;

    // Gather some atlas stats and transfer the pending renders to a sortable array.
    let maxCanvasWidth = 0,
      maxCanvasHeight = 0,
      combinedCanvasArea = 0;
    const flushingRenderers = new Array(_pendingOffscreenRenderers.size);
    let i = 0;
    for (const renderer of _pendingOffscreenRenderers) {
      // Don't let any canvas backings grow larger than the max render target size.
      renderer._backingWidth = Math.min(renderer._canvas.width, maxRTSize);
      renderer._backingHeight = Math.min(renderer._canvas.height, maxRTSize);
      renderer._backingArea = renderer._backingHeight * renderer._backingWidth;
      maxCanvasWidth = Math.max(maxCanvasWidth, renderer._backingWidth);
      maxCanvasHeight = Math.max(maxCanvasHeight, renderer._backingHeight);
      combinedCanvasArea += renderer._backingArea;
      flushingRenderers[i++] = renderer;
    }
    _pendingOffscreenRenderers.clear();
    if (combinedCanvasArea <= 0) {
      return;
    }

    // Determine an initial size for the atlas.
    let atlasInitialWidth = nextpow2(maxCanvasWidth);
    let atlasInitialHeight = nextpow2(maxCanvasHeight);
    while (atlasInitialHeight * atlasInitialWidth < combinedCanvasArea) {
      if (atlasInitialWidth <= atlasInitialHeight) {
        atlasInitialWidth *= 2;
      } else {
        atlasInitialHeight *= 2;
      }
    }
    atlasInitialWidth = Math.min(atlasInitialWidth, maxRTSize);
    atlasInitialWidth = Math.min(atlasInitialHeight, maxRTSize);

    // Sort the renders, largest canvases first. This yields more efficient atlas packing.
    flushingRenderers.sort((a, b) => {
      return b._backingArea - a._backingArea;
    });

    // Render the canvasas in as few atlases as possible.
    const rectanizer = new Module["DynamicRectanizer"](maxRTSize);
    let flushStartIdx = 0;
    while (flushStartIdx < flushingRenderers.length) {
      rectanizer.reset(atlasInitialWidth, atlasInitialHeight);

      // Stuff as many canvases into the atlas as we can fit.
      let flushEndIdx = flushStartIdx;
      for (; flushEndIdx < flushingRenderers.length; ++flushEndIdx) {
        const renderer = flushingRenderers[flushEndIdx];
        let pos = rectanizer["addRect"](
          renderer._backingWidth,
          renderer._backingHeight
        );
        if (pos < 0) {
          // The atlas ran out of room. Flush.
          // (The atlas should always be big enough to fit at least one canvas.)
          console.assert(flushEndIdx > flushStartIdx);
          break;
        }
        renderer._atlasX = pos & 0xffff;
        renderer._atlasY = pos >> 16;
      }

      // Determine either:
      //
      //   * How large the atlas needs to be,
      //   * or the largest atlas dimensions we have used over the past second.
      //
      // Take whichever of those is larger and round it up to the nearest multiple of 512.
      const atlasWidth = _atlasMaxRecentWidth.push(rectanizer["drawWidth"]());
      const atlasHeight = _atlasMaxRecentHeight.push(
        rectanizer["drawHeight"]()
      );
      console.assert(atlasWidth >= rectanizer["drawWidth"]());
      console.assert(atlasHeight >= rectanizer["drawHeight"]());
      console.assert(atlasWidth <= maxRTSize);
      console.assert(atlasHeight <= maxRTSize);
      if (_offscreenGL._canvas.width != atlasWidth) {
        _offscreenGL._canvas.width = atlasWidth;
      }
      if (_offscreenGL._canvas.height != atlasHeight) {
        _offscreenGL._canvas.height = atlasHeight;
      }

      // Render the atlas.
      _offscreenGL["clear"]();
      for (let i = flushStartIdx; i < flushEndIdx; ++i) {
        const renderer = flushingRenderers[i];

        // Clip to prevent the artboard from drawing outside its bounds.
        _offscreenGL["saveClipRect"](
          renderer._atlasX,
          renderer._atlasY,
          renderer._atlasX + renderer._backingWidth,
          renderer._atlasY + renderer._backingHeight
        );

        // Transform to the artboard's location in the atlas.
        let mat = new Module["Mat2D"]();
        mat["xx"] = renderer._backingWidth / renderer._canvas.width;
        mat["yy"] = renderer._backingHeight / renderer._canvas.height;
        mat["xy"] = mat["yx"] = 0;
        mat["tx"] = renderer._atlasX;
        mat["ty"] = renderer._atlasY;
        _offscreenGL["transform"](mat);

        for (const lambda of renderer._drawList) {
          lambda();
        }

        _offscreenGL["restoreClipRect"]();

        renderer._drawList = [];
      }
      _offscreenGL["flush"]();

      // Copy out from the atlas back into canvases.
      for (let i = flushStartIdx; i < flushEndIdx; ++i) {
        const renderer = flushingRenderers[i];
        const ctx = renderer._ctx;
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(
          _offscreenGL._canvas,
          renderer._atlasX,
          renderer._atlasY,
          renderer._backingWidth,
          renderer._backingHeight,
          0,
          0,
          renderer._canvas.width,
          renderer._canvas.height
        );
      }

      flushStartIdx = flushEndIdx;
    }
  }

  const _animationCallbackHandler = new AnimationCallbackHandler();
  Module["requestAnimationFrame"] =
    _animationCallbackHandler.requestAnimationFrame.bind(
      _animationCallbackHandler
    );
  Module["cancelAnimationFrame"] =
    _animationCallbackHandler.cancelAnimationFrame.bind(
      _animationCallbackHandler
    );
  Module["enableFPSCounter"] = _animationCallbackHandler.enableFPSCounter.bind(
    _animationCallbackHandler
  );
  _animationCallbackHandler.onAfterCallbacks = flushOffscreenRenderers;

  Module["resolveAnimationFrame"] = flushOffscreenRenderers;

  let load = Module["load"];
  Module["load"] = function (
    bytes,
    fileAssetLoader,
    enableRiveAssetCDN = true
  ) {
    const loader = new Module["FallbackFileAssetLoader"]();
    if (fileAssetLoader !== undefined) {
      loader.addLoader(fileAssetLoader);
    }
    if (enableRiveAssetCDN) {
      const cdnLoader = new Module["CDNFileAssetLoader"]();
      loader.addLoader(cdnLoader);
    }

    return Promise.resolve(load(bytes, loader));
  };

  const cppClear = Module["WebGL2Renderer"]["prototype"]["clear"];
  Module["WebGL2Renderer"]["prototype"]["clear"] = function () {
    // Resize WebGL surface if the canvas size changed.
    GL.makeContextCurrent(this._handle);
    const canvas = this._canvas;
    if (this._width != canvas.width || this._height != canvas.height) {
      this.resize(canvas.width, canvas.height);
      this._width = canvas.width;
      this._height = canvas.height;
    }
    cppClear.call(this);
  };

  Module["decodeImage"] = function (bytes, onComplete) {
    let image = Module["decodeWebGL2Image"](bytes);
    onComplete(image);
  };

  let align = Module["Renderer"]["prototype"]["align"];
  Module["Renderer"]["prototype"]["align"] = function (
    fit,
    alignment,
    frame,
    content,
    scaleFactor = 1.0
  ) {
    align.call(this, fit, alignment, frame, content, scaleFactor);
  };
};
