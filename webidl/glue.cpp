
#include <emscripten.h>

class RendererJS : public Renderer {
public:
  void save()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('save')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::save.';
      self['save']();
    }, (int)this);
  }
  void restore()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('restore')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::restore.';
      self['restore']();
    }, (int)this);
  }
  void transform(const Mat2D& transform)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('transform')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::transform.';
      self['transform']($1);
    }, (int)this, &transform);
  }
  void drawPath(RenderPath* path, RenderPaint* paint)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('drawPath')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::drawPath.';
      self['drawPath']($1,$2);
    }, (int)this, (int)path, (int)paint);
  }
  void clipPath(RenderPath* path)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('clipPath')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::clipPath.';
      self['clipPath']($1);
    }, (int)this, (int)path);
  }
  void __destroy__()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RendererJS'])[$0];
      // if (!self.hasOwnProperty('__destroy__')) throw 'a JSImplementation must implement all functions, you forgot RendererJS::__destroy__.';
      self['__destroy__']();
    }, (int)this);
  }
};

class RenderPathJS : public RenderPath {
public:
  void reset()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('reset')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::reset.';
      self['reset']();
    }, (int)this);
  }
  void addPath(CommandPath* path, const Mat2D& transform)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('addPath')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::addPath.';
      self['addPath']($1,$2);
    }, (int)this, (int)path, &transform);
  }
  void moveTo(float x, float y)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('moveTo')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::moveTo.';
      self['moveTo']($1,$2);
    }, (int)this, x, y);
  }
  void lineTo(float x, float y)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('lineTo')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::lineTo.';
      self['lineTo']($1,$2);
    }, (int)this, x, y);
  }
  void cubicTo(float ox, float oy, float ix, float iy, float x, float y)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('cubicTo')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::cubicTo.';
      self['cubicTo']($1,$2,$3,$4,$5,$6);
    }, (int)this, ox, oy, ix, iy, x, y);
  }
  void close()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('close')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::close.';
      self['close']();
    }, (int)this);
  }
  void fillRule(FillRule value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('fillRule')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::fillRule.';
      self['fillRule']($1);
    }, (int)this, value);
  }
  void __destroy__()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPathJS'])[$0];
      // if (!self.hasOwnProperty('__destroy__')) throw 'a JSImplementation must implement all functions, you forgot RenderPathJS::__destroy__.';
      self['__destroy__']();
    }, (int)this);
  }
};

class RenderPaintJS : public RenderPaint {
public:
  void style(RenderPaintStyle value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('style')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::style.';
      self['style']($1);
    }, (int)this, value);
  }
  void color(unsigned int value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('color')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::color.';
      self['color']($1);
    }, (int)this, value);
  }
  void thickness(float value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('thickness')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::thickness.';
      self['thickness']($1);
    }, (int)this, value);
  }
  void join(StrokeJoin value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('join')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::join.';
      self['join']($1);
    }, (int)this, value);
  }
  void cap(StrokeCap value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('cap')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::cap.';
      self['cap']($1);
    }, (int)this, value);
  }
  void blendMode(BlendMode value)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('blendMode')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::blendMode.';
      self['blendMode']($1);
    }, (int)this, value);
  }
  void linearGradient(float sx, float sy, float ex, float ey)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('linearGradient')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::linearGradient.';
      self['linearGradient']($1,$2,$3,$4);
    }, (int)this, sx, sy, ex, ey);
  }
  void radialGradient(float sx, float sy, float ex, float ey)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('radialGradient')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::radialGradient.';
      self['radialGradient']($1,$2,$3,$4);
    }, (int)this, sx, sy, ex, ey);
  }
  void addStop(unsigned int color, float stop)  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('addStop')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::addStop.';
      self['addStop']($1,$2);
    }, (int)this, color, stop);
  }
  void completeGradient()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('completeGradient')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::completeGradient.';
      self['completeGradient']();
    }, (int)this);
  }
  void __destroy__()  {
    EM_ASM_INT({
      var self = Module['getCache'](Module['RenderPaintJS'])[$0];
      // if (!self.hasOwnProperty('__destroy__')) throw 'a JSImplementation must implement all functions, you forgot RenderPaintJS::__destroy__.';
      self['__destroy__']();
    }, (int)this);
  }
};

