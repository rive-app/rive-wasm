#ifdef RIVE_SKIA_RENDERER
#include "GrDirectContext.h"
#include "SkSurface.h"
#include "gl/GrGLInterface.h"
#include "src/core/SkIPoint16.h"
#include "src/gpu/GrDynamicRectanizer.h"
#else
#include "skia_imports/src/core/SkIPoint16.h"
#include "skia_imports/src/gpu/GrDynamicRectanizer.h"
#endif
#include "rive/animation/animation.hpp"
#include "rive/animation/animation_state.hpp"
#include "rive/animation/any_state.hpp"
#include "rive/animation/entry_state.hpp"
#include "rive/animation/exit_state.hpp"
#include "rive/animation/linear_animation.hpp"
#include "rive/animation/linear_animation_instance.hpp"
#include "rive/animation/state_machine_bool.hpp"
#include "rive/animation/state_machine_input_instance.hpp"
#include "rive/animation/state_machine_instance.hpp"
#include "rive/animation/state_machine_number.hpp"
#include "rive/animation/state_machine_trigger.hpp"
#include "rive/artboard.hpp"
#include "rive/bones/bone.hpp"
#include "rive/bones/root_bone.hpp"
#include "rive/component.hpp"
#include "rive/constraints/constraint.hpp"
#include "rive/core.hpp"
#include "rive/core/binary_reader.hpp"
#include "rive/file.hpp"
#include "rive/layout.hpp"
#include "rive/math/mat2d.hpp"
#include "rive/node.hpp"
#include "rive/renderer.hpp"
#include "rive/shapes/cubic_vertex.hpp"
#include "rive/shapes/path.hpp"
#include "rive/transform_component.hpp"
#include "skia_imports/include/private/SkVx.h"
#ifdef RIVE_SKIA_RENDERER
#include "skia_renderer.hpp"
#include <GLES3/gl3.h>
#endif
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <vector>

using namespace emscripten;

// We had to do this because binding the core class const defined types directly
// caused wasm-ld linker issues. See
// https://www.mail-archive.com/emscripten-discuss@googlegroups.com/msg09132.html
// for other people suffering our same pains.
const uint16_t stateMachineBoolTypeKey = rive::StateMachineBoolBase::typeKey;

const uint16_t stateMachineNumberTypeKey =
    rive::StateMachineNumberBase::typeKey;

const uint16_t stateMachineTriggerTypeKey =
    rive::StateMachineTriggerBase::typeKey;

#ifndef RIVE_SKIA_RENDERER

class CanvasBuffer : public rive::RenderBuffer {
  const size_t m_ElemSize;
  void *m_Buffer;

public:
  CanvasBuffer(const void *src, size_t count, size_t elemSize)
      : RenderBuffer(count), m_ElemSize(elemSize) {
    size_t bytes = count * elemSize;
    m_Buffer = malloc(bytes);
    memcpy(m_Buffer, src, bytes);
  }

  ~CanvasBuffer() { free(m_Buffer); }

  const float *f32s() const {
    assert(m_ElemSize == sizeof(float));
    return static_cast<const float *>(m_Buffer);
  }

  const uint16_t *u16s() const {
    assert(m_ElemSize == sizeof(uint16_t));
    return static_cast<const uint16_t *>(m_Buffer);
  }

  static const CanvasBuffer *Cast(const rive::RenderBuffer *buffer) {
    return reinterpret_cast<const CanvasBuffer *>(buffer);
  }
};

// Computes the post-transform bounding box of an array of points in high performance WASM SIMD.
static std::array<float, 4> bbox(const float m[6], const float* vertexData, int numVertexFloats) {
  using float2 = skvx::Vec<2, float>;
  using float4 = skvx::Vec<4, float>;

  assert(numVertexFloats > 0);
  assert(numVertexFloats % 2 == 0);  // numVertexFloats must be even -- 2 floats per vertex.

  float4 scale = {m[0], m[3], m[0], m[3]};
  float4 skew = {m[2], m[1], m[2], m[1]};
  float2 translate = {m[4], m[5]};

  // Compute two partial bounding boxes in parallel lanes of float4. Defer the translation until
  // after min/max reduction.
  float4 partialTopLefts, partialBotRights;
  float4 v0;
  int i;
  // TODO: could 128-bit alignment on loads impact our speed in WASM?
  if (!(numVertexFloats & 3)) {
    // Even number of vertices -- number of floats is divisible by 4. Load 2 vertices initially.
    v0 = float4::Load(vertexData);
    i = 4;
  } else {
    // Odd number of vertices. Load 1 vertex initially so the rest will be divisible by 4.
    v0 = float2::Load(vertexData).xyxy();
    i = 2;
  }
  partialTopLefts = partialBotRights = v0 * scale + v0.yxwz() * skew;
  // Crunch the remaining vertices in float4 SIMD.
  for (; i < numVertexFloats; i += 4) {
    float4 v = float4::Load(vertexData + i);
    v = v * scale + v.yxwz() * skew;
    partialTopLefts = min(partialTopLefts, v);
    partialBotRights = max(partialBotRights, v);
  }
  assert(i == numVertexFloats);

  // Merge the two parallel bounding boxes into one complete, translated, integer bounding box.
  float2 topLeft = floor(min(partialTopLefts.lo, partialTopLefts.hi) + translate);
  float2 botRight = ceil(max(partialBotRights.lo, partialBotRights.hi) + translate);
  return {topLeft.x(), topLeft.y(), botRight.x(), botRight.y()};
}

