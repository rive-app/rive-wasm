
// Bindings utilities

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function WrapperObject() {
}
WrapperObject.prototype = Object.create(WrapperObject.prototype);
WrapperObject.prototype.constructor = WrapperObject;
WrapperObject.prototype.__class__ = WrapperObject;
WrapperObject.__cache__ = {};
Module['WrapperObject'] = WrapperObject;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */
function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}
Module['getCache'] = getCache;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */
function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__);
  var ret = cache[ptr];
  if (ret) return ret;
  ret = Object.create((__class__ || WrapperObject).prototype);
  ret.ptr = ptr;
  return cache[ptr] = ret;
}
Module['wrapPointer'] = wrapPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}
Module['castObject'] = castObject;

Module['NULL'] = wrapPointer(0);

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function destroy(obj) {
  if (!obj['__destroy__']) throw 'Error: Cannot destroy object. (Did you create it yourself?)';
  obj['__destroy__']();
  // Remove from cache, so the object can be GC'd and refs added onto it released
  delete getCache(obj.__class__)[obj.ptr];
}
Module['destroy'] = destroy;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}
Module['compare'] = compare;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getPointer(obj) {
  return obj.ptr;
}
Module['getPointer'] = getPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getClass(obj) {
  return obj.__class__;
}
Module['getClass'] = getClass;

// Converts big (string or array) values into a C-style storage, in temporary space

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
var ensureCache = {
  buffer: 0,  // the main buffer of temporary storage
  size: 0,   // the size of buffer
  pos: 0,    // the next free offset in buffer
  temps: [], // extra allocations
  needed: 0, // the total size we need next time

  prepare: function() {
    if (ensureCache.needed) {
      // clear the temps
      for (var i = 0; i < ensureCache.temps.length; i++) {
        Module['_free'](ensureCache.temps[i]);
      }
      ensureCache.temps.length = 0;
      // prepare to allocate a bigger buffer
      Module['_free'](ensureCache.buffer);
      ensureCache.buffer = 0;
      ensureCache.size += ensureCache.needed;
      // clean up
      ensureCache.needed = 0;
    }
    if (!ensureCache.buffer) { // happens first time, or when we need to grow
      ensureCache.size += 128; // heuristic, avoid many small grow events
      ensureCache.buffer = Module['_malloc'](ensureCache.size);
      assert(ensureCache.buffer);
    }
    ensureCache.pos = 0;
  },
  alloc: function(array, view) {
    assert(ensureCache.buffer);
    var bytes = view.BYTES_PER_ELEMENT;
    var len = array.length * bytes;
    len = (len + 7) & -8; // keep things aligned to 8 byte boundaries
    var ret;
    if (ensureCache.pos + len >= ensureCache.size) {
      // we failed to allocate in the buffer, ensureCache time around :(
      assert(len > 0); // null terminator, at least
      ensureCache.needed += len;
      ret = Module['_malloc'](len);
      ensureCache.temps.push(ret);
    } else {
      // we can allocate in the buffer
      ret = ensureCache.buffer + ensureCache.pos;
      ensureCache.pos += len;
    }
    return ret;
  },
  copy: function(array, view, offset) {
    offset >>>= 0;
    var bytes = view.BYTES_PER_ELEMENT;
    switch (bytes) {
      case 2: offset >>>= 1; break;
      case 4: offset >>>= 2; break;
      case 8: offset >>>= 3; break;
    }
    for (var i = 0; i < array.length; i++) {
      view[offset + i] = array[i];
    }
  },
};

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureString(value) {
  if (typeof value === 'string') {
    var intArray = intArrayFromString(value);
    var offset = ensureCache.alloc(intArray, HEAP8);
    ensureCache.copy(intArray, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt8(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP8);
    ensureCache.copy(value, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt16(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP16);
    ensureCache.copy(value, HEAP16, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP32);
    ensureCache.copy(value, HEAP32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF32);
    ensureCache.copy(value, HEAPF32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat64(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF64);
    ensureCache.copy(value, HEAPF64, offset);
    return offset;
  }
  return value;
}


// CommandPath
/** @suppress {undefinedVars, duplicate} @this{Object} */function CommandPath() { throw "cannot construct a CommandPath, no constructor in IDL" }
CommandPath.prototype = Object.create(WrapperObject.prototype);
CommandPath.prototype.constructor = CommandPath;
CommandPath.prototype.__class__ = CommandPath;
CommandPath.__cache__ = {};
Module['CommandPath'] = CommandPath;

  CommandPath.prototype['__destroy__'] = CommandPath.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_CommandPath___destroy___0(self);
};
// Renderer
/** @suppress {undefinedVars, duplicate} @this{Object} */function Renderer() { throw "cannot construct a Renderer, no constructor in IDL" }
Renderer.prototype = Object.create(WrapperObject.prototype);
Renderer.prototype.constructor = Renderer;
Renderer.prototype.__class__ = Renderer;
Renderer.__cache__ = {};
Module['Renderer'] = Renderer;

Renderer.prototype['save'] = Renderer.prototype.save = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Renderer_save_0(self);
};;

Renderer.prototype['restore'] = Renderer.prototype.restore = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Renderer_restore_0(self);
};;

