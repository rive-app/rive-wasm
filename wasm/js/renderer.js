function makeMatrix(m2d) {
    const m = new DOMMatrix();
    m.a = m2d['xx'];
    m.b = m2d['xy'];
    m.c = m2d['yx'];
    m.d = m2d['yy'];
    m.e = m2d['tx'];
    m.f = m2d['ty'];
    return m;
}

// Used for rendering meshes.
const offscreenWebGL = new (function() {
    let _gl = null;
    let _matUniform = null;
    let _translateUniform = null;
    let _vertexBufferLength = 0;
    let _indexBufferLength = 0;

    const initGL = function() {
        if (!_gl) {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl', {
                'alpha': 1,
                'depth': 0,
                'stencil': 0,
                'antialias': 0,
                'premultipliedAlpha': 1,
                'preserveDrawingBuffer': 0,
                'preferLowPowerToHighPerformance': 0,
                'failIfMajorPerformanceCaveat': 0,
                'enableExtensionsByDefault': 1,
                'explicitSwapControl': 0,
                'renderViaOffscreenBackBuffer': 0
            });
            if (!gl) {
                console.log("No WebGL support. Image mesh will not be drawn.");
                return false;
            }
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
            compileAndAttachShader(program, gl.VERTEX_SHADER,
               `attribute vec2 vertex;
                attribute vec2 uv;
                uniform vec4 mat;
                uniform vec2 translate;
                varying vec2 st;
                void main() {
                    st = uv;
                    gl_Position = vec4(mat2(mat) * vertex + translate, 0, 1);
                }`);
            compileAndAttachShader(program, gl.FRAGMENT_SHADER,
               `precision highp float;
                uniform sampler2D image;
                varying vec2 st;
                void main() {
                    gl_FragColor = texture2D(image, st);
                }`);
            gl.bindAttribLocation(program, 0, "vertex");
            gl.bindAttribLocation(program, 1, "uv");
            gl.linkProgram(program);
            const log = gl.getProgramInfoLog(program);
            if (log.length > 0) {
                throw log;
            }
            _matUniform = gl.getUniformLocation(program, "mat");
            _translateUniform = gl.getUniformLocation(program, "translate");
            gl.useProgram(program);

            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);  // vertexAttribPointer(1) depends on vertex length.

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

            gl.uniform1i(gl.getUniformLocation(program, "image"), 0);

            gl.enable(gl.SCISSOR_TEST);

            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

            _gl = gl;
        }
        return true;
    }

    this.createImageTexture = function(image) {
        if (!initGL()) {
            return null;
        }
        const texture = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, texture);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
        return texture;
    }

    const _maxRecentWidth = new MaxRecentSize(1000/*ms*/, 8/*aligned to multiples of 256*/);
    const _maxRecentHeight = new MaxRecentSize(1000/*ms*/, 8/*aligned to multiples of 256*/);
    const _maxRecentVertexCount = new MaxRecentSize(1000/*ms*/, 10/*aligned to multiples of 1024*/);
    const _maxRecentIndexCount = new MaxRecentSize(1000/*ms*/, 10/*aligned to multiples of 1024*/);

    this.drawImageMesh = function(ctx,
                                  imageTexture,
                                  canvasBlend,
                                  opacity,
                                  vertices,
                                  uv,
                                  indices,
                                  meshMinX,
                                  meshMinY,
                                  meshMaxX,
                                  meshMaxY) {
        if (!initGL()) {
            return;
        }

        // Clip the mesh's bounding box to its canvas.
        const l = Math.max(meshMinX, 0);
        const t = Math.max(meshMinY, 0);
        const r = Math.min(meshMaxX, ctx['canvas']['width']);
        const b = Math.min(meshMaxY, ctx['canvas']['height']);
        const w = r - l;
        const h = b - t;
        console.assert(w <= ctx['canvas']['width']);
        console.assert(h <= ctx['canvas']['height']);
        // Bail if the bounding box was out of view.
        if (w <= 0 || h <= 0) {
            return;
        }

        const glWidth = _maxRecentWidth.push(w);
        const glHeight = _maxRecentHeight.push(h);
        if (_gl.canvas.width != glWidth || _gl.canvas.height != glHeight) {
            _gl.canvas.width = glWidth;
            _gl.canvas.height = glHeight;
            _gl.viewport(0, 0, glWidth, glHeight);
        }

        _gl.scissor(0, glHeight - h, w, h);
        _gl.clearColor(0, 0, 0, 0);
        _gl.clear(_gl.COLOR_BUFFER_BIT);

        const vertexCount = _maxRecentVertexCount.push(vertices.length);
        if (_vertexBufferLength != vertexCount)  {
            _gl.bufferData(_gl.ARRAY_BUFFER, vertexCount * 4 * 4, _gl.DYNAMIC_DRAW);
            _vertexBufferLength = vertexCount;
        }
        _gl.bufferSubData(_gl.ARRAY_BUFFER, 0, vertices, _gl.DYNAMIC_DRAW);
        const uvOffset = vertices.length * 2 * 4;
        _gl.vertexAttribPointer(1, 2, _gl.FLOAT, false, 0, uvOffset);
        _gl.bufferSubData(_gl.ARRAY_BUFFER, uvOffset, uv, _gl.DYNAMIC_DRAW);

        const indexCount = _maxRecentIndexCount.push(indices.length);
        if (_indexBufferLength != indexCount)  {
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, indexCount * 2, _gl.DYNAMIC_DRAW);
            _indexBufferLength = indexCount;
        }
        _gl.bufferSubData(_gl.ELEMENT_ARRAY_BUFFER, 0, indices, _gl.DYNAMIC_DRAW);

        // Draw the top-left corner of the mesh at location (0, 0) in the WebGL canvas.
        // Post-translate the canvas2d's matrix into normalized OpenGL clip space (-1..1).
        const m = ctx['getTransform']();
        const iw = 2 / _gl.canvas.width;
        const ih = -2 / _gl.canvas.height;
        _gl.uniform4f(_matUniform, m.a*iw, m.b*ih, m.c*iw, m.d*ih);
        _gl.uniform2f(_translateUniform, (m.e - l) * iw - 1, (m.f - t) * ih + 1);

        _gl.bindTexture(_gl.TEXTURE_2D, imageTexture);

        _gl.drawElements(_gl.TRIANGLES, indices.length, _gl.UNSIGNED_SHORT, 0);

        ctx['save']();
        ctx['resetTransform']();
        ctx['globalCompositeOperation'] = canvasBlend;
        ctx['globalAlpha'] = opacity;
        ctx['drawImage'](_gl.canvas, 0, 0, w, h, l, t, w, h);
        ctx['restore']();
    }
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

    var CanvasRenderImage = RenderImage.extend('CanvasRenderImage', {
        '__construct': function () {
            this['__parent']['__construct'].call(this);
        },
        'decode': function (bytes) {
            var cri = this;
            var image = new Image();
            image.src = URL.createObjectURL(
                new Blob([bytes], {
                    type: 'image/png'
                })
            );
            image.onload = function () {
                cri._image = image;
                cri._texture = offscreenWebGL.createImageTexture(image);
                cri["size"](image.width, image.height);
            };

        }
    });


    function _canvasBlend(value) {
        switch (value) {
            case BlendMode.srcOver:
                return 'source-over';
            case BlendMode.screen:
                return 'screen';
            case BlendMode.overlay:
                return 'overlay';
            case BlendMode.darken:
                return 'darken';
            case BlendMode.lighten:
                return 'lighten';
            case BlendMode.colorDodge:
                return 'color-dodge';
            case BlendMode.colorBurn:
                return 'color-burn';
            case BlendMode.hardLight:
                return 'hard-light';
            case BlendMode.softLight:
                return 'soft-light';
            case BlendMode.difference:
                return 'difference';
            case BlendMode.exclusion:
                return 'exclusion';
            case BlendMode.multiply:
                return 'multiply';
            case BlendMode.hue:
                return 'hue';
            case BlendMode.saturation:
                return 'saturation';
            case BlendMode.color:
                return 'color';
            case BlendMode.luminosity:
                return 'luminosity';
        }
    }
    var CanvasRenderPath = RenderPath.extend('CanvasRenderPath', {
        '__construct': function () {
            this['__parent']['__construct'].call(this);
            this._path2D = new Path2D();
        },
        'reset': function () {
            this._path2D = new Path2D();
        },
        'addPath': function (path, m2d) {
            this._path2D['addPath'](path._path2D, makeMatrix(m2d));
        },
        'fillRule': function (fillRule) {
            this._fillRule = fillRule;
        },
        'moveTo': function (x, y) {
            this._path2D['moveTo'](x, y);
        },
        'lineTo': function (x, y) {
            this._path2D['lineTo'](x, y);
        },
        'cubicTo': function (ox, oy, ix, iy, x, y) {
            this._path2D['bezierCurveTo'](ox, oy, ix, iy, x, y);
        },
        'close': function () {
            this._path2D['closePath']();
        }
    });

    function _colorStyle(value) {
        return 'rgba(' + ((0x00ff0000 & value) >>>
                16) + ',' + ((0x0000ff00 &
                value) >>> 8) + ',' + ((0x000000ff & value) >>> 0) + ',' +
            (((0xff000000 & value) >>> 24) / 0xFF) + ')'
    }
    var CanvasRenderPaint = RenderPaint.extend('CanvasRenderPaint', {
        'color': function (value) {
            this._value = _colorStyle(value);
        },
        'thickness': function (value) {
            this._thickness = value;
        },
        'join': function (value) {
            switch (value) {
                case StrokeJoin.miter:
                    this._join = 'miter';
                    break;
                case StrokeJoin.round:
                    this._join = 'round';
                    break;
                case StrokeJoin.bevel:
                    this._join = 'bevel';
                    break;
            }
        },
        'cap': function (value) {
            switch (value) {
                case StrokeCap.butt:
                    this._cap = 'butt';
                    break;
                case StrokeCap.round:
                    this._cap = 'round';
                    break;
                case StrokeCap.square:
                    this._cap = 'square';
                    break;
            }
        },
        'style': function (value) {
            this._style = value;
        },
        'blendMode': function (value) {
            this._blend = _canvasBlend(value);
        },
        'linearGradient': function (sx, sy, ex, ey) {
            this._gradient = {
                sx,
                sy,
                ex,
                ey,
                stops: []
            };
        },
        'radialGradient': function (sx, sy, ex, ey) {
            this._gradient = {
                sx,
                sy,
                ex,
                ey,
                stops: [],
                isRadial: true
            };
        },
        'addStop': function (color, stop) {
            this._gradient.stops.push({
                color,
                stop
            });
        },

        'completeGradient': function () {

        },

        'draw': function (ctx, path) {
            let _style = this._style;
            let _value = this._value;
            let _gradient = this._gradient;
            let _blend = this._blend;

            ctx['globalCompositeOperation'] = _blend;

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
                    _value = ctx['createRadialGradient'](sx, sy, 0, sx, sy, radius);
                } else {
                    _value = ctx['createLinearGradient'](sx, sy, ex, ey);
                }

                for (let i = 0, l = stops['length']; i < l; i++) {
                    const value = stops[i];
                    const stop = value.stop;
                    const color = value.color;
                    _value['addColorStop'](stop, _colorStyle(color));
                }
                this._value = _value;
                this._gradient = null;
            }
            switch (_style) {
                case stroke:
                    ctx['strokeStyle'] = _value;
                    ctx['lineWidth'] = this._thickness;
                    ctx['lineCap'] = this._cap;
                    ctx['lineJoin'] = this._join;
                    ctx['stroke'](path._path2D);
                    break;
                case fill:
                    ctx['fillStyle'] = _value;
                    ctx['fill'](path._path2D, path._fillRule === evenOdd ? 'evenodd' : 'nonzero');
                    break;
            }
        }
    });

    var CanvasRenderer = Rive.CanvasRenderer = Renderer.extend('Renderer', {
        '__construct': function (canvas) {
            this['__parent']['__construct'].call(this);
            // Keep a local shadow of the matrix stack, since actual calls to the canvas2d context
            // are deferred, but we reed this matrix data at record time.
            this._matrixStack = [1, 0, 0, 1, 0, 0];
            this._ctx = canvas['getContext']('2d');
            this._canvas = canvas;
            this._drawList = [];
        },
        'save': function () {
            const i = this._matrixStack.length - 6;
            this._matrixStack.push(...this._matrixStack.slice(i));
            this._drawList.push(this._ctx['save'].bind(this._ctx));
        },
        'restore': function () {
            const i = this._matrixStack.length - 6;
            if (i < 6) {
                throw "restore() called without matching save().";
            }
            this._matrixStack.splice(i);
            this._drawList.push(this._ctx['restore'].bind(this._ctx));
        },
        'transform': function (m) {
            const S = this._matrixStack;
            const i = S.length - 6;
            //            |S0  S2  S4|   |m.xx  m.yx  m.tx|
            // S.back() = |S1  S3  S5| * |m.xy  m.yy  m.ty|
            //            | 0   0   1|   |   0     0     1|
            S.splice(i,
                     6,
                     S[i+0] * m['xx'] + S[i+2] * m['xy'],
                     S[i+1] * m['xx'] + S[i+3] * m['xy'],
                     S[i+0] * m['yx'] + S[i+2] * m['yy'],
                     S[i+1] * m['yx'] + S[i+3] * m['yy'],
                     S[i+0] * m['tx'] + S[i+2] * m['ty'] + S[i+4],
                     S[i+1] * m['tx'] + S[i+3] * m['ty'] + S[i+5]);
            this._drawList.push(this._ctx['transform'].bind(
                    this._ctx, m['xx'], m['xy'], m['yx'], m['yy'], m['tx'], m['ty']));
        },
        '_drawPath': function (path, paint) {
            this._drawList.push(paint['draw'].bind(paint, this._ctx, path));
        },
        '_drawImage': function (image, blend, opacity) {
            var img = image._image;
            if (!img) {
                return;
            }
            var ctx = this._ctx;
            blend = _canvasBlend(blend);
            this._drawList.push(function() {
                ctx['globalCompositeOperation'] = blend;
                ctx['globalAlpha'] = opacity;
                ctx['drawImage'](img, 0, 0);
                ctx['globalAlpha'] = 1;
            });
        },
        '_getMatrix': function (out) {
            const S = this._matrixStack;
            const i = S.length - 6;
            for (let j = 0; j < 6; ++j) {
                out[j] = S[i+j];
            }
        },
        '_drawImageMesh': function (image,
                                    blend,
                                    opacity,
                                    vtx,
                                    uv,
                                    indices,
                                    meshMinX,
                                    meshMinY,
                                    meshMaxX,
                                    meshMaxY) {
            this._drawList.push(offscreenWebGL.drawImageMesh.bind(offscreenWebGL,
                                                                  this._ctx,
                                                                  image._texture || null,
                                                                  _canvasBlend(blend),
                                                                  opacity,
                                                                  new Float32Array(vtx),
                                                                  new Float32Array(uv),
                                                                  new Uint16Array(indices),
                                                                  meshMinX,
                                                                  meshMinY,
                                                                  meshMaxX,
                                                                  meshMaxY));
        },
        '_clipPath': function (path) {
            const fillRule = path._fillRule === evenOdd ? 'evenodd' : 'nonzero';
            this._drawList.push(this._ctx['clip'].bind(this._ctx, path._path2D, fillRule));
        },
        'clear': function () {
            this._drawList.push(this._ctx['clearRect'].bind(
                    this._ctx, 0, 0, this._canvas['width'], this._canvas['height']));
        },
        'flush': function () {
            for (const lambda of this._drawList) {
                lambda();
            }
            this._drawList = [];
        }
    });

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
        }
    };

    Rive['requestAnimationFrame'] = window['requestAnimationFrame'].bind(window);
    Rive['cancelAnimationFrame'] = window['cancelAnimationFrame'].bind(window);
};