class RendererWrapper : public wrapper<rive::Renderer> {
public:
  EMSCRIPTEN_WRAPPER(RendererWrapper);

  void save() override { call<void>("save"); }

  void restore() override { call<void>("restore"); }

  void transform(const rive::Mat2D &transform) override {
    call<void>("transform", transform);
  }

  void drawPath(rive::RenderPath *path, rive::RenderPaint *paint) override {
    call<void>("_drawPath", path, paint);
  }

  void clipPath(rive::RenderPath *path) override {
    call<void>("_clipPath", path);
  }

  void drawImage(const rive::RenderImage *image, rive::BlendMode value,
                 float opacity) override {
    call<void>("_drawImage", image, value, opacity);
  }

  void drawImageMesh(const rive::RenderImage *image,
                     rive::rcp<rive::RenderBuffer> vertices_f32,
                     rive::rcp<rive::RenderBuffer> uvCoords_f32,
                     rive::rcp<rive::RenderBuffer> indices_u16,
                     rive::BlendMode value, float opacity) override {

    auto vtx = CanvasBuffer::Cast(vertices_f32.get());
    auto uv = CanvasBuffer::Cast(uvCoords_f32.get());
    auto indices = CanvasBuffer::Cast(indices_u16.get());

    assert(uv->count() == vtx->count());
    if (!vtx->count() || !indices->count()) {
        return;
    }

    emscripten::val uvJS{emscripten::typed_memory_view(uv->count(), uv->f32s())};
    emscripten::val vtxJS{emscripten::typed_memory_view(vtx->count(), vtx->f32s())};
    emscripten::val indicesJS{emscripten::typed_memory_view(indices->count(), indices->u16s())};

    // Compute the mesh's bounding box.
    float m[6];
    emscripten::val mJS{emscripten::typed_memory_view(6, m)};
    call<void>("_getMatrix", mJS);
    auto [l, t, r, b] = bbox(m, vtx->f32s(), vtx->count());

    call<void>("_drawImageMesh", image, value, opacity, vtxJS, uvJS, indicesJS, l, t, r, b);
  }
};

class RenderPathWrapper : public wrapper<rive::RenderPath> {
public:
  EMSCRIPTEN_WRAPPER(RenderPathWrapper);

  void reset() override { call<void>("reset"); }

  void addRenderPath(rive::RenderPath *path,
                     const rive::Mat2D &transform) override {
    call<void>("addPath", path, transform);
  }
  void fillRule(rive::FillRule value) override {
    call<void>("fillRule", value);
  }

  void moveTo(float x, float y) override { call<void>("moveTo", x, y); }
  void lineTo(float x, float y) override { call<void>("lineTo", x, y); }
  void cubicTo(float ox, float oy, float ix, float iy, float x,
               float y) override {
    call<void>("cubicTo", ox, oy, ix, iy, x, y);
  }
  void close() override { call<void>("close"); }
};

class RenderPaintWrapper;
class GradientShader : public rive::RenderShader {
private:
  std::vector<float> m_Stops;
  std::vector<rive::ColorInt> m_Colors;

public:
  GradientShader(const rive::ColorInt colors[], const float stops[], int count)
      : m_Stops(stops, stops + count), m_Colors(colors, colors + count) {}

  void passStopsToJS(const RenderPaintWrapper &wrapper);

  virtual void passToJS(const RenderPaintWrapper &wrapper) = 0;
};

class LinearGradientShader : public GradientShader {
private:
  float m_StartX;
  float m_StartY;
  float m_EndX;
  float m_EndY;

public:
  LinearGradientShader(const rive::ColorInt colors[], const float stops[],
                       int count, float sx, float sy, float ex, float ey)
      : GradientShader(colors, stops, count), m_StartX(sx), m_StartY(sy),
        m_EndX(ex), m_EndY(ey) {}

  void passToJS(const RenderPaintWrapper &wrapper) override;
};

class RadialGradientShader : public GradientShader {
private:
  float m_CenterX;
  float m_CenterY;
  float m_Radius;

public:
  RadialGradientShader(const rive::ColorInt colors[], const float stops[],
                       int count, float cx, float cy, float r)
      : GradientShader(colors, stops, count), m_CenterX(cx), m_CenterY(cy),
        m_Radius(r) {}