Renderer.prototype['align'] = Renderer.prototype.align = /** @suppress {undefinedVars, duplicate} @this{Object} */function(fit, alignment, frame, content) {
  var self = this.ptr;
  if (fit && typeof fit === 'object') fit = fit.ptr;
  if (alignment && typeof alignment === 'object') alignment = alignment.ptr;
  if (frame && typeof frame === 'object') frame = frame.ptr;
  if (content && typeof content === 'object') content = content.ptr;
  _emscripten_bind_Renderer_align_4(self, fit, alignment, frame, content);
};;

  Renderer.prototype['__destroy__'] = Renderer.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Renderer___destroy___0(self);
};
// RenderPath
/** @suppress {undefinedVars, duplicate} @this{Object} */function RenderPath() { throw "cannot construct a RenderPath, no constructor in IDL" }
RenderPath.prototype = Object.create(CommandPath.prototype);
RenderPath.prototype.constructor = RenderPath;
RenderPath.prototype.__class__ = RenderPath;
RenderPath.__cache__ = {};
Module['RenderPath'] = RenderPath;

RenderPath.prototype['reset'] = RenderPath.prototype.reset = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPath_reset_0(self);
};;

RenderPath.prototype['addPath'] = RenderPath.prototype.addPath = /** @suppress {undefinedVars, duplicate} @this{Object} */function(path, transform) {
  var self = this.ptr;
  if (path && typeof path === 'object') path = path.ptr;
  if (transform && typeof transform === 'object') transform = transform.ptr;
  _emscripten_bind_RenderPath_addPath_2(self, path, transform);
};;

RenderPath.prototype['moveTo'] = RenderPath.prototype.moveTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(x, y) {
  var self = this.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPath_moveTo_2(self, x, y);
};;

RenderPath.prototype['lineTo'] = RenderPath.prototype.lineTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(x, y) {
  var self = this.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPath_lineTo_2(self, x, y);
};;

RenderPath.prototype['cubicTo'] = RenderPath.prototype.cubicTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(ox, oy, ix, iy, x, y) {
  var self = this.ptr;
  if (ox && typeof ox === 'object') ox = ox.ptr;
  if (oy && typeof oy === 'object') oy = oy.ptr;
  if (ix && typeof ix === 'object') ix = ix.ptr;
  if (iy && typeof iy === 'object') iy = iy.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPath_cubicTo_6(self, ox, oy, ix, iy, x, y);
};;

RenderPath.prototype['close'] = RenderPath.prototype.close = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPath_close_0(self);
};;

RenderPath.prototype['fillRule'] = RenderPath.prototype.fillRule = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPath_fillRule_1(self, value);
};;

  RenderPath.prototype['__destroy__'] = RenderPath.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPath___destroy___0(self);
};
// RenderPaint
/** @suppress {undefinedVars, duplicate} @this{Object} */function RenderPaint() { throw "cannot construct a RenderPaint, no constructor in IDL" }
RenderPaint.prototype = Object.create(WrapperObject.prototype);
RenderPaint.prototype.constructor = RenderPaint;
RenderPaint.prototype.__class__ = RenderPaint;
RenderPaint.__cache__ = {};
Module['RenderPaint'] = RenderPaint;

RenderPaint.prototype['style'] = RenderPaint.prototype.style = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_style_1(self, value);
};;

