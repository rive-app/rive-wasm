// Style note:
// - foo["bar"] is used for anything that's part of the public API to prevent minification
// - foo["_bar"] is used for anything that's private but needs to be accessed from the C++ side to prevent minification
// - foo._bar is used for anything that's private to only this file and can be minified

function makeMatrix(xx, xy, yx, yy, tx, ty) {
  const m = new DOMMatrix();
  m.a = xx;
  m.b = xy;
  m.c = yx;
  m.d = yy;
  m.e = tx;
  m.f = ty;
  return m;
}

// We'll allow calling methods on the c2d context via the Proxy returned by `.makeRenderer()`. This is a list of methods that are allowed.
const c2dMethodBlockList = [
  "createConicGradient",
  "createImageData",
  "createLinearGradient",
  "createPattern",
  "createRadialGradient",
  "getContextAttributes",
  "getImageData",
  "getLineDash",
  "getTransform",
  "isContextLost",
  "isPointInPath",
  "isPointInStroke",
  "measureText",
];

const rendererOnRuntimeInitialized = Module["onRuntimeInitialized"];
Module["onRuntimeInitialized"] = function () {
  // If an initialize function is already configured, execute that first.
  rendererOnRuntimeInitialized && rendererOnRuntimeInitialized();

  const RenderPaintStyle = Module.RenderPaintStyle;
  const FillRule = Module.FillRule;
  const RenderPath = Module.RenderPath;
  const RenderImage = Module.RenderImage;

  const FileAssetLoader = Module.FileAssetLoader;

  const RenderPaint = Module.RenderPaint;
  const Renderer = Module.Renderer;
  const StrokeCap = Module.StrokeCap;
  const StrokeJoin = Module.StrokeJoin;
  const BlendMode = Module.BlendMode;

  const fill = RenderPaintStyle.fill;
  const stroke = RenderPaintStyle.stroke;

  const evenOdd = FillRule.evenOdd;
  const nonZero = FillRule.nonZero;

  // Mirrors RIVE_MITER_LIMIT in the renderer's constants.glsl.
  const RIVE_MITER_LIMIT = 4;

  // Draws what canvas 2D can't. Every canvas 2D build has one, though only the WebGL2
  // backend can draw paths.
  const _offscreenRenderer = canvasOffscreenRenderer;
  const _offscreenBackend = _offscreenRenderer.backend;

  let _nextImageUniqueID = 1;

  var CanvasRenderImage = RenderImage.extend("CanvasRenderImage", {
    "__construct": function ({ onComplete, onDecode } = {}) {
      this["__parent"]["__construct"].call(this);
      this._uniqueID = _nextImageUniqueID;
      _nextImageUniqueID = (_nextImageUniqueID + 1) & 0x7fffffff || 1;
      this.onComplete = onComplete;
      this.onDecode = onDecode;
      this._image = null;
      this._newObjectUrl = null;
      // Only one of these is set, depending on which backend is hooked up.
      this._webGL2Image = null;
      this._meshTexture = null;
    },
    "__destruct": function () {
      _offscreenBackend.releaseImage(this);
      if (this._newObjectUrl) {
        // Recommended to release this when it's safe to do so
        // Source: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static#memory_management
        URL.revokeObjectURL(this._newObjectUrl);
      }
      this["__parent"]["__destruct"].call(this);
    },
    "decode": function (bytes) {
      var cri = this;
      // Question: could .bind(cri);
      cri.onDecode && cri.onDecode(cri);
      var image = new Image();
      cri._newObjectUrl = URL.createObjectURL(
        new Blob([bytes], {
          type: "image/png",
        })
      );
      // TODO: there is no onerror handler, so an image that fails to load never fires
      // onComplete, and the promise from Module.load() never settles.
      image.onload = function () {
        cri._image = image;
        _offscreenBackend.attachImage(cri, image);
        cri["size"](image.width, image.height);

        cri.onComplete && cri.onComplete(cri);
      };
      image.src = cri._newObjectUrl;
    },
  });

  function _canvasCap(value) {
    switch (value) {
      case StrokeCap.butt:
        return "butt";
      case StrokeCap.round:
        return "round";
      case StrokeCap.square:
        return "square";
    }
  }

  function _canvasJoin(value) {
    switch (value) {
      case StrokeJoin.miter:
        return "miter";
      case StrokeJoin.round:
        return "round";
      case StrokeJoin.bevel:
        return "bevel";
    }
  }

  function _canvasBlend(value) {
    switch (value) {
      case BlendMode.srcOver:
        return "source-over";
      case BlendMode.additive:
        return "plus-lighter";
      case BlendMode.screen:
        return "screen";
      case BlendMode.overlay:
        return "overlay";
      case BlendMode.darken:
        return "darken";
      case BlendMode.lighten:
        return "lighten";
      case BlendMode.colorDodge:
        return "color-dodge";
      case BlendMode.colorBurn:
        return "color-burn";
      case BlendMode.hardLight:
        return "hard-light";
      case BlendMode.softLight:
        return "soft-light";
      case BlendMode.difference:
        return "difference";
      case BlendMode.exclusion:
        return "exclusion";
      case BlendMode.multiply:
        return "multiply";
      case BlendMode.hue:
        return "hue";
      case BlendMode.saturation:
        return "saturation";
      case BlendMode.color:
        return "color";
      case BlendMode.luminosity:
        return "luminosity";
    }
  }

  // Builds Path2D instances from the set of instructions with a few modifications to
  // the default Path2D behavior to conform to the Rive renderer.
  // Possible perf note: transformPoint is called a lot here, and creates a temporary
  // point object for both the input and the output. We may want to revisit this if it
  // shows up as a bottleneck.
  class Path2DBuilder {
    constructor(pointTransform) {
      this._pointTransform = pointTransform;
      this.path = new Path2D();
      // The last moveTo, until a verb continues its subpath
      this._pendingMove = null;
      this._finalized = false;
    }

    _capPendingMove() {
      if (this._pendingMove !== null) {
        // Match the Rive renderer's behavior by adding a cap for an isolated moveTo.
        this.path["lineTo"](this._pendingMove.x, this._pendingMove.y);
        this._pendingMove = null;
      }
    }

    moveTo(x, y) {
      // Cap the subpath this moveTo is about to leave behind, before it is forgotten.
      this._capPendingMove();
      let px = x, py = y;
      if (this._pointTransform !== null) {
        const p = this._pointTransform.transformPoint({ x, y });
        px = p.x;
        py = p.y;
      }
      this.path["moveTo"](px, py);
      this._pendingMove = { x: px, y: py };
    }

    lineTo(x, y) {
      this._pendingMove = null;
      if (this._pointTransform !== null) {
        const p = this._pointTransform.transformPoint({ x, y });
        this.path["lineTo"](p.x, p.y);
      } else {
        this.path["lineTo"](x, y);
      }
    }

    cubicTo(ox, oy, ix, iy, x, y) {
      this._pendingMove = null;
      if (this._pointTransform !== null) {
        const o = this._pointTransform.transformPoint({ x: ox, y: oy });
        const i = this._pointTransform.transformPoint({ x: ix, y: iy });
        const p = this._pointTransform.transformPoint({ x, y });
        this.path["bezierCurveTo"](o.x, o.y, i.x, i.y, p.x, p.y);
      } else {
        this.path["bezierCurveTo"](ox, oy, ix, iy, x, y);
      }
    }

    close() {
      this._pendingMove = null;
      this.path["closePath"]();
    }

    addPath(instructions, xx, xy, yx, yy, tx, ty) {
      this._capPendingMove();
      const subPath = new Path2DBuilder(null);
      for (const instruction of instructions) {
        instruction(subPath);
      }
      subPath.finalizePath();
      let transform = makeMatrix(xx, xy, yx, yy, tx, ty);
      if (this._pointTransform !== null) {
        transform = this._pointTransform.multiply(transform);
      }
      this.path["addPath"](subPath.path, transform);
    }

    finalizePath() {
      if (this._pendingMove !== null && !this._finalized) {
        this._capPendingMove();
        // Only the trailing cap makes the path unsafe to extend, since a later verb would
        // continue the subpath it stood in for.
        this._finalized = true;
      }
    }

    wasFinalized() {
      return this._finalized;
    }

    dispose() { }
  }

  // Rive paths require explicit ref-counting but Path2D does not. These functions handle
  // both cases.
  function _refPath(path) {
    if (path["ref"]) {
      path["ref"]();
    }
  }

  function _unrefPath(path) {
    if (path["unref"]) {
      path["unref"]();
    }
  }

  // A path built from some prefix of a CanvasRenderPath's instructions. `makeBuilder`
  // decides which kind of path it produces.
  class RefCountedPath {
    constructor(makeBuilder) {
      this._makeBuilder = makeBuilder;
      this._borrowCount = 0;
      this._executedInstructionCount = 0;
      this._pointTransform = null;
      this._builder = makeBuilder(null);
    }

    clear() {
      this._reset(null);
    }

    // Returns a path that is up to date with the given instructions and transform.
    acquire(instructions, pointTransform) {
      let transformChanged;
      if (pointTransform === null) {
        transformChanged = this._pointTransform !== null;
      } else {
        transformChanged = this._pointTransform === null
          || this._pointTransform.a !== pointTransform.a
          || this._pointTransform.b !== pointTransform.b
          || this._pointTransform.c !== pointTransform.c
          || this._pointTransform.d !== pointTransform.d
          || this._pointTransform.e !== pointTransform.e
          || this._pointTransform.f !== pointTransform.f;
      }

      if (transformChanged
        || (this._executedInstructionCount < instructions.length
          && (this._borrowCount > 0 || this._builder.wasFinalized()))) {
        // The transform changed, the path is being actively borrowed, or finalizePath()
        // has added an instruction, then we can't append to the path in-place. Instead,
        // start another path and replay everything into it.
        this._reset(pointTransform);
      }

      while (this._executedInstructionCount < instructions.length) {
        instructions[this._executedInstructionCount++](this._builder);
      }
      this._builder.finalizePath();

      this._borrowCount++;
      return this._builder.path;
    }

    // If the path being released is no longer being tracked, this is a no-op.
    releaseBorrow(path) {
      if (this._builder !== null && path === this._builder.path) {
        this._borrowCount--;
      }
    }

    dispose() {
      this._builder.dispose();
      this._builder = null;
    }

    _reset(pointTransform) {
      this._builder.dispose();
      this._borrowCount = 0;
      this._executedInstructionCount = 0;
      this._pointTransform = pointTransform;
      this._builder = this._makeBuilder(pointTransform);
    }
  }

  var CanvasRenderPath = RenderPath.extend("CanvasRenderPath", {
    "__construct": function () {
      this["__parent"]["__construct"].call(this);
      // The caller may interleave draw and path modification calls, but because the draw
      // calls themselves are deferred, we cannot directly modify the path. Instead, we
      // record the path modification calls and apply them when a draw call is enqueued.
      // We may need to replay the path from scratch if there is already an outstanding
      // draw call holding a reference to the current Path2D object.
      this._pathInstructions = [];

      // Keep several separate caches to handle the case where a path is redrawn using a
      // few different techniques (e.g. filled and stroked). This is to prevent cache
      // churn.
      this._path2D = new RefCountedPath((t) => new Path2DBuilder(t));
      this._transformedPath2D = new RefCountedPath((t) => new Path2DBuilder(t));
      this._rivePaths = new Map(); // One per fill rule.

      this._fillRule = nonZero;

      // See _ensureSubpath().
      this._hasSubpath = false;
    },
    "__destruct": function () {
      this._path2D.dispose();
      this._transformedPath2D.dispose();
      for (const rivePath of this._rivePaths.values()) {
        rivePath.dispose();
      }
      this._rivePaths.clear();
      this["__parent"]["__destruct"].call(this);
    },
    "rewind": function () {
      this._pathInstructions.length = 0;
      this._path2D.clear();
      this._transformedPath2D.clear();
      for (const rivePath of this._rivePaths.values()) {
        rivePath.clear();
      }
      this._hasSubpath = false;
    },
    "addPath": function (path, xx, xy, yx, yy, tx, ty) {
      const instructionsToAdd = path._pathInstructions.slice();
      this._addPathInstruction(
        (builder) => builder.addPath(instructionsToAdd, xx, xy, yx, yy, tx, ty));
    },
    "fillRule": function (fillRule) {
      this._fillRule = fillRule;
    },
    "moveTo": function (x, y) {
      this._hasSubpath = true;
      this._addPathInstruction((builder) => builder.moveTo(x, y));
    },
    "lineTo": function (x, y) {
      this._ensureSubpath();
      this._addPathInstruction((builder) => builder.lineTo(x, y));
    },
    "cubicTo": function (ox, oy, ix, iy, x, y) {
      this._ensureSubpath();
      this._addPathInstruction((builder) => builder.cubicTo(ox, oy, ix, iy, x, y));
    },
    "close": function () {
      this._addPathInstruction((builder) => builder.close());
    },
    // Canvas2D begins a subpath at the verb's own first point (moveTo(cp1x, cp1y) for a
    // bezierCurveTo), where Rive begins an empty path at the origin (see
    // RawPath::injectImplicitMoveIfNeeded). Handle this case here to match Rive's
    // behavior (note that this doesn't need to happen after a close() call).
    _ensureSubpath: function () {
      if (!this._hasSubpath) {
        this["moveTo"](0, 0);
      }
    },
    _addPathInstruction: function (lambda) {
      this._pathInstructions.push(lambda);
    },

    _acquirePath: function (pathPointTransform) {
      const path = pathPointTransform === null
        ? this._path2D.acquire(this._pathInstructions, null)
        : this._transformedPath2D.acquire(this._pathInstructions, pathPointTransform);
      _refPath(path);
      return path;
    },
    _acquireRivePath: function (fillRule) {
      let rivePath = this._rivePaths.get(fillRule);
      if (rivePath === undefined) {
        rivePath = new RefCountedPath(
          () => _offscreenBackend.makeRivePathBuilder(fillRule));
        this._rivePaths.set(fillRule, rivePath);
      }
      const path = rivePath.acquire(this._pathInstructions, null);
      _refPath(path);
      return path;
    },
    _releasePath: function (path) {
      // The borrow goes back to whichever one still recognises the path. Calling all of
      // them is safe because each gates on that, so the reference is released only once.
      this._path2D.releaseBorrow(path);
      this._transformedPath2D.releaseBorrow(path);
      for (const rivePath of this._rivePaths.values()) {
        rivePath.releaseBorrow(path);
      }
      _unrefPath(path);
    }
  });

  function _colorStyle(value) {
    return (
      "rgba(" +
      ((0x00ff0000 & value) >>> 16) +
      "," +
      ((0x0000ff00 & value) >>> 8) +
      "," +
      ((0x000000ff & value) >>> 0) +
      "," +
      ((0xff000000 & value) >>> 24) / 0xff +
      ")"
    );
  }

  // Stops are added later using addStop(). canvasGradient is used to memoize the
  // resulting gradient+stops for reuse by multiple draw calls as long as no stops
  // were later added.
  function _makeGradient(sx, sy, ex, ey, isRadial) {
    return { sx, sy, ex, ey, isRadial, stops: [], canvasGradient: null };
  }

  // Stands in for the gradient of a paint that has none, so that _acquireWebGL2Paint() has
  // something to read the arguments the other side ignores from.
  const _noGradient = _makeGradient(0, 0, 0, 0, false);

  function _canvasGradient(ctx, gradient) {
    if (gradient.canvasGradient === null) {
      const sx = gradient.sx;
      const sy = gradient.sy;
      const ex = gradient.ex;
      const ey = gradient.ey;
      if (gradient.isRadial) {
        const dx = ex - sx;
        const dy = ey - sy;
        const radius = Math.sqrt(dx * dx + dy * dy);
        gradient.canvasGradient = ctx["createRadialGradient"](sx, sy, 0, sx, sy, radius);
      } else {
        gradient.canvasGradient = ctx["createLinearGradient"](sx, sy, ex, ey);
      }
      const stops = gradient.stops;
      for (let i = 0, l = stops.length; i < l; i++) {
        gradient.canvasGradient["addColorStop"](stops[i].stop, _colorStyle(stops[i].color));
      }
    }
    return gradient.canvasGradient;
  }

  var CanvasRenderPaint = RenderPaint.extend("CanvasRenderPaint", {
    "__construct": function () {
      this["__parent"]["__construct"].call(this);
      // Match the defaults of other renderers.
      this._style = fill;
      this._color = 0xff000000;
      this._thickness = 1;
      this._join = StrokeJoin.miter;
      this._cap = StrokeCap.butt;
      this._feather = 0;
      this._blend = _canvasBlend(BlendMode.srcOver);
      this._gradient = null;
      this._gradientTransform = null;
      this._inverseGradientTransform = null;
      this._strokeThicknessScale = 1;

      // This gets bumped each time the paint is modified and is used to control caching
      this._version = 0;
      this._webGL2Paint = null;
      this._webGL2PaintVersion = -1;
    },
    "__destruct": function () {
      if (this._webGL2Paint !== null) {
        Module["unrefWebGL2Paint"](this._webGL2Paint);
        this._webGL2Paint = null;
      }
      this["__parent"]["__destruct"].call(this);
    },
    "color": function (value) {
      this._color = value;
      this._gradient = null;
      this._version++;
    },
    "thickness": function (value) {
      this._thickness = Math.abs(value);
      this._version++;
    },
    "join": function (value) {
      this._join = value;
      this._version++;
    },
    "cap": function (value) {
      this._cap = value;
      this._version++;
    },
    "feather": function (value) {
      this._feather = Math.abs(value);
      this._version++;
    },
    "style": function (value) {
      this._style = value;
      this._version++;
    },
    "blendMode": function (value) {
      this._blend = _canvasBlend(value);
      this._version++;
    },
    "clearGradient": function () {
      this._gradient = null;
      this._version++;
    },
    "linearGradient": function (sx, sy, ex, ey) {
      this._gradient = _makeGradient(sx, sy, ex, ey, false);
      this._version++;
    },
    "radialGradient": function (sx, sy, ex, ey) {
      this._gradient = _makeGradient(sx, sy, ex, ey, true);
      this._version++;
    },
    "addStop": function (color, stop) {
      this._gradient.stops.push({ color, stop });
      this._gradient.canvasGradient = null;
      this._version++;
    },

    "completeGradient": function () { },

    "_setGradientTransform": function (xx, xy, yx, yy, tx, ty, ixx, ixy, iyx, iyy, itx, ity, thicknessScale) {
      if (xx === 1 && xy === 0 && yx === 0 && yy === 1 && tx === 0 && ty === 0) {
        // Identity - clear the matrices to skip unnecessary work.
        this._gradientTransform = null;
        this._inverseGradientTransform = null;
      } else {
        this._gradientTransform = makeMatrix(xx, xy, yx, yy, tx, ty);
        this._inverseGradientTransform = makeMatrix(ixx, ixy, iyx, iyy, itx, ity);
      }
      this._strokeThicknessScale = thicknessScale;
      this._version++;
    },

    // Turns this JS-side paint into a Rive paint that can be used with the WebGL2
    // renderer. The resulting paint is cached so repeated calls are no-ops, as
    // long as no further changes have been made.
    _acquireWebGL2Paint: function () {
      if (this._webGL2PaintVersion !== this._version) {
        if (this._webGL2Paint !== null) {
          // Any draw still holding this one has its own reference.
          Module["unrefWebGL2Paint"](this._webGL2Paint);
        }
        const gradient = this._gradient !== null ? this._gradient : _noGradient;
        let colors = null;
        let stops = null;
        if (this._gradient !== null) {
          const gradientStops = gradient.stops;
          colors = new Uint32Array(gradientStops.length);
          stops = new Float32Array(gradientStops.length);
          for (let i = 0, l = gradientStops.length; i < l; i++) {
            colors[i] = gradientStops[i].color;
            stops[i] = gradientStops[i].stop;
          }
        }
        // A null gradient transform is the identity; see _setGradientTransform().
        let xx = 1;
        let xy = 0;
        let yx = 0;
        let yy = 1;
        let tx = 0;
        let ty = 0;
        const m = this._gradientTransform;
        if (m !== null) {
          xx = m.a;
          xy = m.b;
          yx = m.c;
          yy = m.d;
          tx = m.e;
          ty = m.f;
        }
        // This paint is used to draw onto the atlas, so we keep blend mode unset and
        // apply it when copying back from the atlas to canvas 2D.
        this._webGL2Paint = Module["makeWebGL2Paint"](
          this._style,
          this._color,
          this._thickness,
          this._join,
          this._cap,
          this._feather,
          colors,
          stops,
          gradient.isRadial,
          gradient.sx,
          gradient.sy,
          gradient.ex,
          gradient.ey,
          xx,
          xy,
          yx,
          yy,
          tx,
          ty,
        );
        this._webGL2PaintVersion = this._version;
      }
      Module["refWebGL2Paint"](this._webGL2Paint);
      return this._webGL2Paint;
    }
  });

  // Draw with Canvas2D directly.
  const DRAW_MODE_NATIVE = 0;
  // Apply the inverse of the gradient transform to the raw path points, then transform
  // the path (including its gradient) by the gradient transform.
  const DRAW_MODE_GRADIENT_TRANSFORM = 1;
  // Canvas2D cannot make this draw at all, so the WebGL renderer draws it into the atlas.
  const DRAW_MODE_DELEGATE = 2;

  function _drawMode(paint) {
    // Feathering always goes through the WebGL renderer (canvas 2D's blur cannot
    // reproduce it accurately)
    if (paint._feather !== 0) {
      return _offscreenBackend.supportsPaths ? DRAW_MODE_DELEGATE : DRAW_MODE_NATIVE;
    }
    if (paint._gradient === null || paint._gradientTransform === null) {
      return DRAW_MODE_NATIVE;
    }
    // When drawing using a stroke, we scale the stroke thickness by the inverse of the
    // gradient transform's scale, if it is uniform. Otherwise, we cannot draw the stroke
    // correctly using canvas 2D, so we delegate to the WebGL renderer.
    // _strokeThicknessScale will be 0 to indicate this case.
    if (paint._style !== stroke || paint._strokeThicknessScale > 0) {
      return DRAW_MODE_GRADIENT_TRANSFORM;
    }
    // Without a backend that draws paths there is nothing to delegate to, so drop the
    // transform.
    return _offscreenBackend.supportsPaths ? DRAW_MODE_DELEGATE : DRAW_MODE_NATIVE;
  }

  // Used to skip the draw if invalid thickness has been set (this includes NaN).
  function _isNoOpDraw(paint) {
    return paint._style === stroke && !(paint._thickness > 0);
  }

  // Snapshots everything a deferred draw of `path` with `paint` needs, both of which are
  // free to mutate afterwards. Returns null if the draw would be a no-op. The returned
  // state holds a reference to the path, which must be released once the draw is done.
  function _captureDrawState(path, paint, mode, opacity) {
    if (_isNoOpDraw(paint)) {
      return null;
    }
    const withGradientTransform = mode === DRAW_MODE_GRADIENT_TRANSFORM;
    return {
      path2D: path._acquirePath(withGradientTransform ? paint._inverseGradientTransform : null),
      gradientTransform: withGradientTransform ? paint._gradientTransform : null,
      thickness: withGradientTransform ? paint._thickness * paint._strokeThicknessScale
        : paint._thickness,
      fillRule: path._fillRule === evenOdd ? "evenodd" : "nonzero",
      opacity,
      style: paint._style,
      color: paint._color,
      gradient: paint._gradient,
      cap: paint._cap,
      join: paint._join,
      blend: paint._blend,
    };
  }

  function _captureWebGL2DrawState(path, paint) {
    if (_isNoOpDraw(paint)) {
      return null;
    }
    return {
      path: path._acquireRivePath(path._fillRule),
      paint: paint._acquireWebGL2Paint(),
    };
  }

  function _releaseWebGL2DrawState(path, state) {
    path._releasePath(state.path);
    Module["unrefWebGL2Paint"](state.paint);
  }

  function _paintPath(ctx, state) {
    // Save context state we're about to modify
    const prevBlend = ctx["globalCompositeOperation"];
    const prevAlpha = ctx["globalAlpha"];

    ctx["globalCompositeOperation"] = state.blend;
    ctx["globalAlpha"] = state.opacity;

    const paintStyle = state.gradient !== null
      ? _canvasGradient(ctx, state.gradient)
      : _colorStyle(state.color);

    if (state.gradientTransform !== null) {
      ctx["save"]();
      ctx["transform"](
        state.gradientTransform.a,
        state.gradientTransform.b,
        state.gradientTransform.c,
        state.gradientTransform.d,
        state.gradientTransform.e,
        state.gradientTransform.f
      );
    }

    switch (state.style) {
      case stroke:
        ctx["strokeStyle"] = paintStyle;
        ctx["lineWidth"] = state.thickness;
        ctx["lineCap"] = _canvasCap(state.cap);
        ctx["lineJoin"] = _canvasJoin(state.join);
        ctx["miterLimit"] = RIVE_MITER_LIMIT;
        ctx["stroke"](state.path2D);
        break;
      case fill:
        ctx["fillStyle"] = paintStyle;
        ctx["fill"](state.path2D, state.fillRule);
        break;
    }

    if (state.gradientTransform !== null) {
      ctx["restore"]();
    }

    // Restore context state
    ctx["globalCompositeOperation"] = prevBlend;
    ctx["globalAlpha"] = prevAlpha;
  }

  const _pendingCanvasRenderers = new Set();

  const _hasOwn = Object.prototype.hasOwnProperty;

  function flushCanvasRenderers() {
    _offscreenRenderer.renderAtlas();
    // Now that the atlas is rendered, make the pending draws to canvases, some of which may
    // reference the atlas.
    for (const renderer of _pendingCanvasRenderers) {
      for (const lambda of renderer._drawList) {
        lambda();
      }
      renderer._drawList = [];
    }
    _pendingCanvasRenderers.clear();
    _offscreenRenderer.clearAtlas();
  }

  /**
   * A renderer exposed to consumers via .makeRenderer() that draws to a supplied canvas with
   * an implicitly created Canvas2D context. All context APIs exposed should go through this
   * CanvasRenderer, as this object is responsible for wrapping each Canvas2D API call to push
   * it onto a deferred draw list stack that will eventually resolve at the end
   * of a requestAnimationFrame loop
   */
  var CanvasRenderer = (Module.CanvasRenderer = Renderer.extend("Renderer", {
    "__construct": function (canvas) {
      this["__parent"]["__construct"].call(this);
      // Keep a local shadow of the matrix stack, since actual calls to the canvas2d context
      // are deferred, but we reed this matrix data at record time.
      this._matrixStack = [1, 0, 0, 1, 0, 0];
      // Opacity stack for modulateOpacity support
      this._opacityStack = [1.0];
      this._ctx = canvas["getContext"]("2d");
      this._canvas = canvas;
      this._drawList = [];
    },
    "save": function () {
      const i = this._matrixStack.length - 6;
      this._matrixStack.push(...this._matrixStack.slice(i));
      this._opacityStack.push(this._opacityStack[this._opacityStack.length - 1]);
      this._drawList.push(this._ctx["save"].bind(this._ctx));
    },
    "restore": function () {
      const i = this._matrixStack.length - 6;
      if (i < 6) {
        throw "restore() called without matching save().";
      }
      this._matrixStack.splice(i); // Pop off the top 6 floats from the matrix stack.
      this._opacityStack.pop();
      this._drawList.push(this._ctx["restore"].bind(this._ctx));
    },
    "transform": function (xx, xy, yx, yy, tx, ty) {
      const S = this._matrixStack;
      const i = S.length - 6;
      //            |S0  S2  S4|   |xx  yx  tx|
      // S.back() = |S1  S3  S5| * |xy  yy  ty|
      //            | 0   0   1|   | 0   0   1|
      S.splice(
        i,
        6,
        S[i + 0] * xx + S[i + 2] * xy,
        S[i + 1] * xx + S[i + 3] * xy,
        S[i + 0] * yx + S[i + 2] * yy,
        S[i + 1] * yx + S[i + 3] * yy,
        S[i + 0] * tx + S[i + 2] * ty + S[i + 4],
        S[i + 1] * tx + S[i + 3] * ty + S[i + 5]
      );
      this._drawList.push(
        this._ctx["transform"].bind(this._ctx, xx, xy, yx, yy, tx, ty)
      );
    },
    "rotate": function (angle) {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      this["transform"](cos, sin, -sin, cos, 0, 0);
    },
    "modulateOpacity": function (opacity) {
      this._opacityStack[this._opacityStack.length - 1] *= opacity;
    },
    "_drawPath": function (path, paint) {
      const opacity = Math.max(0, this._opacityStack[this._opacityStack.length - 1]);
      const mode = _drawMode(paint);
      if (mode === DRAW_MODE_DELEGATE) {
        this._delegateDrawPath(path, paint, opacity);
        return;
      }
      const state = _captureDrawState(path, paint, mode, opacity);
      if (state === null) {
        return;
      }
      this._drawList.push(() => {
        _paintPath(this._ctx, state);
        path._releasePath(state.path2D);
      });
    },
    _delegateDrawPath: function (path, paint, opacity) {
      const state = _captureWebGL2DrawState(path, paint);
      if (state === null) {
        return;
      }
      const matrix = this._matrixStack.slice(this._matrixStack.length - 6);
      const blit = _offscreenRenderer.appendDraw(
        this._ctx,
        this._ctx["canvas"]["width"],
        this._ctx["canvas"]["height"],
        matrix,
        paint._blend,
        opacity,
        (sx, sy, outBounds) => Module["webGL2PathPixelBounds"](
          state.path,
          state.paint,
          sx * matrix[0],
          sy * matrix[1],
          sx * matrix[2],
          sy * matrix[3],
          sx * matrix[4],
          sy * matrix[5],
          outBounds,
        ),
        (renderer) => renderer["drawPath"](state.path, state.paint),
        () => _releaseWebGL2DrawState(path, state),
        flushCanvasRenderers
      );
      // appendDraw() may have flushed, which empties the pending set.
      _pendingCanvasRenderers.add(this);
      this._drawList.push(blit);
    },
    "_drawRiveImage": function (image, blend, opacity) {
      var img = image._image;
      if (!img) {
        return;
      }
      var ctx = this._ctx;
      const canvasBlend = _canvasBlend(blend);
      const finalOpacity = Math.max(0, opacity * this._opacityStack[this._opacityStack.length - 1]);
      this._drawList.push(function () {
        ctx["globalCompositeOperation"] = canvasBlend;
        ctx["globalAlpha"] = finalOpacity;
        ctx["drawImage"](img, 0, 0);
        ctx["globalAlpha"] = 1;
      });
    },
    "_getMatrix": function (out) {
      const S = this._matrixStack;
      const i = S.length - 6;
      for (let j = 0; j < 6; ++j) {
        out[j] = S[i + j];
      }
    },
    // TODO(ben) add the instanced version once the C2D -> WebGL2 fallback change lands
    "_drawImageMesh": function (
      image,
      mesh,
      blend,
      opacity,
      meshMinX,
      meshMinY,
      meshMaxX,
      meshMaxY
    ) {
      const webGL2Image = image._webGL2Image;
      if (!webGL2Image) {
        // Still decoding. Skip it, as _drawRiveImage does, rather than draw a blank mesh.
        mesh["unref"]();
        return;
      }
      this._appendImageMesh(
        blend,
        opacity,
        meshMinX,
        meshMinY,
        meshMaxX,
        meshMaxY,
        (renderer) => Module["drawWebGL2PendingMesh"](renderer, mesh, webGL2Image),
        () => mesh["unref"]()
      );
    },
    "_drawImageMeshFromHeap": function (
      image,
      blend,
      opacity,
      vtxByteOffset, vtxCount,
      uvByteOffset, uvCount,
      indicesByteOffset, indicesCount,
      meshMinX,
      meshMinY,
      meshMaxX,
      meshMaxY
    ) {
      if (!image._meshTexture) {
        // Skip rendering if the image is still decoding or failed
        return;
      }
      // Copy the vertices/UVs/indices from the WASM heap into JS arrays.
      let vtxCopy, uvCopy, indicesCopy;
      try {
        vtxCopy = Module["HEAPF32"].slice(vtxByteOffset >> 2, (vtxByteOffset >> 2) + vtxCount);
        uvCopy = Module["HEAPF32"].slice(uvByteOffset >> 2, (uvByteOffset >> 2) + uvCount);
        indicesCopy = Module["HEAPU16"].slice(indicesByteOffset >> 1, (indicesByteOffset >> 1) + indicesCount);
      } catch (e) {
        console.error("[Rive] _drawImageMesh: failed to read mesh data from WASM heap. Mesh skipped for this frame.");
        return;
      }

      this._appendImageMesh(
        blend,
        opacity,
        meshMinX,
        meshMinY,
        meshMaxX,
        meshMaxY,
        { image: image, vtx: vtxCopy, uv: uvCopy, indices: indicesCopy },
        () => { }
      );
    },
    _appendImageMesh: function (
      blend,
      opacity,
      meshMinX,
      meshMinY,
      meshMaxX,
      meshMaxY,
      contents,
      releaseContents
    ) {
      const blit = _offscreenRenderer.appendDraw(
        this._ctx,
        this._ctx["canvas"]["width"],
        this._ctx["canvas"]["height"],
        this._matrixStack.slice(this._matrixStack.length - 6),
        _canvasBlend(blend),
        Math.max(0, opacity * this._opacityStack[this._opacityStack.length - 1]),
        // A mesh has no outset to resize, so its bounds just scale.
        (sx, sy, outBounds) => {
          outBounds[0] = Math.floor(meshMinX * sx);
          outBounds[1] = Math.floor(meshMinY * sy);
          outBounds[2] = Math.ceil(meshMaxX * sx);
          outBounds[3] = Math.ceil(meshMaxY * sy);
        },
        contents,
        releaseContents,
        flushCanvasRenderers
      );
      // appendDraw() may have flushed, which empties the pending set.
      _pendingCanvasRenderers.add(this);
      this._drawList.push(blit);
    },

    "_clipPath": function (path) {
      const fillRule = path._fillRule === evenOdd ? "evenodd" : "nonzero";
      const path2D = path._acquirePath(null);
      this._drawList.push(() => {
        this._ctx["clip"](path2D, fillRule)
        path._releasePath(path2D);
      }
      );
    },
    // Begins a frame. Pass clear=false to draw on top of whatever the canvas
    // already holds.
    "beginFrame": function (clear = true) {
      // Add ourselves to the list of deferred canvases. This works here because
      // beginFrame always gets called first.
      _pendingCanvasRenderers.add(this);
      if (!clear) {
        return;
      }
      this._drawList.push(
        this._ctx["clearRect"].bind(
          this._ctx,
          0,
          0,
          this._canvas["width"],
          this._canvas["height"]
        )
      );
    },
    // Deprecated alias for beginFrame(); kept because it is part of the
    // documented public API.
    "clear": function () {
      this["beginFrame"](true);
    },
    "flush": function () { },
    "translate": function (x, y) {
      this.transform(1, 0, 0, 1, x, y);
    },
  }));

  Module["makeRenderer"] = function (canvas, _useOffscreenRenderer) {
    const newCanvasRenderer = new CanvasRenderer(canvas);
    const c2dSource = newCanvasRenderer._ctx;
    // Set by attachSession, which is how deferred mode arrives for every
    // backend. While set, the app records into the file's session and flush
    // replays the stream through the real CanvasRenderer, whose draw list
    // paints at the end of the frame as usual.
    let _session = null;
    let _recorder = null;
    const _deferredApi = {
      "attachSession": function (session) {
        // Re-attaching what we already hold changes nothing, and taking the
        // claim a second time would fail.
        if (session && _session === session) {
          return true;
        }
        // A session records for one canvas and can never rebind once
        // detached, so refuse rather than share; the caller re-imports.
        if (
          !session ||
          _session ||
          typeof Module["c2dDeferredClaim"] !== "function" ||
          typeof Module["c2dDeferredRenderer"] !== "function"
        ) {
          return false;
        }
        // Native owns the once per session claim, so a session spent against
        // another renderer is refused here too. Taken before anything is
        // touched: a refusal has to leave this renderer in immediate mode.
        if (!Module["c2dDeferredClaim"](session)) {
          return false;
        }
        const recorder = Module["c2dDeferredRenderer"](session);
        if (!recorder) {
          return false;
        }
        _session = session;
        _recorder = recorder;
        return true;
      },
      "detachSession": function () {
        // The session outlives this renderer, so its replay state has to drop
        // while we still have a reference to hand the native side.
        if (_session) {
          Module["c2dDeferredDetach"](_session);
        }
        _session = null;
        _recorder = null;
      },
      "deferredActive": function () {
        return _recorder !== null;
      },
    };
    // The Renderer JS class only materializes methods on JS subclasses, so
    // recording goes through these free functions rather than bound member
    // calls on the recorder.
    const _recordingApi = {
      "save": function () {
        Module["c2dDeferredSave"](_session);
      },
      "restore": function () {
        Module["c2dDeferredRestore"](_session);
      },
      "transform": function (xx, xy, yx, yy, tx, ty) {
        Module["c2dDeferredTransform"](_session, xx, xy, yx, yy, tx, ty);
      },
      "translate": function (x, y) {
        Module["c2dDeferredTransform"](_session, 1, 0, 0, 1, x, y);
      },
      // CanvasRenderer.rotate() reaches transform() through `this`, which the
      // proxy binds to the canvas renderer, not to this table.
      "rotate": function (angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        Module["c2dDeferredTransform"](_session, cos, sin, -sin, cos, 0, 0);
      },
      "align": function (fit, alignment, frame, content, scaleFactor) {
        Module["c2dDeferredAlign"](
          _session,
          fit,
          alignment,
          frame["minX"],
          frame["minY"],
          frame["maxX"],
          frame["maxY"],
          content["minX"],
          content["minY"],
          content["maxX"],
          content["maxY"],
          scaleFactor === undefined ? 1 : scaleFactor
        );
      },
      // clear() is a deprecated alias for beginFrame(); both must open the
      // session's recording window.
      "beginFrame": function (clear = true) {
        newCanvasRenderer["beginFrame"](clear);
        Module["c2dDeferredBeginFrame"](_session);
      },
      "clear": function () {
        newCanvasRenderer["beginFrame"](true);
        Module["c2dDeferredBeginFrame"](_session);
      },
      "flush": function () {
        Module["c2dDeferredReplay"](_session, newCanvasRenderer);
      },
    };
    return new Proxy(newCanvasRenderer, {
      get(target, property) {
        if (_hasOwn.call(_deferredApi, property)) {
          return _deferredApi[property];
        }
        // Native draws have to reach the session's recorder; the canvas
        // renderer stays the replay target. Read by the Artboard draw patch.
        if (property === "_deferredRecorder") {
          return _recorder;
        }
        if (_recorder !== null && _hasOwn.call(_recordingApi, property)) {
          return _recordingApi[property];
        }
        if (typeof target[property] === "function") {
          return function (...args) {
            return target[property].apply(target, args);
          };
        } else if (typeof c2dSource[property] === "function") {
          if (c2dMethodBlockList.indexOf(property) > -1) {
            throw new Error(
              "RiveException: Method call to '" +
              property +
              "()' is not allowed, as the renderer cannot immediately pass through the return \
                values of any canvas 2d context methods."
            );
          } else {
            return function (...args) {
              newCanvasRenderer._drawList.push(
                c2dSource[property].bind(c2dSource, ...args)
              );
            };
          }
        }
        return target[property];
      },
      set(target, property, value) {
        if (property in c2dSource) {
          newCanvasRenderer._drawList.push(() => {
            c2dSource[property] = value;
          });
          return true;
        }
      },
    });
  };

  // Canvas2D images decode in JS, so there is no session variant to route to;
  // the argument exists to keep one decode signature across backends.
  Module["decodeImage"] = function (bytes, onComplete, _session = null) {
    let renderImage = new CanvasRenderImage({ onComplete });
    renderImage.decode(bytes);
  };

  Module["renderFactory"] = {
    makeRenderPaint: function () {
      return new CanvasRenderPaint();
    },
    makeRenderPath: function () {
      return new CanvasRenderPath();
    },
    makeRenderImage: function () {
      let context = loadContext;
      return new CanvasRenderImage({
        onDecode: () => {
          context.total++;
        },
        onComplete: () => {
          context.loaded++;
          if (context.loaded === context.total) {
            const ready = context.ready;
            if (ready) {
              ready();
              context.ready = null;
            }
          }
        },
      });
    },
  };

  let load = Module["load"];
  let loadContext = null;
  // The session fixes the file's mode at import: every resource it creates is
  // typed by the factory it came from, so out of band assets have to decode
  // through the same session (the CDN loader carries it for that reason).
  Module["load"] = function (
    bytes,
    fileAssetLoader,
    enableRiveAssetCDN = true,
    session = null
  ) {
    const loader = new Module["FallbackFileAssetLoader"]();
    if (fileAssetLoader !== undefined) {
      loader.addLoader(fileAssetLoader);
    }
    if (enableRiveAssetCDN) {
      const cdnLoader = new Module["CDNFileAssetLoader"](session);
      loader.addLoader(cdnLoader);
    }
    return new Promise(function (resolve, reject) {
      let result = null;
      loadContext = {
        total: 0,
        loaded: 0,
        ready: function () {
          resolve(result);
        },
      };
      result = load(bytes, loader, session ?? null);
      // Script modules compile while the assets load; the prepare that
      // startFileScripts awaits joins this one.
      const scripting = Module["riveScripting"];
      if (scripting) {
        scripting["prepare"]();
      }
      if (loadContext.total == 0) {
        resolve(result);
      }
    }).then(Module["startFileScripts"]);
  };

  const wasmDraw = Module["Artboard"]["prototype"]["draw"];
  Module["Artboard"]["prototype"]["draw"] = function (renderer) {
    // While a session is attached the artboard draws into its recorder, not
    // into the canvas renderer that replays it at flush.
    wasmDraw.call(this, renderer["_deferredRecorder"] || renderer);
  };

  let align = Module["RendererWrapper"]["prototype"]["align"];
  Module["RendererWrapper"]["prototype"]["align"] = function (
    fit,
    alignment,
    frame,
    content,
    scaleFactor = 1.0
  ) {
    align.call(this, fit, alignment, frame, content, scaleFactor);
  };

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
  Module["disableFPSCounter"] = _animationCallbackHandler.disableFPSCounter;
  _animationCallbackHandler.onAfterCallbacks = flushCanvasRenderers;

  Module["resolveAnimationFrame"] = flushCanvasRenderers;

  Module["cleanup"] = function () {
    _offscreenRenderer.cleanup();
  };
};
