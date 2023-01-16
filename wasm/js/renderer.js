function makeMatrix(m2d) {
  const m = new DOMMatrix();
  m.a = m2d["xx"];
  m.b = m2d["xy"];
  m.c = m2d["yx"];
  m.d = m2d["yy"];
  m.e = m2d["tx"];
  m.f = m2d["ty"];
  return m;
}

const VTX_ARRAY = 0;
const UV_ARRAY = 1;

// Used for rendering meshes.
const offscreenWebGL = new (function () {
  let _gl = null;
  let _webglVersion = 0;
  let _maxRTSize = 0;
  let _matUniform = null;
  let _translateUniform = null;
  let _vertexBufferLength = 0;
  let _indexBufferLength = 0;

  const initGL = function () {
    if (!_gl) {
      const canvas = document.createElement("canvas");
      const contextAttribs = {
        "alpha": 1,
        "depth": 0,
        "stencil": 0,
        "antialias": 0,
        "premultipliedAlpha": 1,
        "preserveDrawingBuffer": 0,
        "preferLowPowerToHighPerformance": 0,
        "failIfMajorPerformanceCaveat": 0,
        "enableExtensionsByDefault": 1,
        "explicitSwapControl": 1,
        "renderViaOffscreenBackBuffer": 1,
      };
      // Prefer webgl2 so we can use mipmaps on now-power-2 mesh textures.
      let gl = canvas.getContext("webgl2", contextAttribs);
      if (gl) {
        _webglVersion = 2;
      } else {
        gl = canvas.getContext("webgl", contextAttribs);
        if (gl) {
          _webglVersion = 1;
        } else {
          console.log("No WebGL support. Image mesh will not be drawn.");
          return false;
        }
      }

      _maxRTSize = Math.min(
        gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        gl.getParameter(gl.MAX_TEXTURE_SIZE)
      );

      function compileAndAttachShader(program, shaderType, sourceCode) {
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);
        const log = gl.getShaderInfoLog(shader);
        if (log.length > 0) {
          throw log;
        }
        gl.attachShader(program, shader);
      }
      const program = gl.createProgram();
      compileAndAttachShader(
        program,
        gl.VERTEX_SHADER,
        `attribute vec2 vertex;
                attribute vec2 uv;
                uniform vec4 mat;
                uniform vec2 translate;
                varying vec2 st;
                void main() {
                    st = uv;
                    gl_Position = vec4(mat2(mat) * vertex + translate, 0, 1);
                }`
      );
      compileAndAttachShader(
        program,
        gl.FRAGMENT_SHADER,
        `precision highp float;
                uniform sampler2D image;
                varying vec2 st;
                void main() {
                    gl_FragColor = texture2D(image, st);
                }`
      );
      gl.bindAttribLocation(program, VTX_ARRAY, "vertex");
      gl.bindAttribLocation(program, UV_ARRAY, "uv");
      gl.linkProgram(program);
      const log = gl.getProgramInfoLog(program);
      if (log.trim().length > 0) {
        throw log;
      }
      _matUniform = gl.getUniformLocation(program, "mat");
      _translateUniform = gl.getUniformLocation(program, "translate");
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.enableVertexAttribArray(VTX_ARRAY);
      gl.enableVertexAttribArray(UV_ARRAY);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

      gl.uniform1i(gl.getUniformLocation(program, "image"), 0);

      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

      _gl = gl;
    }
    return true;
  };

  this.maxRTSize = function () {
    initGL();
    return _maxRTSize;
  };

  this.createImageTexture = function (image) {
    if (!initGL()) {
      return null;
    }
    const texture = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, texture);
    _gl.texImage2D(
      _gl.TEXTURE_2D,
      0,
      _gl.RGBA,
      _gl.RGBA,
      _gl.UNSIGNED_BYTE,
      image
    );
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
    if (_webglVersion == 2) {
      _gl.texParameteri(
        _gl.TEXTURE_2D,
        _gl.TEXTURE_MIN_FILTER,
        _gl.LINEAR_MIPMAP_LINEAR
      );
      _gl.generateMipmap(_gl.TEXTURE_2D);
    } else {
      _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
    }
    return texture;
  };

  const _maxRecentAtlasWidth = new MaxRecentSize(
    1000 /*ms*/,
    8 /*aligned to multiples of 256*/
  );
  const _maxRecentAtlasHeight = new MaxRecentSize(
    1000 /*ms*/,
    8 /*aligned to multiples of 256*/
  );
  const _maxRecentVertexLength = new MaxRecentSize(
    1000 /*ms*/,
    10 /*aligned to multiples of 1024*/
  );
  const _maxRecentIndexLength = new MaxRecentSize(
    1000 /*ms*/,
    10 /*aligned to multiples of 1024*/
  );

  this.drawMeshAtlas = function (
    atlasWidth,
    atlasHeight,
    meshes,
    numTotalVertexFloats,
    numTotalIndices
  ) {
    if (!initGL()) {
      return;
    }

    const canvasWidth = _maxRecentAtlasWidth.push(atlasWidth);
    const canvasHeight = _maxRecentAtlasHeight.push(atlasHeight);
    if (_gl.canvas.width != canvasWidth || _gl.canvas.height != canvasHeight) {
      _gl.canvas.width = canvasWidth;
      _gl.canvas.height = canvasHeight;
    }
    _gl.viewport(0, canvasHeight - atlasHeight, atlasWidth, atlasHeight);
    _gl.disable(_gl.SCISSOR_TEST);
    _gl.clearColor(0, 0, 0, 0);
    _gl.clear(_gl.COLOR_BUFFER_BIT);
    _gl.enable(_gl.SCISSOR_TEST);

    // Sort the meshes into a draw order that minimizes the cost of GL state changes.
    meshes.sort((a, b) => b.sortKey - a.sortKey);

    const SIZE_OF_FLOAT = 4;
    const SIZE_OF_U16 = 2;

    // Upload all vertices.
    const vertexBufferLength =
      _maxRecentVertexLength.push(numTotalVertexFloats);
    if (_vertexBufferLength != vertexBufferLength) {
      _gl.bufferData(
        _gl.ARRAY_BUFFER,
        vertexBufferLength * 2 /*count uv as well*/ * SIZE_OF_FLOAT,
        _gl.DYNAMIC_DRAW
      );
      _vertexBufferLength = vertexBufferLength;
    }
    let vOffset = 0;
    for (const m of meshes) {
      _gl.bufferSubData(_gl.ARRAY_BUFFER, vOffset, m.vtx);
      vOffset += m.vtx.length * SIZE_OF_FLOAT;
    }
    console.assert(vOffset == numTotalVertexFloats * SIZE_OF_FLOAT);

    // Upload all uv.
    for (const m of meshes) {
      _gl.bufferSubData(_gl.ARRAY_BUFFER, vOffset, m.uv);
      vOffset += m.uv.length * SIZE_OF_FLOAT;
    }
    console.assert(
      vOffset == numTotalVertexFloats * 2 /*count uv as well*/ * SIZE_OF_FLOAT
    );

    // Upload all indices.
    const indexBufferLength = _maxRecentIndexLength.push(numTotalIndices);
    if (_indexBufferLength != indexBufferLength) {
      _gl.bufferData(
        _gl.ELEMENT_ARRAY_BUFFER,
        indexBufferLength * SIZE_OF_U16,
        _gl.DYNAMIC_DRAW
      );
      _indexBufferLength = indexBufferLength;
    }
    let iOffset = 0;
    for (const m of meshes) {
      _gl.bufferSubData(_gl.ELEMENT_ARRAY_BUFFER, iOffset, m.indices);
      iOffset += m.indices.length * SIZE_OF_U16;
    }
    console.assert(iOffset == numTotalIndices * SIZE_OF_U16);

    // Draw all meshes.
    let boundTextureID = 0;
    let hasScissor = true;
    vOffset = iOffset = 0;
    for (const m of meshes) {
      if (m.image._uniqueID != boundTextureID) {
        _gl.bindTexture(_gl.TEXTURE_2D, m.image._texture || null);
        boundTextureID = m.image._uniqueID;
      }

      if (m.needsScissor) {
        _gl.scissor(
          m.atlasX,
          canvasHeight - m.atlasY - m.heightInAtlas,
          m.widthInAtlas,
          m.heightInAtlas
        );
        hasScissor = true;
      } else if (hasScissor) {
        _gl.scissor(0, canvasHeight - atlasHeight, atlasWidth, atlasHeight);
        hasScissor = false;
      }

      // Draw the top-left corner of the mesh at location (atlasX, atlasY) in the WebGL
      // canvas, scaled by (scaleX, scaleY).
      // Post-transform the canvas2d's matrix into normalized OpenGL clip space (-1..1).
      const iw = 2 / atlasWidth;
      const ih = -2 / atlasHeight;
      _gl.uniform4f(
        _matUniform,
        m.mat[0] * iw * m.scaleX,
        m.mat[1] * ih * m.scaleY,
        m.mat[2] * iw * m.scaleX,
        m.mat[3] * ih * m.scaleY
      );
      _gl.uniform2f(
        _translateUniform,
        m.mat[4] * iw * m.scaleX + iw * (m.atlasX - m.meshX * m.scaleX) - 1,
        m.mat[5] * ih * m.scaleY + ih * (m.atlasY - m.meshY * m.scaleY) + 1
      );

      _gl.vertexAttribPointer(VTX_ARRAY, 2, _gl.FLOAT, false, 0, vOffset);
      _gl.vertexAttribPointer(
        UV_ARRAY,
        2,
        _gl.FLOAT,
        false,
        0,
        vOffset + numTotalVertexFloats * SIZE_OF_FLOAT
      );
      _gl.drawElements(
        _gl.TRIANGLES,
        m.indices.length,
        _gl.UNSIGNED_SHORT,
        iOffset
      );

      vOffset += m.vtx.length * SIZE_OF_FLOAT;
      iOffset += m.indices.length * SIZE_OF_U16;
    }
    console.assert(vOffset == numTotalVertexFloats * SIZE_OF_FLOAT);
    console.assert(iOffset == numTotalIndices * SIZE_OF_U16);
  };

  this.canvas = function () {
    return initGL() && _gl.canvas;
  };
})();