RenderPaint.prototype['color'] = RenderPaint.prototype.color = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_color_1(self, value);
};;

RenderPaint.prototype['thickness'] = RenderPaint.prototype.thickness = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_thickness_1(self, value);
};;

RenderPaint.prototype['join'] = RenderPaint.prototype.join = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_join_1(self, value);
};;

RenderPaint.prototype['cap'] = RenderPaint.prototype.cap = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_cap_1(self, value);
};;

RenderPaint.prototype['blendMode'] = RenderPaint.prototype.blendMode = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaint_blendMode_1(self, value);
};;

RenderPaint.prototype['linearGradient'] = RenderPaint.prototype.linearGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function(sx, sy, ex, ey) {
  var self = this.ptr;
  if (sx && typeof sx === 'object') sx = sx.ptr;
  if (sy && typeof sy === 'object') sy = sy.ptr;
  if (ex && typeof ex === 'object') ex = ex.ptr;
  if (ey && typeof ey === 'object') ey = ey.ptr;
  _emscripten_bind_RenderPaint_linearGradient_4(self, sx, sy, ex, ey);
};;

RenderPaint.prototype['radialGradient'] = RenderPaint.prototype.radialGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function(sx, sy, ex, ey) {
  var self = this.ptr;
  if (sx && typeof sx === 'object') sx = sx.ptr;
  if (sy && typeof sy === 'object') sy = sy.ptr;
  if (ex && typeof ex === 'object') ex = ex.ptr;
  if (ey && typeof ey === 'object') ey = ey.ptr;
  _emscripten_bind_RenderPaint_radialGradient_4(self, sx, sy, ex, ey);
};;

RenderPaint.prototype['addStop'] = RenderPaint.prototype.addStop = /** @suppress {undefinedVars, duplicate} @this{Object} */function(color, stop) {
  var self = this.ptr;
  if (color && typeof color === 'object') color = color.ptr;
  if (stop && typeof stop === 'object') stop = stop.ptr;
  _emscripten_bind_RenderPaint_addStop_2(self, color, stop);
};;

RenderPaint.prototype['completeGradient'] = RenderPaint.prototype.completeGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPaint_completeGradient_0(self);
};;

  RenderPaint.prototype['__destroy__'] = RenderPaint.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPaint___destroy___0(self);
};
// LinearAnimationInstance
/** @suppress {undefinedVars, duplicate} @this{Object} */function LinearAnimationInstance() { throw "cannot construct a LinearAnimationInstance, no constructor in IDL" }
LinearAnimationInstance.prototype = Object.create(WrapperObject.prototype);
LinearAnimationInstance.prototype.constructor = LinearAnimationInstance;
LinearAnimationInstance.prototype.__class__ = LinearAnimationInstance;
LinearAnimationInstance.__cache__ = {};
Module['LinearAnimationInstance'] = LinearAnimationInstance;

LinearAnimationInstance.prototype['time'] = LinearAnimationInstance.prototype.time = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_LinearAnimationInstance_time_0(self);
};;

LinearAnimationInstance.prototype['advance'] = LinearAnimationInstance.prototype.advance = /** @suppress {undefinedVars, duplicate} @this{Object} */function(elapsedTime) {
  var self = this.ptr;
  if (elapsedTime && typeof elapsedTime === 'object') elapsedTime = elapsedTime.ptr;
  return !!(_emscripten_bind_LinearAnimationInstance_advance_1(self, elapsedTime));
};;