  void passToJS(const RenderPaintWrapper &wrapper) override;
};

class RenderPaintWrapper : public wrapper<rive::RenderPaint> {
public:
  EMSCRIPTEN_WRAPPER(RenderPaintWrapper);

  void color(unsigned int value) override { call<void>("color", value); }
  void thickness(float value) override { call<void>("thickness", value); }
  void join(rive::StrokeJoin value) override { call<void>("join", value); }
  void cap(rive::StrokeCap value) override { call<void>("cap", value); }
  void blendMode(rive::BlendMode value) override {
    call<void>("blendMode", value);
  }

  void style(rive::RenderPaintStyle value) override {
    call<void>("style", value);
  }

  void shader(rive::rcp<rive::RenderShader> shader) override {
    static_cast<GradientShader *>(shader.get())->passToJS(*this);
  }
};

void GradientShader::passStopsToJS(const RenderPaintWrapper &wrapper) {
  // Consider passing in a bulk op encoding into a single array.
  for (std::size_t i = 0; i < m_Stops.size(); i++) {
    wrapper.call<void>("addStop", m_Colors[i], m_Stops[i]);
  }
}

void LinearGradientShader::passToJS(const RenderPaintWrapper &wrapper) {
  wrapper.call<void>("linearGradient", m_StartX, m_StartY, m_EndX, m_EndY);
  passStopsToJS(wrapper);
}

void RadialGradientShader::passToJS(const RenderPaintWrapper &wrapper) {
  wrapper.call<void>("radialGradient", m_CenterX, m_CenterY,
                     m_CenterX + m_Radius, m_CenterY);
  passStopsToJS(wrapper);
}

class RenderImageWrapper : public wrapper<rive::RenderImage> {
public:
  EMSCRIPTEN_WRAPPER(RenderImageWrapper);

  bool decode(rive::Span<const uint8_t> bytes) override {
    emscripten::val byteArray = emscripten::val(
        emscripten::typed_memory_view(bytes.size(), bytes.data()));
    return call<bool>("decode", byteArray);
  }
  void size(int width, int height) {
    m_Width = width;
    m_Height = height;
  }

  rive::rcp<rive::RenderShader>
  makeShader(rive::RenderTileMode tx, rive::RenderTileMode ty,
             const rive::Mat2D *localMatrix) const override {
    return nullptr;
  }
};
namespace rive {

template <typename T> rcp<RenderBuffer> make_buffer(Span<T> span) {
  return rcp<RenderBuffer>(
      new CanvasBuffer(span.data(), span.size(), sizeof(T)));
}

rcp<RenderBuffer> makeBufferU16(Span<const uint16_t> data) {
  return make_buffer(data);
}
rcp<RenderBuffer> makeBufferU32(Span<const uint32_t> data) {
  return make_buffer(data);
}
rcp<RenderBuffer> makeBufferF32(Span<const float> data) {
  return make_buffer(data);
}
rcp<RenderShader> makeLinearGradient(float sx, float sy, float ex, float ey,
                                     const ColorInt colors[], // [count]
                                     const float stops[],     // [count]
                                     int count, RenderTileMode,
                                     const Mat2D *localMatrix) {
  return rcp<RenderShader>(
      new LinearGradientShader(colors, stops, count, sx, sy, ex, ey));
}

rcp<RenderShader> makeRadialGradient(float cx, float cy, float radius,
                                     const ColorInt colors[], // [count]
                                     const float stops[],     // [count]
                                     int count, RenderTileMode,
                                     const Mat2D *localMatrix) {
  return rcp<RenderShader>(
      new RadialGradientShader(colors, stops, count, cx, cy, radius));
}

RenderPaint *makeRenderPaint() {
  val renderPaint =
      val::module_property("renderFactory").call<val>("makeRenderPaint");
  return renderPaint.as<RenderPaint *>(allow_raw_pointers());
}

RenderPath *makeRenderPath() {
  val renderPath =
      val::module_property("renderFactory").call<val>("makeRenderPath");
  return renderPath.as<RenderPath *>(allow_raw_pointers());
}

RenderImage *makeRenderImage() {
  val renderImage =
      val::module_property("renderFactory").call<val>("makeRenderImage");
  return renderImage.as<RenderImage *>(allow_raw_pointers());
}
} // namespace rive
#endif

rive::File *load(emscripten::val byteArray) {
  std::vector<unsigned char> rv;

  const auto l = byteArray["byteLength"].as<unsigned>();
  rv.resize(l);

  emscripten::val memoryView{emscripten::typed_memory_view(l, rv.data())};
  memoryView.call<void>("set", byteArray);
  return rive::File::import(rive::toSpan(rv)).release();
}

