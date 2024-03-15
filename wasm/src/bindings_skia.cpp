#include "rive/rive_types.hpp"

#ifdef RIVE_SKIA_RENDERER

#include "GrDirectContext.h"
#include "SkCanvas.h"
#include "SkSurface.h"
#include "gl/GrGLInterface.h"
#include "js_alignment.hpp"

#include "skia_factory.hpp"
#include "skia_renderer.hpp"
#include <GLES3/gl3.h>

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <emscripten/html5.h>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <vector>

static rive::SkiaFactory gSkiaFactory;
rive::Factory* jsFactory() { return &gSkiaFactory; }

using namespace emscripten;

// RAII utility to set and restore the current GL context.
class ScopedGLContextMakeCurrent
{
public:
    ScopedGLContextMakeCurrent(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE glContext) :
        m_glContext(glContext), m_previousContext(emscripten_webgl_get_current_context())
    {
        if (m_glContext != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_glContext);
        }
    }

    ~ScopedGLContextMakeCurrent()
    {
        if (m_glContext != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_previousContext);
        }
    }

private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_glContext;
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_previousContext;
};

class WebGLSkiaRenderer : public rive::SkiaRenderer
{
private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_glContext;
    sk_sp<GrDirectContext> m_Context;
    SkSurface* m_Surface;

public:
    WebGLSkiaRenderer(sk_sp<GrDirectContext> context, int width, int height) :
        m_glContext(emscripten_webgl_get_current_context()),
        m_Context(context),
        m_Surface(makeSurface(context, width, height)),
        rive::SkiaRenderer(nullptr)
    {
        m_Canvas = m_Surface->getCanvas();
    }

    ~WebGLSkiaRenderer()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_glContext);
        delete m_Surface;
        m_Context = nullptr;
    }

    void resize(int width, int height)
    {
        ScopedGLContextMakeCurrent makeCurrent(m_glContext);
        delete m_Surface;
        m_Surface = makeSurface(m_Context, width, height);
        m_Canvas = m_Surface->getCanvas();
    }

    void clear()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_glContext);
        m_Canvas->clear(0);
    }

    void flush()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_glContext);
        m_Context->flush();
    }

    SkSurface* makeSurface(sk_sp<GrDirectContext> context, int width, int height)
    {
        assert(emscripten_webgl_get_current_context() == m_glContext);

        int numSamples, numStencilBits;
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glGetIntegerv(GL_SAMPLES, &numSamples);
        glGetIntegerv(GL_STENCIL_BITS, &numStencilBits);
        m_Context->resetContext(kRenderTarget_GrGLBackendState);

        GrGLFramebufferInfo framebufferInfo;
        framebufferInfo.fFBOID = 0;
        framebufferInfo.fFormat = GL_RGBA8;

        GrBackendRenderTarget backendRenderTarget(width,
                                                  height,
                                                  numSamples,
                                                  numStencilBits,
                                                  framebufferInfo);

        return SkSurface::MakeFromBackendRenderTarget(context.get(),
                                                      backendRenderTarget,
                                                      kBottomLeft_GrSurfaceOrigin,
                                                      kRGBA_8888_SkColorType,
                                                      nullptr,
                                                      nullptr)
            .release();
    }

    void saveClipRect(float l, float t, float r, float b)
    {
        save();
        rive::rcp<rive::RenderPath> rect(jsFactory()->makeEmptyRenderPath());
        rect->moveTo(l, t);
        rect->lineTo(r, t);
        rect->lineTo(r, b);
        rect->lineTo(l, b);
        rect->close();
        clipPath(rect.get());
    }

    void restoreClipRect() { restore(); }
};

WebGLSkiaRenderer* makeSkiaRenderer(int width, int height)
{
    GrContextOptions options;
    sk_sp<GrDirectContext> context = GrDirectContext::MakeGL(nullptr, options);
    return new WebGLSkiaRenderer(context, width, height);
}

class RenderImageWrapper : public wrapper<rive::RenderImage>
{
public:
    EMSCRIPTEN_WRAPPER(RenderImageWrapper);
    void unref() { rive::RenderImage::unref(); }
};

RenderImageWrapper* decodeImageSkia(emscripten::val byteArray)
{
    std::vector<unsigned char> vector;

    const auto l = byteArray["byteLength"].as<unsigned>();
    vector.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, vector.data())};
    memoryView.call<void>("set", byteArray);
    rive::rcp rcpImage = jsFactory()->decodeImage(vector);
    // NOTE: ref so the image does not get disposed after the scope of this function.
    rcpImage->ref();
    return (RenderImageWrapper*)(rcpImage.get());
}

EMSCRIPTEN_BINDINGS(RiveWASM_Skia)
{
    class_<rive::Renderer>("Renderer")
        .function("save", &rive::Renderer::save)
        .function("restore", &rive::Renderer::restore)
        .function("transform", &rive::Renderer::transform, allow_raw_pointers())
        .function("drawPath", &rive::Renderer::drawPath, allow_raw_pointers())
        .function("clipPath", &rive::Renderer::clipPath, allow_raw_pointers())
        .function("align",
                  optional_override([](rive::Renderer& self,
                                       rive::Fit fit,
                                       JsAlignment alignment,
                                       const rive::AABB& frame,
                                       const rive::AABB& content) {
                      self.align(fit, convertAlignment(alignment), frame, content);
                  }));
    class_<WebGLSkiaRenderer, base<rive::Renderer>>("WebGLRenderer")
        .function("clear", &WebGLSkiaRenderer::clear)
        .function("flush", &WebGLSkiaRenderer::flush)
        .function("resize", &WebGLSkiaRenderer::resize)
        .function("saveClipRect", &WebGLSkiaRenderer::saveClipRect)
        .function("restoreClipRect", &WebGLSkiaRenderer::restoreClipRect);
    class_<rive::RenderImage>("RenderImage")
        .function("unref", &RenderImageWrapper::unref)
        .allow_subclass<RenderImageWrapper>("RenderImageWrapper");

    function("makeRenderer", &makeSkiaRenderer, allow_raw_pointers());
    function("decodeImageSkia", &decodeImageSkia, allow_raw_pointers());
}

#endif // RIVE_SKIA_RENDERER