LinearAnimationInstance.prototype['apply'] = LinearAnimationInstance.prototype.apply = /** @suppress {undefinedVars, duplicate} @this{Object} */function(artboard, mix) {
  var self = this.ptr;
  if (artboard && typeof artboard === 'object') artboard = artboard.ptr;
  if (mix && typeof mix === 'object') mix = mix.ptr;
  _emscripten_bind_LinearAnimationInstance_apply_2(self, artboard, mix);
};;

  LinearAnimationInstance.prototype['__destroy__'] = LinearAnimationInstance.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_LinearAnimationInstance___destroy___0(self);
};
// VoidPtr
/** @suppress {undefinedVars, duplicate} @this{Object} */function VoidPtr() { throw "cannot construct a VoidPtr, no constructor in IDL" }
VoidPtr.prototype = Object.create(WrapperObject.prototype);
VoidPtr.prototype.constructor = VoidPtr;
VoidPtr.prototype.__class__ = VoidPtr;
VoidPtr.__cache__ = {};
Module['VoidPtr'] = VoidPtr;

  VoidPtr.prototype['__destroy__'] = VoidPtr.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_VoidPtr___destroy___0(self);
};
// Alignment
/** @suppress {undefinedVars, duplicate} @this{Object} */function Alignment(x, y) {
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  this.ptr = _emscripten_bind_Alignment_Alignment_2(x, y);
  getCache(Alignment)[this.ptr] = this;
};;
Alignment.prototype = Object.create(WrapperObject.prototype);
Alignment.prototype.constructor = Alignment;
Alignment.prototype.__class__ = Alignment;
Alignment.__cache__ = {};
Module['Alignment'] = Alignment;

  Alignment.prototype['__destroy__'] = Alignment.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Alignment___destroy___0(self);
};
// AABB
/** @suppress {undefinedVars, duplicate} @this{Object} */function AABB(minX, minY, maxX, maxY) {
  if (minX && typeof minX === 'object') minX = minX.ptr;
  if (minY && typeof minY === 'object') minY = minY.ptr;
  if (maxX && typeof maxX === 'object') maxX = maxX.ptr;
  if (maxY && typeof maxY === 'object') maxY = maxY.ptr;
  this.ptr = _emscripten_bind_AABB_AABB_4(minX, minY, maxX, maxY);
  getCache(AABB)[this.ptr] = this;
};;
AABB.prototype = Object.create(WrapperObject.prototype);
AABB.prototype.constructor = AABB;
AABB.prototype.__class__ = AABB;
AABB.__cache__ = {};
Module['AABB'] = AABB;

AABB.prototype['width'] = AABB.prototype.width = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_AABB_width_0(self);
};;

  AABB.prototype['__destroy__'] = AABB.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_AABB___destroy___0(self);
};
// LinearAnimation
/** @suppress {undefinedVars, duplicate} @this{Object} */function LinearAnimation() { throw "cannot construct a LinearAnimation, no constructor in IDL" }
LinearAnimation.prototype = Object.create(WrapperObject.prototype);
LinearAnimation.prototype.constructor = LinearAnimation;
LinearAnimation.prototype.__class__ = LinearAnimation;
LinearAnimation.__cache__ = {};
Module['LinearAnimation'] = LinearAnimation;

LinearAnimation.prototype['duration'] = LinearAnimation.prototype.duration = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_LinearAnimation_duration_0(self);
};;

LinearAnimation.prototype['fps'] = LinearAnimation.prototype.fps = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_LinearAnimation_fps_0(self);
};;

LinearAnimation.prototype['apply'] = LinearAnimation.prototype.apply = /** @suppress {undefinedVars, duplicate} @this{Object} */function(artboard, time, mix) {
  var self = this.ptr;
  if (artboard && typeof artboard === 'object') artboard = artboard.ptr;
  if (time && typeof time === 'object') time = time.ptr;
  if (mix && typeof mix === 'object') mix = mix.ptr;
  _emscripten_bind_LinearAnimation_apply_3(self, artboard, time, mix);
};;

  LinearAnimation.prototype['__destroy__'] = LinearAnimation.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_LinearAnimation___destroy___0(self);
};
// LinearAnimationInstanceJS
/** @suppress {undefinedVars, duplicate} @this{Object} */function LinearAnimationInstanceJS(animation) {
  if (animation && typeof animation === 'object') animation = animation.ptr;
  this.ptr = _emscripten_bind_LinearAnimationInstanceJS_LinearAnimationInstanceJS_1(animation);
  getCache(LinearAnimationInstanceJS)[this.ptr] = this;
};;
LinearAnimationInstanceJS.prototype = Object.create(LinearAnimationInstance.prototype);
LinearAnimationInstanceJS.prototype.constructor = LinearAnimationInstanceJS;
LinearAnimationInstanceJS.prototype.__class__ = LinearAnimationInstanceJS;
LinearAnimationInstanceJS.__cache__ = {};
Module['LinearAnimationInstanceJS'] = LinearAnimationInstanceJS;