Rive.onRuntimeInitialized = function () {
  const RenderPaintStyle = Rive.RenderPaintStyle;
  const FillRule = Rive.FillRule;
  const RenderPath = Rive.RenderPath;
  const RenderImage = Rive.RenderImage;
  const RenderPaint = Rive.RenderPaint;
  const Renderer = Rive.Renderer;
  const StrokeCap = Rive.StrokeCap;
  const StrokeJoin = Rive.StrokeJoin;
  const BlendMode = Rive.BlendMode;

  const fill = RenderPaintStyle.fill;
  const stroke = RenderPaintStyle.stroke;

  const evenOdd = FillRule.evenOdd;
  const nonZero = FillRule.nonZero;

  let _nextImageUniqueID = 1;
  var CanvasRenderImage = RenderImage.extend("CanvasRenderImage", {
    "__construct": function () {
      this["__parent"]["__construct"].call(this);
      this._uniqueID = _nextImageUniqueID;
      _nextImageUniqueID = (_nextImageUniqueID + 1) & 0x7fffffff || 1;
    },
    "decode": function (bytes) {
      let context = loadContext;
      context.total++;
      var cri = this;
      var image = new Image();
      image.src = URL.createObjectURL(
        new Blob([bytes], {
          type: "image/png",
        })
      );
      image.onload = function () {
        cri._image = image;
        cri._texture = offscreenWebGL.createImageTexture(image);
        cri["size"](image.width, image.height);

        context.loaded++;
        if (context.loaded === context.total) {
          const ready = context.ready;
          if (ready) {
            ready();
            context.ready = null;
          }
        }
      };
    },
  });

  function _canvasBlend(value) {
    switch (value) {
      case BlendMode.srcOver:
        return "source-over";
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
  var CanvasRenderPath = RenderPath.extend("CanvasRenderPath", {
    "__construct": function () {
      this["__parent"]["__construct"].call(this);
      this._path2D = new Path2D();
    },
    "reset": function () {
      this._path2D = new Path2D();
    },
    "addPath": function (path, m2d) {
      this._path2D["addPath"](path._path2D, makeMatrix(m2d));
    },
    "fillRule": function (fillRule) {
      this._fillRule = fillRule;
    },
    "moveTo": function (x, y) {
      this._path2D["moveTo"](x, y);
    },
    "lineTo": function (x, y) {
      this._path2D["lineTo"](x, y);
    },
    "cubicTo": function (ox, oy, ix, iy, x, y) {
      this._path2D["bezierCurveTo"](ox, oy, ix, iy, x, y);
    },
    "close": function () {
      this._path2D["closePath"]();
    },
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
  var CanvasRenderPaint = RenderPaint.extend("CanvasRenderPaint", {
    "color": function (value) {
      this._value = _colorStyle(value);
    },
    "thickness": function (value) {
      this._thickness = value;
    },
    "join": function (value) {
      switch (value) {
        case StrokeJoin.miter:
          this._join = "miter";
          break;
        case StrokeJoin.round:
          this._join = "round";
          break;
        case StrokeJoin.bevel:
          this._join = "bevel";
          break;
      }
    },
    "cap": function (value) {
      switch (value) {
        case StrokeCap.butt:
          this._cap = "butt";
          break;
        case StrokeCap.round:
          this._cap = "round";
          break;
        case StrokeCap.square:
          this._cap = "square";
          break;
      }
    },
    "style": function (value) {
      this._style = value;
    },
    "blendMode": function (value) {
      this._blend = _canvasBlend(value);
    },
    "linearGradient": function (sx, sy, ex, ey) {
      this._gradient = {
        sx,
        sy,
        ex,
        ey,
        stops: [],
      };
    },
    "radialGradient": function (sx, sy, ex, ey) {
      this._gradient = {
        sx,
        sy,
        ex,
        ey,
        stops: [],
        isRadial: true,
      };
    },
    "addStop": function (color, stop) {
      this._gradient.stops.push({
        color,
        stop,
      });
    },

    "completeGradient": function () {},
    // https://github.com/rive-app/rive/issues/3816: The fill rule (and only the fill rule) on a
    // path object can mutate before flush(). To work around this, we capture the fill rule at
    // draw time. It's a little awkward having a fill rule here even though we might be a
    // stroke, so we probably want to rework this.
    "draw": function (ctx, path2D, fillRule) {
      let _style = this._style;
      let _value = this._value;
      let _gradient = this._gradient;
      let _blend = this._blend;

      ctx["globalCompositeOperation"] = _blend;

      if (_gradient != null) {
        const sx = _gradient.sx;
        const sy = _gradient.sy;
        const ex = _gradient.ex;
        const ey = _gradient.ey;
        const stops = _gradient.stops;

        if (_gradient.isRadial) {
          var dx = ex - sx;
          var dy = ey - sy;
          var radius = Math.sqrt(dx * dx + dy * dy);
          _value = ctx["createRadialGradient"](sx, sy, 0, sx, sy, radius);
        } else {
          _value = ctx["createLinearGradient"](sx, sy, ex, ey);
        }

        for (let i = 0, l = stops["length"]; i < l; i++) {
          const value = stops[i];
          const stop = value.stop;
          const color = value.color;
          _value["addColorStop"](stop, _colorStyle(color));
        }
        this._value = _value;
        this._gradient = null;
      }
      switch (_style) {
        case stroke:
          ctx["strokeStyle"] = _value;
          ctx["lineWidth"] = this._thickness;
          ctx["lineCap"] = this._cap;
          ctx["lineJoin"] = this._join;
          ctx["stroke"](path2D);
          break;
        case fill:
          ctx["fillStyle"] = _value;
          ctx["fill"](path2D, fillRule);
          break;
      }
    },
  });

  const _pendingCanvasRenderers = new Set();
  const INITIAL_ATLAS_SIZE = 512;
  let _rectanizer = null;
  let _atlasMeshList = [];
  let _atlasNumTotalVertexFloats = 0;
  let _atlasNumTotalIndices = 0;

  function flushCanvasRenderers() {
    // Draw the mesh atlas before flushing the queued up draws to canvases.
    if (_atlasMeshList.length > 0) {
      offscreenWebGL.drawMeshAtlas(
        _rectanizer["drawWidth"](),
        _rectanizer["drawHeight"](),
        _atlasMeshList,
        _atlasNumTotalVertexFloats,
        _atlasNumTotalIndices
      );
      _atlasMeshList = [];
      _atlasNumTotalVertexFloats = 0;
      _atlasNumTotalIndices = 0;
      _rectanizer["reset"](INITIAL_ATLAS_SIZE, INITIAL_ATLAS_SIZE);
    }
    // Now that the atlas is rendered, make the pending draws to canvases, some of which may
    // reference the atlas.
    for (const renderer of _pendingCanvasRenderers) {
      for (const lambda of renderer._drawList) {
        lambda();
      }
      renderer._drawList = [];
    }
    _pendingCanvasRenderers.clear();
  }

  var CanvasRenderer = (Rive.CanvasRenderer = Renderer.extend("Renderer", {
    "__construct": function (canvas) {
      this["__parent"]["__construct"].call(this);
      // Keep a local shadow of the matrix stack, since actual calls to the canvas2d context
      // are deferred, but we reed this matrix data at record time.
      this._matrixStack = [1, 0, 0, 1, 0, 0];
      this._ctx = canvas["getContext"]("2d");
      this._canvas = canvas;
      this._drawList = [];
    },
    "save": function () {
      const i = this._matrixStack.length - 6;
      this._matrixStack.push(...this._matrixStack.slice(i));
      this._drawList.push(this._ctx["save"].bind(this._ctx));
    },
    "restore": function () {
      const i = this._matrixStack.length - 6;
      if (i < 6) {
        throw "restore() called without matching save().";
      }
      this._matrixStack.splice(i); // Pop off the top 6 floats from the matrix stack.
      this._drawList.push(this._ctx["restore"].bind(this._ctx));
    },
    "transform": function (m) {
      const S = this._matrixStack;
      const i = S.length - 6;
      //            |S0  S2  S4|   |m.xx  m.yx  m.tx|
      // S.back() = |S1  S3  S5| * |m.xy  m.yy  m.ty|
      //            | 0   0   1|   |   0     0     1|
      S.splice(
        i,
        6,
        S[i + 0] * m["xx"] + S[i + 2] * m["xy"],
        S[i + 1] * m["xx"] + S[i + 3] * m["xy"],
        S[i + 0] * m["yx"] + S[i + 2] * m["yy"],
        S[i + 1] * m["yx"] + S[i + 3] * m["yy"],
        S[i + 0] * m["tx"] + S[i + 2] * m["ty"] + S[i + 4],
        S[i + 1] * m["tx"] + S[i + 3] * m["ty"] + S[i + 5]
      );
      this._drawList.push(
        this._ctx["transform"].bind(
          this._ctx,
          m["xx"],
          m["xy"],
          m["yx"],
          m["yy"],
          m["tx"],
          m["ty"]
        )
      );
    },
    "rotate": function (angle) {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      this.transform({
        "xx": cos,
        "xy": sin,
        "yx": -sin,
        "yy": cos,
        "tx": 0,
        "ty": 0,
      });
    },
    "_drawPath": function (path, paint) {
      const fillRule = path._fillRule === evenOdd ? "evenodd" : "nonzero";
      this._drawList.push(
        paint["draw"].bind(paint, this._ctx, path._path2D, fillRule)
      );
    },
    "_drawImage": function (image, blend, opacity) {
      var img = image._image;
      if (!img) {
        return;
      }
      var ctx = this._ctx;
      const canvasBlend = _canvasBlend(blend);
      this._drawList.push(function () {
        ctx["globalCompositeOperation"] = canvasBlend;
        ctx["globalAlpha"] = opacity;
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
    "_drawImageMesh": function (
      image,
      blend,
      opacity,
      vtx,
      uv,
      indices,
      meshMinX,
      meshMinY,
      meshMaxX,
      meshMaxY
    ) {
      const canvasWidth = this._ctx["canvas"]["width"];
      const canvasHeight = this._ctx["canvas"]["height"];
      const meshWidth = meshMaxX - meshMinX;
      const meshHeight = meshMaxY - meshMinY;

      // Clip the mesh's bounding box to its canvas.
      meshMinX = Math.max(meshMinX, 0);
      meshMinY = Math.max(meshMinY, 0);
      meshMaxX = Math.min(meshMaxX, canvasWidth);
      meshMaxY = Math.min(meshMaxY, canvasHeight);
      const meshClippedWidth = meshMaxX - meshMinX;
      const meshClippedHeight = meshMaxY - meshMinY;
      console.assert(meshClippedWidth <= Math.min(meshWidth, canvasWidth));
      console.assert(meshClippedHeight <= Math.min(meshHeight, canvasHeight));
      // Bail if the bounding box was out of view.
      if (meshClippedWidth <= 0 || meshClippedHeight <= 0) {
        return;
      }
      const needsScissor =
        meshClippedWidth < meshWidth || meshClippedHeight < meshHeight;

      // TODO: downscale the mesh in the atlas when it is larger than the underlying texture.
      let scaleX = 1;
      let scaleY = 1;
      let widthInAtlas = Math.ceil(meshClippedWidth * scaleX);
      let heightInAtlas = Math.ceil(meshClippedHeight * scaleY);

      // Don't draw larger than the max render target size.
      const maxRTSize = offscreenWebGL.maxRTSize();
      if (widthInAtlas > maxRTSize) {
        scaleX *= maxRTSize / widthInAtlas;
        widthInAtlas = maxRTSize;
      }
      if (heightInAtlas > maxRTSize) {
        scaleY *= maxRTSize / heightInAtlas;
        heightInAtlas = maxRTSize;
      }

      // Find a slot for our mesh in the atlas.
      if (!_rectanizer) {
        _rectanizer = new Module["DynamicRectanizer"](maxRTSize);
        _rectanizer["reset"](INITIAL_ATLAS_SIZE, INITIAL_ATLAS_SIZE);
      }
      let pos = _rectanizer["addRect"](widthInAtlas, heightInAtlas);
      if (pos < 0) {
        // The atlas ran out of room. Flush and try again.
        flushCanvasRenderers();
        _pendingCanvasRenderers.add(this);
        pos = _rectanizer["addRect"](widthInAtlas, heightInAtlas);
        // The atlas should always be big enough to fit at least one canvas.
        console.assert(pos >= 0);
      }
      const atlasX = pos & 0xffff;
      const atlasY = pos >> 16;

      _atlasMeshList.push({
        mat: this._matrixStack.slice(this._matrixStack.length - 6),
        image: image,
        atlasX: atlasX,
        atlasY: atlasY,
        meshX: meshMinX,
        meshY: meshMinY,
        widthInAtlas: widthInAtlas,
        heightInAtlas: heightInAtlas,
        scaleX: scaleX,
        scaleY: scaleY,
        vtx: new Float32Array(vtx),
        uv: new Float32Array(uv),
        indices: new Uint16Array(indices),
        needsScissor: needsScissor,
        // Create a sortKey with more expensive state in higher order bits.
        // This will produce an ordering that minimizes the cost of GL
        // state changes.
        sortKey: (image._uniqueID << 1) | (needsScissor ? 1 : 0),
      });
      _atlasNumTotalVertexFloats += vtx.length;
      _atlasNumTotalIndices += indices.length;

      const ctx = this._ctx;
      const canvasBlend = _canvasBlend(blend);
      this._drawList.push(function () {
        ctx["save"]();
        ctx["resetTransform"]();
        ctx["globalCompositeOperation"] = canvasBlend;
        ctx["globalAlpha"] = opacity;
        ctx["drawImage"](
          offscreenWebGL.canvas(),
          atlasX,
          atlasY,
          widthInAtlas,
          heightInAtlas,
          meshMinX,
          meshMinY,
          meshClippedWidth,
          meshClippedHeight
        );
        ctx["restore"]();
      });
    },
    "_clipPath": function (path) {
      const fillRule = path._fillRule === evenOdd ? "evenodd" : "nonzero";
      this._drawList.push(
        this._ctx["clip"].bind(this._ctx, path._path2D, fillRule)
      );
    },
    "clear": function () {
      // Add ourselves to the list of deferred canvases. This works here because clear aways
      // gets called first.
      _pendingCanvasRenderers.add(this);
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
    "flush": function () {},
    "translate": function (x, y) {
      this.transform({
        "xx": 1,
        "xy": 0,
        "yx": 0,
        "yy": 1,
        "tx": x,
        "ty": y,
      });
    },
  }));

  Rive.makeRenderer = function (canvas) {
    return new CanvasRenderer(canvas);
  };

  Rive.renderFactory = {
    makeRenderPaint: function () {
      return new CanvasRenderPaint();
    },
    makeRenderPath: function () {
      return new CanvasRenderPath();
    },
    makeRenderImage: function () {
      return new CanvasRenderImage();
    },
  };

  let load = Rive["load"];
  let loadContext = null;
  Rive["load"] = function (bytes) {
    return new Promise(function (resolve, reject) {
      let result = null;
      loadContext = {
        total: 0,
        loaded: 0,
        ready: function () {
          resolve(result);
        },
      };
      result = load(bytes);
      if (loadContext.total == 0) {
        resolve(result);
      }
    });
  };

  const _animationCallbackHandler = new AnimationCallbackHandler();
  Rive["requestAnimationFrame"] =
    _animationCallbackHandler.requestAnimationFrame.bind(
      _animationCallbackHandler
    );
  Rive["cancelAnimationFrame"] =
    _animationCallbackHandler.cancelAnimationFrame.bind(
      _animationCallbackHandler
    );
  Rive["enableFPSCounter"] = _animationCallbackHandler.enableFPSCounter.bind(
    _animationCallbackHandler
  );
  Rive["disableFPSCounter"] = _animationCallbackHandler.disableFPSCounter;
  _animationCallbackHandler.onAfterCallbacks = flushCanvasRenderers;

  Rive["cleanup"] = function () {
    if (_rectanizer) {
      _rectanizer.delete();
    }
  };
};
