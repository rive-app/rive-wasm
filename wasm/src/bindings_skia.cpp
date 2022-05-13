#include "rive/rive_types.hpp"

#ifdef RIVE_SKIA_RENDERER

#include "GrDirectContext.h"
#include "SkCanvas.h"
#include "SkSurface.h"
#include "gl/GrGLInterface.h"

#include "skia_factory.hpp"
#include "skia_renderer.hpp"
#include <GLES3/gl3.h>

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <vector>

static rive::SkiaFactory gSkiaFactory;
rive::Factory* jsFactory() {
  return &gSkiaFactory;
}

using namespace emscripten;

class WebGLSkiaRenderer : public rive::SkiaRenderer {
private:
  sk_sp<GrDirectContext> m_Context;
  SkSurface *m_Surface;

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
    std::unique_ptr<rive::RenderPath> rect(jsFactory()->makeEmptyRenderPath());
    rect->moveTo(l, t);
    rect->lineTo(r, t);
    rect->lineTo(r, b);
    rect->lineTo(l, b);
    rect->close();
    clipPath(rect.get());
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

EMSCRIPTEN_BINDINGS(RiveWASM_Skia) {
  class_<rive::Renderer>("Renderer")
      .function("save", &rive::Renderer::save)
      .function("restore", &rive::Renderer::restore)
      .function("transform", &rive::Renderer::transform, allow_raw_pointers())
      .function("drawPath", &rive::Renderer::drawPath, allow_raw_pointers())
      .function("clipPath", &rive::Renderer::clipPath, allow_raw_pointers())
      .function("align", &rive::Renderer::align, allow_raw_pointers());
  class_<WebGLSkiaRenderer, base<rive::Renderer>>("WebGLRenderer")
      .function("clear", &WebGLSkiaRenderer::clear)
      .function("flush", &WebGLSkiaRenderer::flush)
      .function("resize", &WebGLSkiaRenderer::resize)
      .function("saveClipRect", &WebGLSkiaRenderer::saveClipRect)
      .function("restoreClipRect", &WebGLSkiaRenderer::restoreClipRect);

  function("makeRenderer", &makeSkiaRenderer, allow_raw_pointers());
}

#endif   // RIVE_SKIA_RENDERER