LinearAnimationInstanceJS.prototype['setTime'] = LinearAnimationInstanceJS.prototype.setTime = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_LinearAnimationInstanceJS_setTime_1(self, value);
};;

LinearAnimationInstanceJS.prototype['time'] = LinearAnimationInstanceJS.prototype.time = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_LinearAnimationInstanceJS_time_0(self);
};;

LinearAnimationInstanceJS.prototype['advance'] = LinearAnimationInstanceJS.prototype.advance = /** @suppress {undefinedVars, duplicate} @this{Object} */function(elapsedTime) {
  var self = this.ptr;
  if (elapsedTime && typeof elapsedTime === 'object') elapsedTime = elapsedTime.ptr;
  return !!(_emscripten_bind_LinearAnimationInstanceJS_advance_1(self, elapsedTime));
};;

LinearAnimationInstanceJS.prototype['apply'] = LinearAnimationInstanceJS.prototype.apply = /** @suppress {undefinedVars, duplicate} @this{Object} */function(artboard, mix) {
  var self = this.ptr;
  if (artboard && typeof artboard === 'object') artboard = artboard.ptr;
  if (mix && typeof mix === 'object') mix = mix.ptr;
  _emscripten_bind_LinearAnimationInstanceJS_apply_2(self, artboard, mix);
};;

  LinearAnimationInstanceJS.prototype['__destroy__'] = LinearAnimationInstanceJS.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_LinearAnimationInstanceJS___destroy___0(self);
};
// Mat2D
/** @suppress {undefinedVars, duplicate} @this{Object} */function Mat2D() { throw "cannot construct a Mat2D, no constructor in IDL" }
Mat2D.prototype = Object.create(WrapperObject.prototype);
Mat2D.prototype.constructor = Mat2D;
Mat2D.prototype.__class__ = Mat2D;
Mat2D.__cache__ = {};
Module['Mat2D'] = Mat2D;

Mat2D.prototype['xx'] = Mat2D.prototype.xx = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_xx_0(self);
};;

Mat2D.prototype['xy'] = Mat2D.prototype.xy = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_xy_0(self);
};;

Mat2D.prototype['yx'] = Mat2D.prototype.yx = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_yx_0(self);
};;

Mat2D.prototype['yy'] = Mat2D.prototype.yy = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_yy_0(self);
};;

Mat2D.prototype['tx'] = Mat2D.prototype.tx = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_tx_0(self);
};;

Mat2D.prototype['ty'] = Mat2D.prototype.ty = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Mat2D_ty_0(self);
};;

  Mat2D.prototype['__destroy__'] = Mat2D.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Mat2D___destroy___0(self);
};
// Artboard
/** @suppress {undefinedVars, duplicate} @this{Object} */function Artboard() { throw "cannot construct a Artboard, no constructor in IDL" }
Artboard.prototype = Object.create(WrapperObject.prototype);
Artboard.prototype.constructor = Artboard;
Artboard.prototype.__class__ = Artboard;
Artboard.__cache__ = {};
Module['Artboard'] = Artboard;

Artboard.prototype['advance'] = Artboard.prototype.advance = /** @suppress {undefinedVars, duplicate} @this{Object} */function(seconds) {
  var self = this.ptr;
  if (seconds && typeof seconds === 'object') seconds = seconds.ptr;
  return !!(_emscripten_bind_Artboard_advance_1(self, seconds));
};;

Artboard.prototype['draw'] = Artboard.prototype.draw = /** @suppress {undefinedVars, duplicate} @this{Object} */function(renderer) {
  var self = this.ptr;
  if (renderer && typeof renderer === 'object') renderer = renderer.ptr;
  _emscripten_bind_Artboard_draw_1(self, renderer);
};;

Artboard.prototype['bounds'] = Artboard.prototype.bounds = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_Artboard_bounds_0(self), AABB);
};;

  Artboard.prototype['__destroy__'] = Artboard.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Artboard___destroy___0(self);
};
// File
/** @suppress {undefinedVars, duplicate} @this{Object} */function File() { throw "cannot construct a File, no constructor in IDL" }
File.prototype = Object.create(WrapperObject.prototype);
File.prototype.constructor = File;
File.prototype.__class__ = File;
File.__cache__ = {};
Module['File'] = File;