#ifdef RIVE_SKIA_RENDERER
class WebGLSkiaRenderer : public rive::SkiaRenderer {
private:
  sk_sp<GrDirectContext> m_Context;
  SkSurface *m_Surface;
  std::vector<std::unique_ptr<rive::RenderPath>> m_SavedClipRects;

public:
  WebGLSkiaRenderer(sk_sp<GrDirectContext> context, int width, int height)
      : m_Context(context),
        m_Surface(makeSurface(context, width, height)), rive::SkiaRenderer(
                                                            nullptr) {
    m_Canvas = m_Surface->getCanvas();
  }

  ~WebGLSkiaRenderer() { delete m_Surface; }

  void resize(int width, int height) {
    delete m_Surface;
    m_Surface = makeSurface(m_Context, width, height);
    m_Canvas = m_Surface->getCanvas();
  }

  void clear() { m_Canvas->clear(0); }

  void flush() {
    m_Context->flush();
    m_SavedClipRects.clear();
  }

  SkSurface *makeSurface(sk_sp<GrDirectContext> context, int width,
                         int height) {
    int numSamples, numStencilBits;
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glGetIntegerv(GL_SAMPLES, &numSamples);
    glGetIntegerv(GL_STENCIL_BITS, &numStencilBits);
    m_Context->resetContext(kRenderTarget_GrGLBackendState);

    GrGLFramebufferInfo framebufferInfo;
    framebufferInfo.fFBOID = 0;
    framebufferInfo.fFormat = GL_RGBA8;

    GrBackendRenderTarget backendRenderTarget(width, height, numSamples,
                                              numStencilBits, framebufferInfo);

    return SkSurface::MakeFromBackendRenderTarget(
               context.get(), backendRenderTarget, kBottomLeft_GrSurfaceOrigin,
               kRGBA_8888_SkColorType, nullptr, nullptr)
        .release();
  }

  void saveClipRect(float l, float t, float r, float b) {
    save();
    rive::RenderPath* rect = m_SavedClipRects.emplace_back(rive::makeRenderPath()).get();
    rect->moveTo(l, t);
    rect->lineTo(r, t);
    rect->lineTo(r, b);
    rect->lineTo(l, b);
    rect->close();
    clipPath(rect);
  }

  void restoreClipRect() {
    restore();
  }
};

WebGLSkiaRenderer *makeSkiaRenderer(int width, int height) {
  GrContextOptions options;
  sk_sp<GrDirectContext> context = GrDirectContext::MakeGL(nullptr, options);
  return new WebGLSkiaRenderer(context, width, height);
}
#endif

class DynamicRectanizer {
public:
  DynamicRectanizer(int maxAtlasSize) :
      m_Rectanizer(SkISize(),
                   maxAtlasSize,
                   GrDynamicRectanizer::RectanizerAlgorithm::kSkyline) {}

  void reset(int initialWidth, int initialHeight) {
      m_Rectanizer.reset({initialWidth, initialHeight});
  }

  int addRect(int width, int height) {
      SkIPoint16 loc;
      if (!m_Rectanizer.addRect(width, height, &loc)) {
          return -1;
      }
      return (loc.y() << 16) | loc.x();
  }

  int drawWidth() const { return m_Rectanizer.drawBounds().width(); }

  int drawHeight() const { return m_Rectanizer.drawBounds().height(); }

private:
  GrDynamicRectanizer m_Rectanizer;
};

