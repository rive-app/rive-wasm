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

    const _maxRecentWidth = new MaxRecentSize(1000/*ms*/);
    const _maxRecentHeight = new MaxRecentSize(1000/*ms*/);
    const _maxRecentVertexCount = new MaxRecentSize(1000/*ms*/);
    const _maxRecentIndexCount = new MaxRecentSize(1000/*ms*/);

    this.drawImageMesh = function(ctx, imageTexture, canvasBlend, opacity, vertices, uv, indices) {
        if (!initGL()) {
            return;
        }

        // Compute bounding box. TODO: SIMD wasm.
        const m = ctx['getTransform']();
        let l=ctx['canvas']['width'], t=ctx['canvas']['height'], r=0, b=0;
        for (let i = 0; i < vertices.length; i += 2) {
            const x = vertices[i]*m.a + vertices[i+1]*m.c;
            const y = vertices[i]*m.b + vertices[i+1]*m.d;
            l = Math.min(l, x);
            t = Math.min(t, y);
            r = Math.max(r, x);
            b = Math.max(b, y);
        }
        if (l >= r || t >= b) {
            // Out of view.
            throw 'derp';//return
        }
        l = Math.floor(l + m.e);
        t = Math.floor(t + m.f);
        r = Math.ceil(r + m.e);
        b = Math.ceil(b + m.f);
        const w = r - l;
        const h = b - t;

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
        _gl.bufferSubData(_gl.ARRAY_BUFFER, 0, new Float32Array(vertices), _gl.DYNAMIC_DRAW);
        const uvOffset = vertices.length * 2 * 4;
        _gl.vertexAttribPointer(1, 2, _gl.FLOAT, false, 0, uvOffset);
        _gl.bufferSubData(_gl.ARRAY_BUFFER, uvOffset, new Float32Array(uv), _gl.DYNAMIC_DRAW);

        const indexCount = _maxRecentIndexCount.push(indices.length);
        if (_indexBufferLength != indexCount)  {
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, indexCount * 2, _gl.DYNAMIC_DRAW);
            _indexBufferLength = indexCount;
        }
        _gl.bufferSubData(_gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(indices), _gl.DYNAMIC_DRAW);

        // Draw the top-left corner of the mesh at location (0, 0) in the WebGL canvas.
        // Post-translate the canvas2d's matrix into normalized OpenGL clip space (-1..1).
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
            this._ctx = canvas['getContext']('2d');
            this._canvas = canvas;
        },
        'save': function () {
            this._ctx['save']();
        },
        'restore': function () {
            this._ctx['restore']();
        },
        'transform': function (matrix) {
            this._ctx['transform'](matrix['xx'], matrix['xy'], matrix['yx'], matrix['yy'], matrix['tx'],
                matrix['ty']);
        },
        'drawPath': function (path, paint) {
            paint['draw'](this._ctx, path);
        },
        'drawImage': function (image, blend, opacity) {
            var img = image._image;
            if (!img) {
                return;
            }
            var ctx = this._ctx;
            ctx['globalCompositeOperation'] = _canvasBlend(blend);
            ctx['globalAlpha'] = opacity;
            ctx['drawImage'](img, 0, 0);
            ctx['globalAlpha'] = 1;
        },
        'drawImageMesh': function (image, blend, opacity, vtx, uv, indices) {
            offscreenWebGL.drawImageMesh(this._ctx,
                                         image._texture || null,
                                         _canvasBlend(blend),
                                         opacity,
                                         vtx,
                                         uv,
                                         indices);
        },
        'clipPath': function (path) {
            this._ctx['clip'](path._path2D, path._fillRule === evenOdd ? 'evenodd' : 'nonzero');
        },
        'clear': function () {
            this._ctx['clearRect'](0, 0, this._canvas['width'], this._canvas['height']);
        },
        'flush': function () {

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