File.prototype['artboard'] = File.prototype.artboard = /** @suppress {undefinedVars, duplicate} @this{Object} */function(name) {
  var self = this.ptr;
  ensureCache.prepare();
  if (name && typeof name === 'object') name = name.ptr;
  else name = ensureString(name);
  if (name === undefined) { return wrapPointer(_emscripten_bind_File_artboard_0(self), Artboard) }
  return wrapPointer(_emscripten_bind_File_artboard_1(self, name), Artboard);
};;

  File.prototype['__destroy__'] = File.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_File___destroy___0(self);
};
// RiveHelper
/** @suppress {undefinedVars, duplicate} @this{Object} */function RiveHelper() { throw "cannot construct a RiveHelper, no constructor in IDL" }
RiveHelper.prototype = Object.create(WrapperObject.prototype);
RiveHelper.prototype.constructor = RiveHelper;
RiveHelper.prototype.__class__ = RiveHelper;
RiveHelper.__cache__ = {};
Module['RiveHelper'] = RiveHelper;

RiveHelper.prototype['makeFile'] = RiveHelper.prototype.makeFile = /** @suppress {undefinedVars, duplicate} @this{Object} */function(bytes, numBytes) {
  var self = this.ptr;
  ensureCache.prepare();
  if (typeof bytes == 'object') { bytes = ensureInt8(bytes); }
  if (numBytes && typeof numBytes === 'object') numBytes = numBytes.ptr;
  return wrapPointer(_emscripten_bind_RiveHelper_makeFile_2(self, bytes, numBytes), File);
};;

RiveHelper.prototype['animation'] = RiveHelper.prototype.animation = /** @suppress {undefinedVars, duplicate} @this{Object} */function(artboard, name) {
  var self = this.ptr;
  ensureCache.prepare();
  if (artboard && typeof artboard === 'object') artboard = artboard.ptr;
  if (name && typeof name === 'object') name = name.ptr;
  else name = ensureString(name);
  return wrapPointer(_emscripten_bind_RiveHelper_animation_2(self, artboard, name), LinearAnimation);
};;

  RiveHelper.prototype['__destroy__'] = RiveHelper.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RiveHelper___destroy___0(self);
};
// RendererJS
/** @suppress {undefinedVars, duplicate} @this{Object} */function RendererJS() {
  this.ptr = _emscripten_bind_RendererJS_RendererJS_0();
  getCache(RendererJS)[this.ptr] = this;
};;
RendererJS.prototype = Object.create(Renderer.prototype);
RendererJS.prototype.constructor = RendererJS;
RendererJS.prototype.__class__ = RendererJS;
RendererJS.__cache__ = {};
Module['RendererJS'] = RendererJS;

RendererJS.prototype['save'] = RendererJS.prototype.save = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RendererJS_save_0(self);
};;

RendererJS.prototype['restore'] = RendererJS.prototype.restore = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RendererJS_restore_0(self);
};;

RendererJS.prototype['transform'] = RendererJS.prototype.transform = /** @suppress {undefinedVars, duplicate} @this{Object} */function(transform) {
  var self = this.ptr;
  if (transform && typeof transform === 'object') transform = transform.ptr;
  _emscripten_bind_RendererJS_transform_1(self, transform);
};;

RendererJS.prototype['drawPath'] = RendererJS.prototype.drawPath = /** @suppress {undefinedVars, duplicate} @this{Object} */function(path, paint) {
  var self = this.ptr;
  if (path && typeof path === 'object') path = path.ptr;
  if (paint && typeof paint === 'object') paint = paint.ptr;
  _emscripten_bind_RendererJS_drawPath_2(self, path, paint);
};;

RendererJS.prototype['clipPath'] = RendererJS.prototype.clipPath = /** @suppress {undefinedVars, duplicate} @this{Object} */function(path) {
  var self = this.ptr;
  if (path && typeof path === 'object') path = path.ptr;
  _emscripten_bind_RendererJS_clipPath_1(self, path);
};;

  RendererJS.prototype['__destroy__'] = RendererJS.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RendererJS___destroy___0(self);
};
// RenderPathJS
/** @suppress {undefinedVars, duplicate} @this{Object} */function RenderPathJS() {
  this.ptr = _emscripten_bind_RenderPathJS_RenderPathJS_0();
  getCache(RenderPathJS)[this.ptr] = this;
};;
RenderPathJS.prototype = Object.create(RenderPath.prototype);
RenderPathJS.prototype.constructor = RenderPathJS;
RenderPathJS.prototype.__class__ = RenderPathJS;
RenderPathJS.__cache__ = {};
Module['RenderPathJS'] = RenderPathJS;