EMSCRIPTEN_BINDINGS(RiveWASM) {
  function("load", &load, allow_raw_pointers());

#ifdef ENABLE_QUERY_FLAT_VERTICES
  class_<rive::FlattenedPath>("FlattenedPath")
      .function("length",
                optional_override([](rive::FlattenedPath &self) -> size_t {
                  return self.vertices().size();
                }))
      .function("isCubic", optional_override([](rive::FlattenedPath &self,
                                                size_t index) -> bool {
                  if (index >= self.vertices().size()) {
                    return false;
                  }
                  return self.vertices()[index]->is<rive::CubicVertex>();
                }))
      .function("x", optional_override(
                         [](rive::FlattenedPath &self, size_t index) -> float {
                           return self.vertices()[index]->x();
                         }))
      .function("y", optional_override(
                         [](rive::FlattenedPath &self, size_t index) -> float {
                           return self.vertices()[index]->y();
                         }))
      .function("inX", optional_override([](rive::FlattenedPath &self,
                                            size_t index) -> float {
                  return self.vertices()[index]
                      ->as<rive::CubicVertex>()
                      ->renderIn()[0];
                }))
      .function("inY", optional_override([](rive::FlattenedPath &self,
                                            size_t index) -> float {
                  return self.vertices()[index]
                      ->as<rive::CubicVertex>()
                      ->renderIn()[1];
                }))
      .function("outX", optional_override([](rive::FlattenedPath &self,
                                             size_t index) -> float {
                  return self.vertices()[index]
                      ->as<rive::CubicVertex>()
                      ->renderOut()[0];
                }))
      .function("outY", optional_override([](rive::FlattenedPath &self,
                                             size_t index) -> float {
                  return self.vertices()[index]
                      ->as<rive::CubicVertex>()
                      ->renderOut()[1];
                }));
#endif

#ifdef RIVE_SKIA_RENDERER
  class_<rive::Renderer>("Renderer")
      .function("save", &rive::Renderer::save)
      .function("restore", &rive::Renderer::restore)
      .function("transform", &rive::Renderer::transform, allow_raw_pointers())
      .function("drawPath", &rive::Renderer::drawPath, allow_raw_pointers())
      .function("clipPath", &rive::Renderer::clipPath, allow_raw_pointers())
      .function("align", &rive::Renderer::align, allow_raw_pointers())
      .function("computeAlignment", &rive::Renderer::computeAlignment,
                allow_raw_pointers());
  class_<WebGLSkiaRenderer, base<rive::Renderer>>("WebGLRenderer")
      .function("clear", &WebGLSkiaRenderer::clear)
      .function("flush", &WebGLSkiaRenderer::flush)
      .function("resize", &WebGLSkiaRenderer::resize)
      .function("saveClipRect", &WebGLSkiaRenderer::saveClipRect)
      .function("restoreClipRect", &WebGLSkiaRenderer::restoreClipRect);

  function("makeRenderer", &makeSkiaRenderer, allow_raw_pointers());
#else
  class_<rive::Renderer>("Renderer")
      .function("save", &RendererWrapper::save, pure_virtual(),
                allow_raw_pointers())
      .function("restore", &RendererWrapper::restore, pure_virtual(),
                allow_raw_pointers())
      .function("transform", &RendererWrapper::transform, pure_virtual(),
                allow_raw_pointers())
      .function("drawPath", &RendererWrapper::drawPath, pure_virtual(),
                allow_raw_pointers())
      .function("clipPath", &RendererWrapper::clipPath, pure_virtual(),
                allow_raw_pointers())
      .function("align", &rive::Renderer::align)
      .function("computeAlignment", &rive::Renderer::computeAlignment)
      .allow_subclass<RendererWrapper>("RendererWrapper");

  class_<rive::RenderPath>("RenderPath")
      .function("reset", &RenderPathWrapper::reset, pure_virtual(),
                allow_raw_pointers())
      .function("addPath", &RenderPathWrapper::addRenderPath, pure_virtual(),
                allow_raw_pointers())
      .function("fillRule", &RenderPathWrapper::fillRule, pure_virtual())
      .function("moveTo", &RenderPathWrapper::moveTo, pure_virtual(),
                allow_raw_pointers())
      .function("lineTo", &RenderPathWrapper::lineTo, pure_virtual(),
                allow_raw_pointers())
      .function("cubicTo", &RenderPathWrapper::cubicTo, pure_virtual(),
                allow_raw_pointers())
      .function("close", &RenderPathWrapper::close, pure_virtual(),
                allow_raw_pointers())
      .allow_subclass<RenderPathWrapper>("RenderPathWrapper");
  enum_<rive::RenderPaintStyle>("RenderPaintStyle")
      .value("fill", rive::RenderPaintStyle::fill)
      .value("stroke", rive::RenderPaintStyle::stroke);

  enum_<rive::FillRule>("FillRule")
      .value("nonZero", rive::FillRule::nonZero)
      .value("evenOdd", rive::FillRule::evenOdd);

  enum_<rive::StrokeCap>("StrokeCap")
      .value("butt", rive::StrokeCap::butt)
      .value("round", rive::StrokeCap::round)
      .value("square", rive::StrokeCap::square);

  enum_<rive::StrokeJoin>("StrokeJoin")
      .value("miter", rive::StrokeJoin::miter)
      .value("round", rive::StrokeJoin::round)
      .value("bevel", rive::StrokeJoin::bevel);

  enum_<rive::BlendMode>("BlendMode")
      .value("srcOver", rive::BlendMode::srcOver)
      .value("screen", rive::BlendMode::screen)
      .value("overlay", rive::BlendMode::overlay)
      .value("darken", rive::BlendMode::darken)
      .value("lighten", rive::BlendMode::lighten)
      .value("colorDodge", rive::BlendMode::colorDodge)
      .value("colorBurn", rive::BlendMode::colorBurn)
      .value("hardLight", rive::BlendMode::hardLight)
      .value("softLight", rive::BlendMode::softLight)
      .value("difference", rive::BlendMode::difference)
      .value("exclusion", rive::BlendMode::exclusion)
      .value("multiply", rive::BlendMode::multiply)
      .value("hue", rive::BlendMode::hue)
      .value("saturation", rive::BlendMode::saturation)
      .value("color", rive::BlendMode::color)
      .value("luminosity", rive::BlendMode::luminosity);

  class_<rive::rcp<rive::RenderShader>>("RenderShader");

  class_<rive::RenderPaint>("RenderPaint")
      .function("color", &RenderPaintWrapper::color, pure_virtual(),
                allow_raw_pointers())

      .function("style", &RenderPaintWrapper::style, pure_virtual(),
                allow_raw_pointers())
      .function("thickness", &RenderPaintWrapper::thickness, pure_virtual(),
                allow_raw_pointers())
      .function("join", &RenderPaintWrapper::join, pure_virtual(),
                allow_raw_pointers())
      .function("cap", &RenderPaintWrapper::cap, pure_virtual(),
                allow_raw_pointers())
      .function("blendMode", &RenderPaintWrapper::blendMode, pure_virtual(),
                allow_raw_pointers())
      .function("shader", &RenderPaintWrapper::shader, pure_virtual(),
                allow_raw_pointers())
      .allow_subclass<RenderPaintWrapper>("RenderPaintWrapper");

  class_<rive::RenderImage>("RenderImage")
      .function("decode", &RenderImageWrapper::decode, pure_virtual(),
                allow_raw_pointers())
      .function("size", &RenderImageWrapper::size)
      .allow_subclass<RenderImageWrapper>("RenderImageWrapper");
#endif

  class_<rive::Mat2D>("Mat2D")
      .constructor<>()
      .property("xx", select_overload<float() const>(&rive::Mat2D::xx),
                select_overload<void(float)>(&rive::Mat2D::xx))
      .property("xy", select_overload<float() const>(&rive::Mat2D::xy),
                select_overload<void(float)>(&rive::Mat2D::xy))
      .property("yx", select_overload<float() const>(&rive::Mat2D::yx),
                select_overload<void(float)>(&rive::Mat2D::yx))
      .property("yy", select_overload<float() const>(&rive::Mat2D::yy),
                select_overload<void(float)>(&rive::Mat2D::yy))
      .property("tx", select_overload<float() const>(&rive::Mat2D::tx),
                select_overload<void(float)>(&rive::Mat2D::tx))
      .property("ty", select_overload<float() const>(&rive::Mat2D::ty),
                select_overload<void(float)>(&rive::Mat2D::ty))
      .function("invert", optional_override([](rive::Mat2D &self,
                                               rive::Mat2D &result) -> bool {
                  return rive::Mat2D::invert(result, self);
                }))
      .function("multiply",
                optional_override([](rive::Mat2D &self, rive::Mat2D &result,
                                     rive::Mat2D &other) -> void {
                  result = rive::Mat2D::multiply(self, other);
                }));

  class_<rive::File>("File")
      .function(
          "defaultArtboard",
          optional_override([](rive::File& self) -> rive::ArtboardInstance* {
            return self.artboardAt(0).release();
          }),
          allow_raw_pointers())
      .function("artboardByName",
          optional_override([](const rive::File& self, const std::string& name) -> rive::ArtboardInstance* {
            return self.artboardNamed(name).release();
          }),
          allow_raw_pointers())
      .function("artboardByIndex",
          optional_override([](const rive::File& self, size_t index) -> rive::ArtboardInstance* {
            return self.artboardAt(index).release();
          }),
          allow_raw_pointers())
      .function("artboardCount", &rive::File::artboardCount);

  class_<rive::ArtboardInstance>("Artboard")
#ifdef ENABLE_QUERY_FLAT_VERTICES
      .function("flattenPath",
                optional_override(
                    [](rive::Artboard &self, size_t index,
                       bool transformToParent) -> rive::FlattenedPath * {
                      auto artboardObjects = self.objects();
                      if (index >= artboardObjects.size()) {
                        return nullptr;
                      }
                      auto object = artboardObjects[index];
                      if (!object->is<rive::Path>()) {
                        return nullptr;
                      }
                      auto path = object->as<rive::Path>();
                      return path->makeFlat(transformToParent);
                    }),
                allow_raw_pointers())
#endif
      .property("name", select_overload<const std::string &() const>(
                            &rive::Artboard::name))
      .function("advance",
          optional_override([](rive::ArtboardInstance& self, double seconds) -> bool {
            return self.advance(seconds);
        }),
        allow_raw_pointers())
      .function(
          "draw",
          optional_override([](rive::ArtboardInstance &self, rive::Renderer *renderer) {
            return self.draw(renderer, rive::Artboard::DrawOption::kNormal);
          }),
          allow_raw_pointers())
      .function("transformComponent",
                &rive::Artboard::find<rive::TransformComponent>,
                allow_raw_pointers())
      .function("node", &rive::Artboard::find<rive::Node>, allow_raw_pointers())
      .function("bone", &rive::Artboard::find<rive::Bone>, allow_raw_pointers())
      .function("rootBone", &rive::Artboard::find<rive::RootBone>,
                allow_raw_pointers())
      // Animations
      .function("animationByIndex",
          optional_override([](rive::ArtboardInstance& self, size_t index) -> rive::LinearAnimation* {
            return self.animation(index);
        }),
        allow_raw_pointers())
      .function("animationByName",
          optional_override([](rive::ArtboardInstance& self, const std::string& name) -> rive::LinearAnimation* {
            return self.animation(name);
        }),
        allow_raw_pointers())
      .function("animationCount",
          optional_override([](rive::ArtboardInstance& self) -> size_t {
            return self.animationCount();
        }))
      // State machines
      .function("stateMachineByIndex",
          optional_override([](rive::ArtboardInstance& self, size_t index) -> rive::StateMachine* {
            return self.stateMachine(index);
          }),
          allow_raw_pointers())
      .function("stateMachineByName",
          optional_override([](rive::ArtboardInstance& self, const std::string& name) -> rive::StateMachine* {
            return self.stateMachine(name);
          }),
          allow_raw_pointers())
      .function("stateMachineCount",
          optional_override([](rive::ArtboardInstance& self) -> size_t {
            return self.stateMachineCount();
        }))
      .property("bounds",
          optional_override([](const rive::ArtboardInstance& self) -> rive::AABB {
            return self.bounds();
          }))
      .property("frameOrigin",
                select_overload<bool() const>(&rive::Artboard::frameOrigin),
                select_overload<void(bool)>(&rive::Artboard::frameOrigin));

  class_<rive::TransformComponent>("TransformComponent")
      .property(
          "scaleX",
          select_overload<float() const>(&rive::TransformComponent::scaleX),
          select_overload<void(float)>(&rive::TransformComponent::scaleX))
      .property(
          "scaleY",
          select_overload<float() const>(&rive::TransformComponent::scaleY),
          select_overload<void(float)>(&rive::TransformComponent::scaleY))
      .property(
          "rotation",
          select_overload<float() const>(&rive::TransformComponent::rotation),
          select_overload<void(float)>(&rive::TransformComponent::rotation))
      .function("worldTransform",
                optional_override(
                    [](rive::TransformComponent &self) -> rive::Mat2D & {
                      return self.mutableWorldTransform();
                    }),
                allow_raw_pointers())
      .function("parentWorldTransform",
                optional_override([](rive::TransformComponent &self,
                                     rive::Mat2D &result) -> void {
                  result = rive::Mat2D(getParentWorld(self));
                }),
                allow_raw_pointers());

  class_<rive::Node, base<rive::TransformComponent>>("Node")
      .property("x",
                select_overload<float() const>(&rive::TransformComponent::x),
                select_overload<void(float)>(&rive::Node::x))
      .property("y",
                select_overload<float() const>(&rive::TransformComponent::y),
                select_overload<void(float)>(&rive::Node::y));

  class_<rive::Bone, base<rive::TransformComponent>>("Bone").property(
      "length", select_overload<float() const>(&rive::Bone::length),
      select_overload<void(float)>(&rive::Bone::length));

  class_<rive::RootBone, base<rive::Bone>>("RootBone")
      .property("x",
                select_overload<float() const>(&rive::TransformComponent::x),
                select_overload<void(float)>(&rive::RootBone::x))
      .property("y",
                select_overload<float() const>(&rive::TransformComponent::y),
                select_overload<void(float)>(&rive::RootBone::y));

  class_<rive::Animation>("Animation")
      .property("name", select_overload<const std::string &() const>(
                            &rive::AnimationBase::name));

  class_<rive::LinearAnimation, base<rive::Animation>>("LinearAnimation")
      .property("name", select_overload<const std::string &() const>(
                            &rive::AnimationBase::name))
      .property("duration", select_overload<uint32_t() const>(
                                &rive::LinearAnimationBase::duration))
      .property("fps",
                select_overload<uint32_t() const>(&rive::LinearAnimationBase::fps))
      .property("workStart", select_overload<uint32_t() const>(
                                 &rive::LinearAnimationBase::workStart))
      .property("workEnd", select_overload<uint32_t() const>(
                               &rive::LinearAnimationBase::workEnd))
      .property("enableWorkArea",
                select_overload<bool() const>(
                    &rive::LinearAnimationBase::enableWorkArea))
      .property("loopValue", select_overload<uint32_t() const>(
                                 &rive::LinearAnimationBase::loopValue))
      .property("speed", select_overload<float() const>(
                             &rive::LinearAnimationBase::speed))
      .function("apply", &rive::LinearAnimation::apply, allow_raw_pointers());

  class_<rive::LinearAnimationInstance>("LinearAnimationInstance")
      .constructor<rive::LinearAnimation *, rive::ArtboardInstance*>()
      .property(
          "time",
          select_overload<float() const>(&rive::LinearAnimationInstance::time),
          select_overload<void(float)>(&rive::LinearAnimationInstance::time))
      .property("didLoop", &rive::LinearAnimationInstance::didLoop)
      .function("advance", &rive::LinearAnimationInstance::advance)
      .function("apply", &rive::LinearAnimationInstance::apply,
                allow_raw_pointers());

  class_<rive::StateMachine, base<rive::Animation>>("StateMachine");

  class_<rive::StateMachineInstance>("StateMachineInstance")
      .constructor<rive::StateMachine *, rive::ArtboardInstance*>()
      .function("advance", &rive::StateMachineInstance::advance,
                allow_raw_pointers())
      .function("inputCount", &rive::StateMachineInstance::inputCount)
      .function("input", &rive::StateMachineInstance::input,
                allow_raw_pointers())
      .function("stateChangedCount",
                &rive::StateMachineInstance::stateChangedCount)
      .function(
          "stateChangedNameByIndex",
          optional_override([](rive::StateMachineInstance &self,
                               size_t index) -> std::string {
            const rive::LayerState *state = self.stateChangedByIndex(index);
            if (state != nullptr)
              switch (state->coreType()) {
              case rive::AnimationState::typeKey:
                return state->as<rive::AnimationState>()->animation()->name();
              case rive::EntryState::typeKey:
                return "entry";
              case rive::ExitState::typeKey:
                return "exit";
              case rive::AnyState::typeKey:
                return "any";
              }
            return "unknown";
          }),
          allow_raw_pointers());

  class_<rive::SMIInput>("SMIInput")
      .property("type", &rive::SMIInput::inputCoreType)
      .property("name", &rive::SMIInput::name)
      .class_property("bool", &stateMachineBoolTypeKey)
      .class_property("number", &stateMachineNumberTypeKey)
      .class_property("trigger", &stateMachineTriggerTypeKey)
      .function("asBool",
                optional_override([](rive::SMIInput &self) -> rive::SMIBool * {
                  if (self.inputCoreType() != stateMachineBoolTypeKey) {
                    return nullptr;
                  }
                  return static_cast<rive::SMIBool *>(&self);
                }),
                allow_raw_pointers())
      .function(
          "asNumber",
          optional_override([](rive::SMIInput &self) -> rive::SMINumber * {
            if (self.inputCoreType() != stateMachineNumberTypeKey) {
              return nullptr;
            }
            return static_cast<rive::SMINumber *>(&self);
          }),
          allow_raw_pointers())
      .function(
          "asTrigger",
          optional_override([](rive::SMIInput &self) -> rive::SMITrigger * {
            if (self.inputCoreType() != stateMachineTriggerTypeKey) {
              return nullptr;
            }
            return static_cast<rive::SMITrigger *>(&self);
          }),
          allow_raw_pointers());

  class_<rive::SMIBool, base<rive::SMIInput>>("SMIBool").property(
      "value", select_overload<bool() const>(&rive::SMIBool::value),
      select_overload<void(bool)>(&rive::SMIBool::value));
  class_<rive::SMINumber, base<rive::SMIInput>>("SMINumber")
      .property("value",
                select_overload<float() const>(&rive::SMINumber::value),
                select_overload<void(float)>(&rive::SMINumber::value));
  class_<rive::SMITrigger, base<rive::SMIInput>>("SMITrigger")
      .function("fire", &rive::SMITrigger::fire);

  enum_<rive::Fit>("Fit")
      .value("fill", rive::Fit::fill)
      .value("contain", rive::Fit::contain)
      .value("cover", rive::Fit::cover)
      .value("fitWidth", rive::Fit::fitWidth)
      .value("fitHeight", rive::Fit::fitHeight)
      .value("none", rive::Fit::none)
      .value("scaleDown", rive::Fit::scaleDown);

  class_<rive::Alignment>("Alignment")
      .property("x", &rive::Alignment::x)
      .property("y", &rive::Alignment::y)
      .class_property("topLeft", &rive::Alignment::topLeft)
      .class_property("topCenter", &rive::Alignment::topCenter)
      .class_property("topRight", &rive::Alignment::topRight)
      .class_property("centerLeft", &rive::Alignment::centerLeft)
      .class_property("center", &rive::Alignment::center)
      .class_property("centerRight", &rive::Alignment::centerRight)
      .class_property("bottomLeft", &rive::Alignment::bottomLeft)
      .class_property("bottomCenter", &rive::Alignment::bottomCenter)
      .class_property("bottomRight", &rive::Alignment::bottomRight);

  value_object<rive::AABB>("AABB")
      .field("minX", &rive::AABB::minX)
      .field("minY", &rive::AABB::minY)
      .field("maxX", &rive::AABB::maxX)
      .field("maxY", &rive::AABB::maxY);

  class_<DynamicRectanizer>("DynamicRectanizer")
      .constructor<int>()
      .function("reset", &DynamicRectanizer::reset)
      .function("addRect", &DynamicRectanizer::addRect)
      .function("drawWidth", &DynamicRectanizer::drawWidth)
      .function("drawHeight", &DynamicRectanizer::drawHeight);
}
