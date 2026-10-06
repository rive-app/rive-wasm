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
  let _hasLoggedContextLostError = false;

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
        "powerPreference": "high-performance",
        "failIfMajorPerformanceCaveat": 0,
        "enableExtensionsByDefault": 1,
        "explicitSwapControl": 1,
        "renderViaOffscreenBackBuffer": 1,
      };
      const _isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      let gl;
      // Check for iOS as we've encountered context lost and crash issues
      // with WebGL2 contexts and iOS Safari (16 and 17)
      if (_isiOS) {
        gl = canvas.getContext("webgl", contextAttribs);
        _webglVersion = 1;
        if (!gl) {
          console.log("No WebGL support. Image mesh will not be drawn.");
          return false;
        }
      } else {
        // Prefer webgl2 so we can use mipmaps on now-power-2 mesh textures.
        gl = canvas.getContext("webgl2", contextAttribs);
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
      }

      gl = new Proxy(gl, {
        get(target, property) {
          if (target.isContextLost()) {
            // rAf may still take place, so just want to prevent logging constantly
            if (!_hasLoggedContextLostError) {
              console.error(
                "Cannot render the mesh because the GL Context was lost. Tried to invoke ",
                property
              );
              _hasLoggedContextLostError = true;
            }
            if (typeof target[property] === "function") {
              return function () { };
            }
            return;
          } else {
            if (typeof target[property] === "function") {
              return function (...args) {
                return target[property].apply(target, args);
              };
            }
            return target[property];
          }
        },
        set(target, property, value) {
          if (target.isContextLost()) {
            // rAf may still take place, so just want to prevent logging constantly
            if (!_hasLoggedContextLostError) {
              console.error(
                "Cannot render the mesh because the GL Context was lost. Tried to set property " +
                property
              );
              _hasLoggedContextLostError = true;
            }
            return;
          } else {
            target[property] = value;
            return true;
          }
        },
      });

      _maxRTSize = Math.min(
        gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        gl.getParameter(gl.MAX_TEXTURE_SIZE)
      );

      function compileAndAttachShader(program, shaderType, sourceCode) {
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);
        const log = gl.getShaderInfoLog(shader);
        if ((log || "").length > 0) {
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
      if ((log || "").trim().length > 0) {
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
  // TODO: Might mask the issue of GL context lost, but initializing GL early to help mitigate
  initGL();

  this.maxRTSize = function () {
    initGL();
    return _maxRTSize;
  };
  this.deleteImageTexture = function (texture) {
    // _gl is only assigned once initGL() succeeds, so guard the object too.
    if (!_gl || !_gl.deleteTexture) {
      return;
    }
    _gl.deleteTexture(texture);
  };
  this.createImageTexture = function (image) {
    if (!initGL()) {
      return null;
    }
    const texture = _gl.createTexture();
    if (!texture) {
      return null;
    }
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

  const _maxRecentVertexLength = new MaxRecentSize(
    1000 /*ms*/,
    10 /*aligned to multiples of 1024*/
  );
  const _maxRecentIndexLength = new MaxRecentSize(
    1000 /*ms*/,
    10 /*aligned to multiples of 1024*/
  );

  this.drawMeshAtlas = function (atlasWidth, atlasHeight, entries) {
    if (!initGL()) {
      return;
    }

    // Early out if the proxy doesn't return the canvas due to lost context
    if (!_gl.canvas) {
      return;
    }
    if (_gl.canvas.width != atlasWidth || _gl.canvas.height != atlasHeight) {
      _gl.canvas.width = atlasWidth;
      _gl.canvas.height = atlasHeight;
    }
    _gl.viewport(0, 0, atlasWidth, atlasHeight);
    _gl.disable(_gl.SCISSOR_TEST);
    _gl.clearColor(0, 0, 0, 0);
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    // Sort the meshes into a draw order that minimizes the cost of GL state changes, with
    // more expensive state in higher order bits. Slots don't overlap, so order doesn't
    // otherwise matter.
    const sortKey = (entry) =>
      (entry.contents.image._uniqueID << 1) | (entry.needsScissor ? 1 : 0);
    entries.sort((a, b) => sortKey(b) - sortKey(a));

    const SIZE_OF_FLOAT = 4;
    const SIZE_OF_U16 = 2;

    let numTotalVertexFloats = 0;
    let numTotalIndices = 0;
    for (const entry of entries) {
      numTotalVertexFloats += entry.contents.vtx.length;
      numTotalIndices += entry.contents.indices.length;
    }

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
    for (const entry of entries) {
      _gl.bufferSubData(_gl.ARRAY_BUFFER, vOffset, entry.contents.vtx);
      vOffset += entry.contents.vtx.length * SIZE_OF_FLOAT;
    }
    console.assert(vOffset == numTotalVertexFloats * SIZE_OF_FLOAT);

    // Upload all uv.
    for (const entry of entries) {
      _gl.bufferSubData(_gl.ARRAY_BUFFER, vOffset, entry.contents.uv);
      vOffset += entry.contents.uv.length * SIZE_OF_FLOAT;
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
    for (const entry of entries) {
      _gl.bufferSubData(_gl.ELEMENT_ARRAY_BUFFER, iOffset, entry.contents.indices);
      iOffset += entry.contents.indices.length * SIZE_OF_U16;
    }
    console.assert(iOffset == numTotalIndices * SIZE_OF_U16);

    // Draw all meshes.
    let boundTextureID = 0;
    let hasScissor = false;
    vOffset = iOffset = 0;
    for (const entry of entries) {
      const mesh = entry.contents;
      if (mesh.image._uniqueID != boundTextureID) {
        _gl.bindTexture(_gl.TEXTURE_2D, mesh.image._meshTexture || null);
        boundTextureID = mesh.image._uniqueID;
      }

      if (entry.needsScissor) {
        // GL's origin is bottom-left, where the atlas's is top-left.
        _gl.scissor(
          entry.atlasX,
          atlasHeight - entry.atlasY - entry.heightInAtlas,
          entry.widthInAtlas,
          entry.heightInAtlas
        );
        if (!hasScissor) {
          _gl.enable(_gl.SCISSOR_TEST);
          hasScissor = true;
        }
      } else if (hasScissor) {
        _gl.disable(_gl.SCISSOR_TEST);
        hasScissor = false;
      }

      // Post-transform the atlas matrix into normalized OpenGL clip space (-1..1).
      const m = entry.atlasMatrix;
      const iw = 2 / atlasWidth;
      const ih = -2 / atlasHeight;
      _gl.uniform4f(_matUniform, m[0] * iw, m[1] * ih, m[2] * iw, m[3] * ih);
      _gl.uniform2f(_translateUniform, m[4] * iw - 1, m[5] * ih + 1);

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
        mesh.indices.length,
        _gl.UNSIGNED_SHORT,
        iOffset
      );

      vOffset += mesh.vtx.length * SIZE_OF_FLOAT;
      iOffset += mesh.indices.length * SIZE_OF_U16;
    }
    console.assert(vOffset == numTotalVertexFloats * SIZE_OF_FLOAT);
    console.assert(iOffset == numTotalIndices * SIZE_OF_U16);
  };

  this.canvas = function () {
    return initGL() && _gl.canvas;
  };
})();

// Draws image meshes on a standalone WebGL context, for canvas 2D builds that don't link
// the WebGL2 renderer. Each entry's contents is a mesh: { image, vtx, uv, indices }.
class MeshOffscreenBackend {
  constructor() {
    this.supportsPaths = false;
  }

  maxAtlasSize() {
    return offscreenWebGL.maxRTSize();
  }

  canvas() {
    return offscreenWebGL.canvas() || null;
  }

  attachImage(renderImage, htmlImage) {
    renderImage._meshTexture = offscreenWebGL.createImageTexture(htmlImage);
  }

  releaseImage(renderImage) {
    if (renderImage._meshTexture) {
      offscreenWebGL.deleteImageTexture(renderImage._meshTexture);
      renderImage._meshTexture = null;
    }
  }

  render(width, height, entries) {
    offscreenWebGL.drawMeshAtlas(width, height, entries);
  }
}

const canvasOffscreenRenderer = new CanvasOffscreenRenderer(new MeshOffscreenBackend());
