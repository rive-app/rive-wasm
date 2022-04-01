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
            // Adapted from https://stackoverflow.com/questions/4774172/image-manipulation-and-texture-mapping-using-html5-canvas
            var img = image._image;
            if (!img) {
                return;
            }
            var width = img['width'];
            var height = img['height'];
            var ctx = this._ctx;
            var pattern = ctx['createPattern'](img, 'no-repeat');
            ctx['globalCompositeOperation'] = _canvasBlend(blend);
            ctx['globalAlpha'] = opacity;
            for (var i = 0; i < indices.length; i += 3) {
                var vtx1 = indices[i] * 2;
                var vtx2 = indices[i + 1] * 2;
                var vtx3 = indices[i + 2] * 2;

                var x0 = vtx[vtx1],
                    x1 = vtx[vtx2],
                    x2 = vtx[vtx3];
                var y0 = vtx[vtx1 + 1],
                    y1 = vtx[vtx2 + 1],
                    y2 = vtx[vtx3 + 1];
                var u0 = uv[vtx1] * width,
                    u1 = uv[vtx2] * width,
                    u2 = uv[vtx3] * width;
                var v0 = uv[vtx1 + 1] * height,
                    v1 = uv[vtx2 + 1] * height,
                    v2 = uv[vtx3 + 1] * height;

                // Issue path commands before transforming, this ensures that
                // the fill is transformed but not our points.
                ctx['save']();
                ctx['beginPath']();
                ctx['moveTo'](x0, y0);
                ctx['lineTo'](x1, y1);
                ctx['lineTo'](x2, y2);
                ctx['closePath']();
                ctx['fillStyle'] = pattern;

                // Compute image transform matrix (apply transform after clip).
                var delta = u0 * v1 + v0 * u2 + u1 * v2 - v1 * u2 - v0 * u1 - u0 * v2;
                var delta_a = x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2;
                var delta_b = u0 * x1 + x0 * u2 + u1 * x2 - x1 * u2 - x0 * u1 - u0 * x2;
                var delta_c = u0 * v1 * x2 + v0 * x1 * u2 + x0 * u1 * v2 - x0 * v1 * u2 -
                    v0 * u1 * x2 - u0 * x1 * v2;
                var delta_d = y0 * v1 + v0 * y2 + y1 * v2 - v1 * y2 - v0 * y1 - y0 * v2;
                var delta_e = u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2;
                var delta_f = u0 * v1 * y2 + v0 * y1 * u2 + y0 * u1 * v2 - y0 * v1 * u2 -
                    v0 * u1 * y2 - u0 * y1 * v2;

                // Transform and draw
                ctx['transform'](delta_a / delta, delta_d / delta,
                    delta_b / delta, delta_e / delta,
                    delta_c / delta, delta_f / delta);

                ctx['fill']();

                ctx['restore']();
            }
            ctx['globalAlpha'] = 1;
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
};