extern "C" {

// Not using size_t for array indices as the values used by the javascript code are signed.

EM_JS(void, array_bounds_check_error, (size_t idx, size_t size), {
  throw 'Array index ' + idx + ' out of bounds: [0,' + size + ')';
});

void array_bounds_check(const int array_size, const int array_idx) {
  if (array_idx < 0 || array_idx >= array_size) {
    array_bounds_check_error(array_idx, array_size);
  }
}

// CommandPath

void EMSCRIPTEN_KEEPALIVE emscripten_bind_CommandPath___destroy___0(CommandPath* self) {
  delete self;
}

// Renderer

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Renderer_save_0(Renderer* self) {
  self->save();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Renderer_restore_0(Renderer* self) {
  self->restore();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Renderer_align_4(Renderer* self, Fit fit, Alignment* alignment, AABB* frame, AABB* content) {
  self->align(fit, *alignment, *frame, *content);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Renderer___destroy___0(Renderer* self) {
  delete self;
}

// RenderPath

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_reset_0(RenderPath* self) {
  self->reset();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_addPath_2(RenderPath* self, CommandPath* path, const Mat2D* transform) {
  self->addPath(path, *transform);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_moveTo_2(RenderPath* self, float x, float y) {
  self->moveTo(x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_lineTo_2(RenderPath* self, float x, float y) {
  self->lineTo(x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_cubicTo_6(RenderPath* self, float ox, float oy, float ix, float iy, float x, float y) {
  self->cubicTo(ox, oy, ix, iy, x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_close_0(RenderPath* self) {
  self->close();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath_fillRule_1(RenderPath* self, FillRule value) {
  self->fillRule(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPath___destroy___0(RenderPath* self) {
  delete self;
}

// RenderPaint

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_style_1(RenderPaint* self, RenderPaintStyle value) {
  self->style(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_color_1(RenderPaint* self, unsigned int value) {
  self->color(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_thickness_1(RenderPaint* self, float value) {
  self->thickness(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_join_1(RenderPaint* self, StrokeJoin value) {
  self->join(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_cap_1(RenderPaint* self, StrokeCap value) {
  self->cap(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_blendMode_1(RenderPaint* self, BlendMode value) {
  self->blendMode(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_linearGradient_4(RenderPaint* self, float sx, float sy, float ex, float ey) {
  self->linearGradient(sx, sy, ex, ey);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_radialGradient_4(RenderPaint* self, float sx, float sy, float ex, float ey) {
  self->radialGradient(sx, sy, ex, ey);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_addStop_2(RenderPaint* self, unsigned int color, float stop) {
  self->addStop(color, stop);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint_completeGradient_0(RenderPaint* self) {
  self->completeGradient();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaint___destroy___0(RenderPaint* self) {
  delete self;
}

// LinearAnimationInstance

float EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstance_time_0(LinearAnimationInstance* self) {
  return self->time();
}

bool EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstance_advance_1(LinearAnimationInstance* self, float elapsedTime) {
  return self->advance(elapsedTime);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstance_apply_2(LinearAnimationInstance* self, Artboard* artboard, float mix) {
  self->apply(artboard, mix);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstance___destroy___0(LinearAnimationInstance* self) {
  delete self;
}

// VoidPtr

void EMSCRIPTEN_KEEPALIVE emscripten_bind_VoidPtr___destroy___0(void** self) {
  delete self;
}

// Alignment

Alignment* EMSCRIPTEN_KEEPALIVE emscripten_bind_Alignment_Alignment_2(double x, double y) {
  return new Alignment(x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Alignment___destroy___0(Alignment* self) {
  delete self;
}

// AABB

AABB* EMSCRIPTEN_KEEPALIVE emscripten_bind_AABB_AABB_4(float minX, float minY, float maxX, float maxY) {
  return new AABB(minX, minY, maxX, maxY);
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_AABB_width_0(AABB* self) {
  return self->width();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_AABB___destroy___0(AABB* self) {
  delete self;
}

// LinearAnimation

int EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimation_duration_0(LinearAnimation* self) {
  return self->duration();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimation_fps_0(LinearAnimation* self) {
  return self->fps();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimation_apply_3(LinearAnimation* self, Artboard* artboard, float time, float mix) {
  self->apply(artboard, time, mix);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimation___destroy___0(LinearAnimation* self) {
  delete self;
}

// LinearAnimationInstanceJS

LinearAnimationInstanceJS* EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS_LinearAnimationInstanceJS_1(LinearAnimation* animation) {
  return new LinearAnimationInstanceJS(animation);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS_setTime_1(LinearAnimationInstanceJS* self, float value) {
  self->setTime(value);
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS_time_0(LinearAnimationInstanceJS* self) {
  return self->time();
}

bool EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS_advance_1(LinearAnimationInstanceJS* self, float elapsedTime) {
  return self->advance(elapsedTime);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS_apply_2(LinearAnimationInstanceJS* self, Artboard* artboard, float mix) {
  self->apply(artboard, mix);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_LinearAnimationInstanceJS___destroy___0(LinearAnimationInstanceJS* self) {
  delete self;
}

// Mat2D

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_xx_0(Mat2D* self) {
  return self->xx();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_xy_0(Mat2D* self) {
  return self->xy();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_yx_0(Mat2D* self) {
  return self->yx();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_yy_0(Mat2D* self) {
  return self->yy();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_tx_0(Mat2D* self) {
  return self->tx();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D_ty_0(Mat2D* self) {
  return self->ty();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Mat2D___destroy___0(Mat2D* self) {
  delete self;
}

// Artboard

bool EMSCRIPTEN_KEEPALIVE emscripten_bind_Artboard_advance_1(Artboard* self, double seconds) {
  return self->advance(seconds);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Artboard_draw_1(Artboard* self, Renderer* renderer) {
  self->draw(renderer);
}

AABB* EMSCRIPTEN_KEEPALIVE emscripten_bind_Artboard_bounds_0(Artboard* self) {
  static AABB temp;
  return (temp = self->bounds(), &temp);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Artboard___destroy___0(Artboard* self) {
  delete self;
}

// File

Artboard* EMSCRIPTEN_KEEPALIVE emscripten_bind_File_artboard_0(File* self) {
  return self->artboard();
}

Artboard* EMSCRIPTEN_KEEPALIVE emscripten_bind_File_artboard_1(File* self, char* name) {
  return self->artboard(name);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_File___destroy___0(File* self) {
  delete self;
}

// TransformComponent

float EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_scaleX_0(TransformComponent* self) {
  return self->scaleX();
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_scaleY_0(TransformComponent* self) {
  return self->scaleY();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_setScaleX_1(TransformComponent* self, float value) {
  self->scaleX(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_setScaleY_1(TransformComponent* self, float value) {
  self->scaleY(value);
}

float EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_rotation_0(TransformComponent* self) {
  return self->rotation();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent_setRotation_1(TransformComponent* self, float value) {
  self->rotation(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_TransformComponent___destroy___0(TransformComponent* self) {
  delete self;
}

// RiveHelper

File* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiveHelper_makeFile_2(RiveHelper* self, char* bytes, unsigned int numBytes) {
  return self->makeFile(bytes, numBytes);
}

LinearAnimation* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiveHelper_animation_2(RiveHelper* self, Artboard* artboard, char* name) {
  return self->animation(artboard, name);
}

TransformComponent* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiveHelper_transformComponent_2(RiveHelper* self, Artboard* artboard, char* name) {
  return self->transformComponent(artboard, name);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiveHelper___destroy___0(RiveHelper* self) {
  delete self;
}

// RendererJS

RendererJS* EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_RendererJS_0() {
  return new RendererJS();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_save_0(RendererJS* self) {
  self->save();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_restore_0(RendererJS* self) {
  self->restore();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_transform_1(RendererJS* self, const Mat2D* transform) {
  self->transform(*transform);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_drawPath_2(RendererJS* self, RenderPath* path, RenderPaint* paint) {
  self->drawPath(path, paint);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS_clipPath_1(RendererJS* self, RenderPath* path) {
  self->clipPath(path);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RendererJS___destroy___0(RendererJS* self) {
  delete self;
}

// RenderPathJS

RenderPathJS* EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_RenderPathJS_0() {
  return new RenderPathJS();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_reset_0(RenderPathJS* self) {
  self->reset();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_addPath_2(RenderPathJS* self, CommandPath* path, const Mat2D* transform) {
  self->addPath(path, *transform);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_moveTo_2(RenderPathJS* self, float x, float y) {
  self->moveTo(x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_lineTo_2(RenderPathJS* self, float x, float y) {
  self->lineTo(x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_cubicTo_6(RenderPathJS* self, float ox, float oy, float ix, float iy, float x, float y) {
  self->cubicTo(ox, oy, ix, iy, x, y);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_close_0(RenderPathJS* self) {
  self->close();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS_fillRule_1(RenderPathJS* self, FillRule value) {
  self->fillRule(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPathJS___destroy___0(RenderPathJS* self) {
  delete self;
}

// RenderPaintJS

RenderPaintJS* EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_RenderPaintJS_0() {
  return new RenderPaintJS();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_style_1(RenderPaintJS* self, RenderPaintStyle value) {
  self->style(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_color_1(RenderPaintJS* self, unsigned int value) {
  self->color(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_thickness_1(RenderPaintJS* self, float value) {
  self->thickness(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_join_1(RenderPaintJS* self, StrokeJoin value) {
  self->join(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_cap_1(RenderPaintJS* self, StrokeCap value) {
  self->cap(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_blendMode_1(RenderPaintJS* self, BlendMode value) {
  self->blendMode(value);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_linearGradient_4(RenderPaintJS* self, float sx, float sy, float ex, float ey) {
  self->linearGradient(sx, sy, ex, ey);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_radialGradient_4(RenderPaintJS* self, float sx, float sy, float ex, float ey) {
  self->radialGradient(sx, sy, ex, ey);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_addStop_2(RenderPaintJS* self, unsigned int color, float stop) {
  self->addStop(color, stop);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS_completeGradient_0(RenderPaintJS* self) {
  self->completeGradient();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RenderPaintJS___destroy___0(RenderPaintJS* self) {
  delete self;
}

// RenderPaintStyle
RenderPaintStyle EMSCRIPTEN_KEEPALIVE emscripten_enum_RenderPaintStyle_stroke() {
  return RenderPaintStyle::stroke;
}
RenderPaintStyle EMSCRIPTEN_KEEPALIVE emscripten_enum_RenderPaintStyle_fill() {
  return RenderPaintStyle::fill;
}

// FillRule
FillRule EMSCRIPTEN_KEEPALIVE emscripten_enum_FillRule_nonZero() {
  return FillRule::nonZero;
}
FillRule EMSCRIPTEN_KEEPALIVE emscripten_enum_FillRule_evenOdd() {
  return FillRule::evenOdd;
}

// StrokeJoin
StrokeJoin EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeJoin_miter() {
  return StrokeJoin::miter;
}
StrokeJoin EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeJoin_round() {
  return StrokeJoin::round;
}
StrokeJoin EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeJoin_bevel() {
  return StrokeJoin::bevel;
}

// StrokeCap
StrokeCap EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeCap_butt() {
  return StrokeCap::butt;
}
StrokeCap EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeCap_round() {
  return StrokeCap::round;
}
StrokeCap EMSCRIPTEN_KEEPALIVE emscripten_enum_StrokeCap_square() {
  return StrokeCap::square;
}

// BlendMode
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_srcOver() {
  return BlendMode::srcOver;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_screen() {
  return BlendMode::screen;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_overlay() {
  return BlendMode::overlay;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_darken() {
  return BlendMode::darken;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_lighten() {
  return BlendMode::lighten;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_colorDodge() {
  return BlendMode::colorDodge;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_colorBurn() {
  return BlendMode::colorBurn;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_hardLight() {
  return BlendMode::hardLight;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_softLight() {
  return BlendMode::softLight;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_difference() {
  return BlendMode::difference;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_exclusion() {
  return BlendMode::exclusion;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_multiply() {
  return BlendMode::multiply;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_hue() {
  return BlendMode::hue;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_saturation() {
  return BlendMode::saturation;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_color() {
  return BlendMode::color;
}
BlendMode EMSCRIPTEN_KEEPALIVE emscripten_enum_BlendMode_luminosity() {
  return BlendMode::luminosity;
}

// Fit
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_fill() {
  return Fit::fill;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_contain() {
  return Fit::contain;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_cover() {
  return Fit::cover;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_fitWidth() {
  return Fit::fitWidth;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_fitHeight() {
  return Fit::fitHeight;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_none() {
  return Fit::none;
}
Fit EMSCRIPTEN_KEEPALIVE emscripten_enum_Fit_scaleDown() {
  return Fit::scaleDown;
}

}