RenderPathJS.prototype['reset'] = RenderPathJS.prototype.reset = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPathJS_reset_0(self);
};;

RenderPathJS.prototype['addPath'] = RenderPathJS.prototype.addPath = /** @suppress {undefinedVars, duplicate} @this{Object} */function(path, transform) {
  var self = this.ptr;
  if (path && typeof path === 'object') path = path.ptr;
  if (transform && typeof transform === 'object') transform = transform.ptr;
  _emscripten_bind_RenderPathJS_addPath_2(self, path, transform);
};;

RenderPathJS.prototype['moveTo'] = RenderPathJS.prototype.moveTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(x, y) {
  var self = this.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPathJS_moveTo_2(self, x, y);
};;

RenderPathJS.prototype['lineTo'] = RenderPathJS.prototype.lineTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(x, y) {
  var self = this.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPathJS_lineTo_2(self, x, y);
};;

RenderPathJS.prototype['cubicTo'] = RenderPathJS.prototype.cubicTo = /** @suppress {undefinedVars, duplicate} @this{Object} */function(ox, oy, ix, iy, x, y) {
  var self = this.ptr;
  if (ox && typeof ox === 'object') ox = ox.ptr;
  if (oy && typeof oy === 'object') oy = oy.ptr;
  if (ix && typeof ix === 'object') ix = ix.ptr;
  if (iy && typeof iy === 'object') iy = iy.ptr;
  if (x && typeof x === 'object') x = x.ptr;
  if (y && typeof y === 'object') y = y.ptr;
  _emscripten_bind_RenderPathJS_cubicTo_6(self, ox, oy, ix, iy, x, y);
};;

RenderPathJS.prototype['close'] = RenderPathJS.prototype.close = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPathJS_close_0(self);
};;

RenderPathJS.prototype['fillRule'] = RenderPathJS.prototype.fillRule = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPathJS_fillRule_1(self, value);
};;

  RenderPathJS.prototype['__destroy__'] = RenderPathJS.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPathJS___destroy___0(self);
};
// RenderPaintJS
/** @suppress {undefinedVars, duplicate} @this{Object} */function RenderPaintJS() {
  this.ptr = _emscripten_bind_RenderPaintJS_RenderPaintJS_0();
  getCache(RenderPaintJS)[this.ptr] = this;
};;
RenderPaintJS.prototype = Object.create(RenderPaint.prototype);
RenderPaintJS.prototype.constructor = RenderPaintJS;
RenderPaintJS.prototype.__class__ = RenderPaintJS;
RenderPaintJS.__cache__ = {};
Module['RenderPaintJS'] = RenderPaintJS;

RenderPaintJS.prototype['style'] = RenderPaintJS.prototype.style = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_style_1(self, value);
};;

RenderPaintJS.prototype['color'] = RenderPaintJS.prototype.color = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_color_1(self, value);
};;

RenderPaintJS.prototype['thickness'] = RenderPaintJS.prototype.thickness = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_thickness_1(self, value);
};;

RenderPaintJS.prototype['join'] = RenderPaintJS.prototype.join = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_join_1(self, value);
};;

RenderPaintJS.prototype['cap'] = RenderPaintJS.prototype.cap = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_cap_1(self, value);
};;

RenderPaintJS.prototype['blendMode'] = RenderPaintJS.prototype.blendMode = /** @suppress {undefinedVars, duplicate} @this{Object} */function(value) {
  var self = this.ptr;
  if (value && typeof value === 'object') value = value.ptr;
  _emscripten_bind_RenderPaintJS_blendMode_1(self, value);
};;

RenderPaintJS.prototype['linearGradient'] = RenderPaintJS.prototype.linearGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function(sx, sy, ex, ey) {
  var self = this.ptr;
  if (sx && typeof sx === 'object') sx = sx.ptr;
  if (sy && typeof sy === 'object') sy = sy.ptr;
  if (ex && typeof ex === 'object') ex = ex.ptr;
  if (ey && typeof ey === 'object') ey = ey.ptr;
  _emscripten_bind_RenderPaintJS_linearGradient_4(self, sx, sy, ex, ey);
};;

RenderPaintJS.prototype['radialGradient'] = RenderPaintJS.prototype.radialGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function(sx, sy, ex, ey) {
  var self = this.ptr;
  if (sx && typeof sx === 'object') sx = sx.ptr;
  if (sy && typeof sy === 'object') sy = sy.ptr;
  if (ex && typeof ex === 'object') ex = ex.ptr;
  if (ey && typeof ey === 'object') ey = ey.ptr;
  _emscripten_bind_RenderPaintJS_radialGradient_4(self, sx, sy, ex, ey);
};;

RenderPaintJS.prototype['addStop'] = RenderPaintJS.prototype.addStop = /** @suppress {undefinedVars, duplicate} @this{Object} */function(color, stop) {
  var self = this.ptr;
  if (color && typeof color === 'object') color = color.ptr;
  if (stop && typeof stop === 'object') stop = stop.ptr;
  _emscripten_bind_RenderPaintJS_addStop_2(self, color, stop);
};;

RenderPaintJS.prototype['completeGradient'] = RenderPaintJS.prototype.completeGradient = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPaintJS_completeGradient_0(self);
};;

  RenderPaintJS.prototype['__destroy__'] = RenderPaintJS.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RenderPaintJS___destroy___0(self);
};
(function() {
  function setupEnums() {
    

    // RenderPaintStyle

    Module['stroke'] = _emscripten_enum_RenderPaintStyle_stroke();

    Module['fill'] = _emscripten_enum_RenderPaintStyle_fill();

    

    // FillRule

    Module['nonZero'] = _emscripten_enum_FillRule_nonZero();

    Module['evenOdd'] = _emscripten_enum_FillRule_evenOdd();

    

    // StrokeJoin

    Module['miter'] = _emscripten_enum_StrokeJoin_miter();

    Module['round'] = _emscripten_enum_StrokeJoin_round();

    Module['bevel'] = _emscripten_enum_StrokeJoin_bevel();

    

    // StrokeCap

    Module['butt'] = _emscripten_enum_StrokeCap_butt();

    Module['round'] = _emscripten_enum_StrokeCap_round();

    Module['square'] = _emscripten_enum_StrokeCap_square();

    

    // BlendMode

    Module['srcOver'] = _emscripten_enum_BlendMode_srcOver();

    Module['screen'] = _emscripten_enum_BlendMode_screen();

    Module['overlay'] = _emscripten_enum_BlendMode_overlay();

    Module['darken'] = _emscripten_enum_BlendMode_darken();

    Module['lighten'] = _emscripten_enum_BlendMode_lighten();

    Module['colorDodge'] = _emscripten_enum_BlendMode_colorDodge();

    Module['colorBurn'] = _emscripten_enum_BlendMode_colorBurn();

    Module['hardLight'] = _emscripten_enum_BlendMode_hardLight();

    Module['softLight'] = _emscripten_enum_BlendMode_softLight();

    Module['difference'] = _emscripten_enum_BlendMode_difference();

    Module['exclusion'] = _emscripten_enum_BlendMode_exclusion();

    Module['multiply'] = _emscripten_enum_BlendMode_multiply();

    Module['hue'] = _emscripten_enum_BlendMode_hue();

    Module['saturation'] = _emscripten_enum_BlendMode_saturation();

    Module['color'] = _emscripten_enum_BlendMode_color();

    Module['luminosity'] = _emscripten_enum_BlendMode_luminosity();

    

    // Fit

    Module['fill'] = _emscripten_enum_Fit_fill();

    Module['contain'] = _emscripten_enum_Fit_contain();

    Module['cover'] = _emscripten_enum_Fit_cover();

    Module['fitWidth'] = _emscripten_enum_Fit_fitWidth();

    Module['fitHeight'] = _emscripten_enum_Fit_fitHeight();

    Module['none'] = _emscripten_enum_Fit_none();

    Module['scaleDown'] = _emscripten_enum_Fit_scaleDown();

  }
  if (runtimeInitialized) setupEnums();
  else addOnPreMain(setupEnums);
})();
