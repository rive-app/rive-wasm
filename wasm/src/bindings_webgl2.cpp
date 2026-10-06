#include "rive/rive_types.hpp"

#ifdef RIVE_WEBGL2_RENDERER

#include "rive/renderer/draw.hpp"
#include "rive/renderer/rive_render_factory.hpp"
#include "rive/renderer/rive_render_image.hpp"
#include "rive/renderer/gl/render_context_gl_impl.hpp"
#include "rive/renderer/rive_renderer.hpp"
#include "rive/renderer/gl/render_target_gl.hpp"
#include "js_alignment.hpp"
#include "webgl2_bridge.hpp"

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
#include "rive/renderer/cmd/deferred_host.hpp"
#if defined(WITH_RIVE_SCRIPTING)
#include "rive/file.hpp"
#include "rive/lua/rive_lua_libs.hpp"
#include "rive/lua/scripting_vm.hpp"
#endif
#endif

#ifdef RIVE_CANVAS
#include "rive/renderer/cmd/deferred_canvas_host.hpp"
#include "rive/renderer/render_canvas.hpp"
#endif

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <emscripten/html5.h>
using namespace emscripten;

#include <algorithm>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <map>
#include <set>
#include <vector>

using namespace rive;
using namespace rive::gpu;

class WebGL2Renderer;
class WebGL2RenderImage;
class WebGL2RenderBuffer;

using PLSResourceID = uint64_t;

static std::atomic<PLSResourceID> s_nextWebGL2BufferID;

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
// A deferred recording session JS owns, one per file that opted into deferred.
// The file imports through it, exactly one renderer attaches to replay it, and
// either side may be destroyed first, so the two unbind each other.
class WebGL2DeferredSession : public cmd::DeferredSession
{
public:
    // Device free: the attaching renderer holds the first ore context that
    // exists, so its replay caps late bind in attachSession.
    WebGL2DeferredSession() : cmd::DeferredSession(ore::ReplayCaps{}) {}
    ~WebGL2DeferredSession();

    void bindRenderer(WebGL2Renderer* renderer)
    {
        m_renderer = renderer;
        m_everBound = m_everBound || renderer != nullptr;
    }
    // A claim is for the session's whole life, not just the attachment: detach
    // resets the frame and drops the ore context the recorded stream created
    // its resources against, so a second renderer would replay against nothing.
    bool everBound() const { return m_everBound; }

    // The browser decodes asynchronously, so a recorded decode would only
    // start at first replay and a static first frame would draw before the
    // image exists. Decoding through the immediate factory matches immediate
    // import timing; the image is context free until prep() at draw, and the
    // recorder routes it as a foreign image. Defined below WebGL2Factory.
    rcp<RenderImage> decodeImage(Span<const uint8_t> bytes) override;

private:
    // The renderer currently replaying this session, null while unattached.
    WebGL2Renderer* m_renderer = nullptr;
    bool m_everBound = false;
};
#endif

#define EXPORT extern "C" EMSCRIPTEN_KEEPALIVE

// Singleton RiveRenderFactory implementation for WebGL 2.
// All objects are context free and keyed to actual resources the the specific GL contexts.
class WebGL2Factory : public RiveRenderFactory
{
public:
    static WebGL2Factory* Instance()
    {
        static WebGL2Factory s_webGLFactory;
        return &s_webGLFactory;
    }

    // Register GL contexts for resource deletion notifications.
    void registerContext(WebGL2Renderer* renderer) { m_renderers.insert(renderer); }
    void unregisterContext(WebGL2Renderer* renderer);

    // This factory is a singleton shared by every GL context, so it has no one
    // render context to hand out. Whoever has a frame open claims it for the
    // duration, which is the only window in which anything can ask -- an
    // artboard caching itself as a bitmap does so mid-draw.
    void bindActiveRenderer(WebGL2Renderer* renderer) { m_activeRenderer = renderer; }
#ifdef RIVE_CANVAS
    // Only canvasContentHost: answering deferredCanvasHost() would tell the
    // scripting layer its canvas work is being recorded for a replay, and it
    // would hand out unbacked canvases and never draw.
    rive::cmd::DeferredCanvasHost* canvasContentHost() override;
#endif

    // Hooks for WebGL 2 objects to notify all contexts when they get deleted.
    void onWebGL2BufferDeleted(WebGL2RenderBuffer*);

    rcp<RenderImage> decodeImage(Span<const uint8_t> encodedBytes) override;
    rcp<RenderBuffer> makeRenderBuffer(RenderBufferType,
                                       RenderBufferFlags,
                                       size_t sizeInBytes) override;

private:
    WebGL2Factory() = default;

    std::set<WebGL2Renderer*> m_renderers;
    WebGL2Renderer* m_activeRenderer = nullptr;
};

// RAII utility to set and restore the current GL context.
class ScopedGLContextMakeCurrent
{
public:
    ScopedGLContextMakeCurrent(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE contextGL) :
        m_contextGL(contextGL), m_previousContext(emscripten_webgl_get_current_context())
    {
        // A zero handle means "no context known", not "context zero": making
        // it current would leave the GL calls that follow with no context.
        if (m_contextGL != 0 && m_contextGL != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_contextGL);
        }
    }

    ~ScopedGLContextMakeCurrent()
    {
        if (m_contextGL != 0 && m_contextGL != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_previousContext);
        }
    }

private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL;
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_previousContext;
};

EM_JS(void, decode_image, (uintptr_t renderImage, uintptr_t imgDataPtr, int imgDataLength), {
    var images = Module["images"];
    if (!images)
    {
        images = new Map();
        Module["images"] = images;
    }

    var image = new Image();
    images.set(renderImage, image);
    // Copy heap as it's a SharedBufferArray which cannot be used for
    // Blob.
    var sourceView = Module["HEAP8"].subarray(imgDataPtr, imgDataPtr + imgDataLength);
    var buffer = new Uint8Array(imgDataLength);
    buffer.set(sourceView);
    image.src = URL.createObjectURL(new Blob([buffer], {
        type:
            "image/png"
    }));
    image.onload = function() { Module["_setWebImage"](renderImage, image.width, image.height); };
});

EM_JS(void, upload_image, (EMSCRIPTEN_WEBGL_CONTEXT_HANDLE gl, uintptr_t renderImage), {
    var images = Module["images"];
    if (!images)
    {
        return;
    }

    var image = images.get(renderImage);
    if (!image)
    {
        return;
    }
    gl = GL.getContext(gl).GLctx;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
});

EM_JS(void, delete_image, (uintptr_t renderImage), {
    var images = Module["images"];
    if (!images)
    {
        return;
    }

    var image = images.get(renderImage);
    if (!image)
    {
        return;
    }
    images.delete(renderImage);
});

// High-level, context agnostic RenderImage for the WebGL2 system. Wraps a blob of encoded image
// data, which is then decoded and uploaded to a texture on each separate context.
class WebGL2RenderImage : public LITE_RTTI_OVERRIDE(RenderImage, WebGL2RenderImage)
{
public:
    WebGL2RenderImage(Span<const uint8_t> encodedBytes)
    {
        m_Width = 0;
        m_Height = 0;

        // Balanced by the unref() in the exported setWebImage(), which decode_image() calls
        // back asynchronously.
        ref();
        decode_image(reinterpret_cast<uintptr_t>(this),
                     reinterpret_cast<uintptr_t>(encodedBytes.data()),
                     encodedBytes.size());
    }

    WebGL2RenderImage()
    {
        m_Width = 0;
        m_Height = 0;
    }

    ~WebGL2RenderImage()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        delete_image(reinterpret_cast<uintptr_t>(this));
        m_renderImage.reset();
    }

    void setWebImage(int width, int height)
    {
        m_Width = width;
        m_Height = height;
        m_readyToUpload = true;
        decodedAsync();
    }

private:
    bool m_readyToUpload = false;
    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL = 0;
    rcp<RiveRenderImage> m_renderImage;

public:
    RenderImage* prep(WebGL2Renderer* webglRenderer, const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context);
};

EXPORT void setWebImage(WebGL2RenderImage* renderImage, int width, int height)
{
    renderImage->setWebImage(width, height);
    renderImage->unref();
}

// Shared object that holds the contents of a WebGL2Buffer. PLS buffers are synchronized to these
// contents on every draw.
class WebGL2BufferData : public RefCnt<WebGL2BufferData>
{
public:
    WebGL2BufferData(size_t sizeInBytes) : m_data(new uint8_t[sizeInBytes]) {}

    const uint8_t* contents() const { return m_data.get(); }

    uint8_t* writableAddress()
    {
        ++m_mutationID;
        return m_data.get();
    }

    // Used to know when a PLS buffer is out of sync.
    PLSResourceID mutationID() const { return m_mutationID; }

private:
    std::unique_ptr<uint8_t[]> m_data;
    PLSResourceID m_mutationID = 1; // So a 0-initialized PLS buffer will be out of sync.
};

// High-level, context agnostic RenderBuffer for the WebGL2 system. Wraps the buffer contents in a
// shared CPU-side WebGL2BufferData object, against which low-level PLS buffers are synchronized.
class WebGL2RenderBuffer : public LITE_RTTI_OVERRIDE(RenderBuffer, WebGL2RenderBuffer)
{
public:
    WebGL2RenderBuffer(RenderBufferType type, RenderBufferFlags flags, size_t sizeInBytes) :
        lite_rtti_override(type, flags, sizeInBytes),
        m_bufferData(make_rcp<WebGL2BufferData>(sizeInBytes))
    {}

    ~WebGL2RenderBuffer() { WebGL2Factory::Instance()->onWebGL2BufferDeleted(this); }

    PLSResourceID uniqueID() const { return m_uniqueID; }
    rcp<WebGL2BufferData> bufferData() { return m_bufferData; }

    void* onMap() override { return m_bufferData->writableAddress(); }
    void onUnmap() override {}

private:
    const PLSResourceID m_uniqueID = ++s_nextWebGL2BufferID;
    rcp<WebGL2BufferData> m_bufferData;
};

// Wraps a PLS renderBuffer and keeps its contents synchronized to the given WebGL2BufferData.
class PLSSynchronizedBuffer
{
public:
    PLSSynchronizedBuffer(WebGL2Renderer*, WebGL2RenderBuffer*);

    ~PLSSynchronizedBuffer()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        m_renderBuffer.reset();
    }

    rcp<RenderBuffer> get()
    {
        if (m_mutationID != m_webglBufferData->mutationID())
        {
            ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
            void* contents = m_renderBuffer->map();
            memcpy(contents, m_webglBufferData->contents(), m_renderBuffer->sizeInBytes());
            m_mutationID = m_webglBufferData->mutationID();
            m_renderBuffer->unmap();
        }
        return m_renderBuffer;
    }

private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL;
    const rcp<WebGL2BufferData> m_webglBufferData;
    rcp<RenderBuffer> m_renderBuffer;
    PLSResourceID m_mutationID = 0; // Tells when we are out of sync with the WebGL2BufferData.
};

// Wraps a tightly coupled RiveRenderer and RenderContext, which are tied to a specific WebGL2
// context.
class WebGL2Renderer : public RiveRenderer
#ifdef RIVE_CANVAS
    ,
                       public rive::cmd::DeferredCanvasHost
#endif
{
public:
    WebGL2Renderer(std::unique_ptr<RenderContext> renderContext, int width, int height) :
        RiveRenderer(renderContext.get()), m_renderContext(std::move(renderContext))
    {
        resize(width, height);
        WebGL2Factory::Instance()->registerContext(this);
    }

    ~WebGL2Renderer()
    {
        WebGL2Factory::Instance()->unregisterContext(this);
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        // The session outlives us and references the ore context the render
        // context owns, so it has to let go first, while GL is still current.
        detachSession();
#endif
        m_plsSynchronizedBuffers.clear();
        m_renderTarget = nullptr;
        m_renderContext = nullptr;
    }

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE contextGL() const { return m_contextGL; }

    PLSResourceID currentFrameID() const { return m_currentFrameID; }

    RenderContext* gpuRenderContext() const { return m_renderContext.get(); }

    RenderContextGLImpl* renderContextGL() const
    {
        return m_renderContext->static_impl_cast<RenderContextGLImpl>();
    }

    RenderContext* plsContext() const { return m_renderContext.get(); }

    void resize(int width, int height)
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        GLint sampleCount;
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glGetIntegerv(GL_SAMPLES, &sampleCount);
        m_renderTarget = make_rcp<FramebufferRenderTargetGL>(width, height, 0, sampleCount);
    }

    // "clear()" is our hook for the beginning of a frame.
    // TODO: Give this a better name!!
    void clear()
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_session != nullptr)
        {
            m_host.beginRecord(/*clear=*/true, /*color=*/0);
            // Opens the session's recording window for our target; flush
            // closes it again.
            m_session->beginTargetFrame(m_screenTarget);
            m_target = m_host.screenRenderer();
            ++m_currentFrameID;
            return;
        }
#endif
        beginScreenFrame(gpu::LoadAction::clear, 0);
        ++m_currentFrameID;
    }

    void beginScreenFrame(gpu::LoadAction loadAction, ColorInt clearColor)
    {
        RenderContext::FrameDescriptor frameDescriptor = {
            .renderTargetWidth = m_renderTarget->width(),
            .renderTargetHeight = m_renderTarget->height(),
            .loadAction = loadAction,
            .clearColor = clearColor,
        };
#ifdef RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS
        // We need to disable dithering because in the Rive renderer, we dither after blending, but
        // in the canvas 2D -> WebGL2 path, the Rive renderer dithers first, and this can cause
        // artifacts with certain blend modes (e.g. colorBurn).
        frameDescriptor.ditherMode = gpu::DitherMode::none;
#endif
        if (m_renderTarget->sampleCount() > 1)
        {
            // Use MSAA if we were given a canvas with 'antialias: true'.
            frameDescriptor.msaaSampleCount = m_renderTarget->sampleCount();
        }
        else if (!m_renderContext->platformFeatures().supportsRasterOrderingMode &&
                 !m_renderContext->platformFeatures().supportsAtomicMode)
        {
            // Always use MSAA if we don't have WEBGL_shader_pixel_local_storage.
            frameDescriptor.msaaSampleCount = 4;
        }
        // Kept so an offscreen canvas can interrupt this frame and put it
        // back the way it found it.
        m_screenFrame = frameDescriptor;
        m_renderContext->beginFrame(std::move(frameDescriptor));
        // Claim the factory for the length of the frame: anything that draws
        // between here and flush() may need to reach this context.
        WebGL2Factory::Instance()->bindActiveRenderer(this);
    }

    void saveClipRect(float l, float t, float r, float b)
    {
        save();
        rcp<RenderPath> rect(WebGL2Factory::Instance()->makeEmptyRenderPath());
        rect->moveTo(l, t);
        rect->lineTo(r, t);
        rect->lineTo(r, b);
        rect->lineTo(l, b);
        rect->close();
        clipPath(rect.get());
    }

    void restoreClipRect() { restore(); }

    void drawImage(const RenderImage* renderImage,
                   const ImageSampler imageSampler,
                   BlendMode blendMode,
                   float opacity,
                   float additiveness) override
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_target != nullptr)
        {
            m_target->drawImage(renderImage, imageSampler, blendMode, opacity, additiveness);
            return;
        }
#endif
        if (!prepImage(renderImage))
        {
            return;
        }
        RiveRenderer::drawImage(renderImage, imageSampler, blendMode, opacity, additiveness);
    }

    void drawImageMesh(const RenderImage* renderImage,
                       const ImageSampler imageSampler,
                       rcp<RenderBuffer> vertices_f32,
                       rcp<RenderBuffer> uvCoords_f32,
                       rcp<RenderBuffer> indices_u16,
                       uint32_t vertexCount,
                       uint32_t indexCount,
                       BlendMode blendMode,
                       float opacity,
                       float additiveness) override
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_target != nullptr)
        {
            m_target->drawImageMesh(renderImage,
                                    imageSampler,
                                    vertices_f32,
                                    uvCoords_f32,
                                    indices_u16,
                                    vertexCount,
                                    indexCount,
                                    blendMode,
                                    opacity,
                                    additiveness);
            return;
        }
#endif
        if (!prepImage(renderImage))
        {
            return;
        }
        LITE_RTTI_CAST_OR_RETURN(vertexBuffer, WebGL2RenderBuffer*, vertices_f32.get());
        LITE_RTTI_CAST_OR_RETURN(uvBuffer, WebGL2RenderBuffer*, uvCoords_f32.get());
        LITE_RTTI_CAST_OR_RETURN(indexBuffer, WebGL2RenderBuffer*, indices_u16.get());
        RiveRenderer::drawImageMesh(renderImage,
                                    imageSampler,
                                    refPLSBuffer(vertexBuffer),
                                    refPLSBuffer(uvBuffer),
                                    refPLSBuffer(indexBuffer),
                                    vertexCount,
                                    indexCount,
                                    blendMode,
                                    opacity,
                                    additiveness);
    }

    void drawImageMeshInstanced(const RenderImage* renderImage,
                                const ImageSampler imageSampler,
                                rcp<RenderBuffer> vertices_f32,
                                rcp<RenderBuffer> uvCoords_f32,
                                rcp<RenderBuffer> indices_u16,
                                uint32_t vertexCount,
                                uint32_t indexCount,
                                rcp<ImageMeshInstances> instances) override
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_target != nullptr)
        {
            m_target->drawImageMeshInstanced(renderImage,
                                             imageSampler,
                                             vertices_f32,
                                             uvCoords_f32,
                                             indices_u16,
                                             vertexCount,
                                             indexCount,
                                             std::move(instances));
            return;
        }
#endif
        if (!prepImage(renderImage))
        {
            return;
        }
        LITE_RTTI_CAST_OR_RETURN(vertexBuffer, WebGL2RenderBuffer*, vertices_f32.get());
        LITE_RTTI_CAST_OR_RETURN(uvBuffer, WebGL2RenderBuffer*, uvCoords_f32.get());
        LITE_RTTI_CAST_OR_RETURN(indexBuffer, WebGL2RenderBuffer*, indices_u16.get());
        RiveRenderer::drawImageMeshInstanced(renderImage,
                                             imageSampler,
                                             refPLSBuffer(vertexBuffer),
                                             refPLSBuffer(uvBuffer),
                                             refPLSBuffer(indexBuffer),
                                             vertexCount,
                                             indexCount,
                                             std::move(instances));
    }

    void flush()
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_session != nullptr)
        {
            deferredFlush();
            return;
        }
#endif
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        m_renderContext->flush({.renderTarget = m_renderTarget.get()});
        WebGL2Factory::Instance()->bindActiveRenderer(nullptr);
#ifdef RIVE_CANVAS
        // The frame is over, so nothing is still compositing through these.
        m_compositeRenderers.clear();
#endif
    }

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    // Draws record into the file's session and replay inline at flush. False
    // when any renderer has ever claimed the session: it records against one
    // ore context, so it can neither span canvases nor outlive the one it
    // bound. The caller falls back rather than sharing.
    bool attachSession(WebGL2DeferredSession* session);
    // Closes the session's window, gives back its target and drops the replay
    // state, with this renderer's GL context current. A detached session can
    // never replay again: the resources its stream refers to lived in the
    // replayer that dies here.
    void detachSession();
    bool deferredActive() const { return m_session != nullptr; }
    uint64_t screenTarget() const { return m_screenTarget; }

    // While a deferred frame is open, draws record into the session stream.
    // Cleared before replay so the replayed commands run on this renderer.
    void save() override
    {
        if (m_target != nullptr)
        {
            m_target->save();
        }
        else
        {
            RiveRenderer::save();
        }
    }
    void restore() override
    {
        if (m_target != nullptr)
        {
            m_target->restore();
        }
        else
        {
            RiveRenderer::restore();
        }
    }
    void transform(const Mat2D& matrix) override
    {
        if (m_target != nullptr)
        {
            m_target->transform(matrix);
        }
        else
        {
            RiveRenderer::transform(matrix);
        }
    }
    void drawPath(RenderPath* path, RenderPaint* paint) override
    {
        if (m_target != nullptr)
        {
            m_target->drawPath(path, paint);
        }
        else
        {
            RiveRenderer::drawPath(path, paint);
        }
    }
    void clipPath(RenderPath* path) override
    {
        if (m_target != nullptr)
        {
            m_target->clipPath(path);
        }
        else
        {
            RiveRenderer::clipPath(path);
        }
    }
    void modulateOpacity(float opacity) override
    {
        if (m_target != nullptr)
        {
            m_target->modulateOpacity(opacity);
        }
        else
        {
            RiveRenderer::modulateOpacity(opacity);
        }
    }
#endif

#ifdef RIVE_CANVAS
    // ---- DeferredCanvasHost ----
    // Immediate: the content is drawn into the canvas as it is issued, so it
    // needs a real texture up front rather than one a replay would allocate.
    // GL cannot hand its canvas texture straight to a 2D draw: it renders
    // into one bottom-up, and the backend keeps a Y-flipped companion for
    // anything that samples it. Asking for the mirror both fixes the
    // orientation and gives us an image the draw path can actually sample.
    // The companion is created on first ask and re-blitted at the end of
    // every flush that targets this canvas, so it stays current by itself.
    // A renderer that carried state across the interrupt cannot draw the
    // composite -- proven by probe: the same canvas composites through a
    // renderer made after the resume and not through the one that was mid
    // draw. So hand back a clean one.
    //
    // Known limitation: a clean renderer inherits no clip. The caller
    // re-applies the CTM, but an ancestor clip that constrained the original
    // vector draw does not constrain the composite, so a cached artboard under
    // a clipping shape can paint outside it on WebGL. Fixing it needs the clip
    // stack captured and replayed onto the resumed renderer.
    Renderer* compositeRenderer() override
    {
        // Retained rather than replaced: a cached artboard nested inside
        // another one composites first, and freeing its renderer when the
        // enclosing artboard asks for its own would pull the ground out from
        // under a draw that is still in progress. The whole set is dropped
        // when the screen frame flushes.
        m_compositeRenderers.push_back(std::make_unique<RiveRenderer>(m_renderContext.get()));
        return m_compositeRenderers.back().get();
    }

    rcp<RenderImage> contentCanvasImage(gpu::RenderCanvas* canvas) override
    {
        if (canvas == nullptr)
        {
            return nullptr;
        }
        // GL renders canvas targets top down, so the canvas's own image
        // samples upright and needs no Y-flipped companion.
        return ref_rcp<RenderImage>(canvas->renderImage());
    }

    rcp<gpu::RenderCanvas> makeContentCanvas(uint32_t width, uint32_t height) override
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        return m_renderContext->makeRenderCanvas(width, height);
    }

    // Answered from the context rather than left to the host default: a GL
    // frame can land on atomics or depth-stencil, and neither applies the mask
    // op, so an optimistic yes would have the artboard rasterize to the
    // content-and-coverage intersection and then composite it unmasked -- the
    // layer both unmasked and cropped.
    bool supportsLayerMask() const override { return m_renderContext->supportsLayerMask(); }

    Renderer* beginCanvasContent(gpu::RenderCanvas* canvas, uint32_t clearColor) override
    {
        if (canvas == nullptr || canvas->renderTarget() == nullptr)
        {
            return nullptr; // unbacked; the caller falls back to a vector draw
        }
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        // What this pass is about to interrupt. Not necessarily the screen:
        // a cached artboard can nest inside another one, and the inner pass
        // has to resume the outer canvas rather than jump back to the window.
        const RenderContext::FrameDescriptor& outerFrame =
            m_canvasPasses.empty() ? m_screenFrame : m_canvasPasses.back().frame;
        gpu::RenderTarget* outerTarget = m_canvasPasses.empty()
                                             ? static_cast<gpu::RenderTarget*>(m_renderTarget.get())
                                             : m_canvasPasses.back().target.get();

        // Frames cannot nest, so resolve what the interrupted target has drawn
        // so far and give the context to the canvas.
        m_renderContext->flush({.renderTarget = outerTarget});

        RenderContext::FrameDescriptor canvasFrame = {
            .renderTargetWidth = canvas->width(),
            .renderTargetHeight = canvas->height(),
            .loadAction = gpu::LoadAction::clear,
            .clearColor = clearColor,
        };
        // Mirror the screen's fallback: without pixel local storage or
        // atomics there is no way to render correctly except MSAA.
        if (!m_renderContext->platformFeatures().supportsRasterOrderingMode &&
            !m_renderContext->platformFeatures().supportsAtomicMode)
        {
            canvasFrame.msaaSampleCount = 4;
        }

        m_canvasPasses.push_back({
            .frame = canvasFrame,
            .target = ref_rcp(canvas->renderTarget()),
            .renderer = std::make_unique<RiveRenderer>(m_renderContext.get()),
            .outerFrame = outerFrame,
            .outerTarget = outerTarget,
        });
        m_renderContext->beginFrame(std::move(canvasFrame));
        return m_canvasPasses.back().renderer.get();
    }

    void endCanvasContent(gpu::RenderCanvas*) override
    {
        if (m_canvasPasses.empty())
        {
            return;
        }
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        m_renderContext->flush({.renderTarget = m_canvasPasses.back().target.get()});

        // Put back whatever this pass interrupted -- an enclosing canvas, or
        // the screen at the bottom -- keeping what it had already drawn.
        RenderContext::FrameDescriptor resumed = m_canvasPasses.back().outerFrame;
        resumed.loadAction = gpu::LoadAction::preserveRenderTarget;
        // Popped before the resume so the renderer this pass handed out dies
        // here, not while the resumed frame is live.
        m_canvasPasses.pop_back();
        m_renderContext->beginFrame(std::move(resumed));
    }
#endif

    // Delete our corresponding PLS buffer when a WebGL2RenderBuffer is deleted.
    void onWebGL2BufferDeleted(PLSResourceID webglBufferID)
    {
        m_plsSynchronizedBuffers.erase(webglBufferID);
    }

private:
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    void deferredFlush();
#endif

    // Resolves renderImage to something RiveRenderer can draw and returns
    // whether it's ready to draw
    bool prepImage(const RenderImage*& renderImage)
    {
        auto webglRenderImage = lite_rtti_cast<const WebGL2RenderImage*>(renderImage);
        if (webglRenderImage == nullptr)
        {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
            // Canvas backed images from the deferred replay are not WebGL2
            // images; they draw directly.
            return true;
#else
            // Without a deferred replay every image is a WebGL2 image;
            // anything else is dropped.
            return false;
#endif
        }
        renderImage = ((WebGL2RenderImage*)webglRenderImage)->prep(this, m_contextGL);
        return renderImage != nullptr;
    }

    rcp<RenderBuffer> refPLSBuffer(WebGL2RenderBuffer* wglBuff)
    {
        PLSSynchronizedBuffer& synchronizedBuffer =
            m_plsSynchronizedBuffers.try_emplace(wglBuff->uniqueID(), this, wglBuff).first->second;
        return synchronizedBuffer.get();
    }

    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL = emscripten_webgl_get_current_context();

    std::unique_ptr<RenderContext> m_renderContext;
    rcp<FramebufferRenderTargetGL> m_renderTarget;
    RenderContext::FrameDescriptor m_screenFrame;
#ifdef RIVE_CANVAS
    // One entry per canvas pass that is currently open, outermost first. A
    // single slot would do for one cached artboard, but they nest: the inner
    // pass would overwrite the outer's target and free the renderer the outer
    // artboard is still drawing through, then resume the screen instead of the
    // outer canvas.
    struct CanvasPass
    {
        RenderContext::FrameDescriptor frame;
        rcp<gpu::RenderTarget> target;
        std::unique_ptr<RiveRenderer> renderer;
        // The frame and target this pass interrupted, to be restored at its end.
        RenderContext::FrameDescriptor outerFrame;
        gpu::RenderTarget* outerTarget;
    };
    std::vector<CanvasPass> m_canvasPasses;
    std::vector<std::unique_ptr<RiveRenderer>> m_compositeRenderers;
#endif

    std::map<PLSResourceID, PLSSynchronizedBuffer> m_plsSynchronizedBuffers;

    PLSResourceID m_currentFrameID = 0;

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    // Owned by JS alongside the file that imported through it, never by us.
    WebGL2DeferredSession* m_session = nullptr;
    // Our identity within the session; sessions serve several targets.
    uint64_t m_screenTarget = 0;
    cmd::DeferredInlineHost m_host;
    Renderer* m_target = nullptr;
#endif
};

void WebGL2Factory::unregisterContext(WebGL2Renderer* renderer)
{
    m_renderers.erase(renderer);
    if (m_activeRenderer == renderer)
    {
        // A renderer torn down mid-frame must not leave a dangling claim.
        m_activeRenderer = nullptr;
    }
}

#ifdef RIVE_CANVAS
rive::cmd::DeferredCanvasHost* WebGL2Factory::canvasContentHost() { return m_activeRenderer; }
#endif

RenderImage* WebGL2RenderImage::prep(WebGL2Renderer* webglRenderer,
                                     const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context)
{
    // Only return the existing render image if its from the same context,
    // otherwise we need to re-upload.
    if (context == m_contextGL && m_renderImage)
    {
        return m_renderImage.get();
    }
    if (m_readyToUpload)
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL = context);
        GLuint textureId = 0;
        glGenTextures(1, &textureId);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, textureId);
        webglRenderer->renderContextGL()->state()->bindBuffer(GL_PIXEL_UNPACK_BUFFER, 0);
        upload_image(emscripten_webgl_get_current_context(), reinterpret_cast<uintptr_t>(this));
        glGenerateMipmap(GL_TEXTURE_2D);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        m_renderImage = make_rcp<RiveRenderImage>(
            webglRenderer->renderContextGL()->adoptImageTexture(m_Width, m_Height, textureId));
    }
    return m_renderImage.get();
}

PLSSynchronizedBuffer::PLSSynchronizedBuffer(WebGL2Renderer* webglRenderer,
                                             WebGL2RenderBuffer* webglBuffer) :
    m_contextGL(webglRenderer->contextGL()), m_webglBufferData(webglBuffer->bufferData())

{
    ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
    m_renderBuffer = webglRenderer->renderContextGL()->makeRenderBuffer(webglBuffer->type(),
                                                                        webglBuffer->flags(),
                                                                        webglBuffer->sizeInBytes());
}

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
// Replays the recorded frame into this renderer's canvas.
class WebGL2FrameSink : public cmd::HostFrameSink
{
public:
    WebGL2FrameSink(WebGL2Renderer* renderer, bool clear, ColorInt color, bool replayOre) :
        HostFrameSink(clear, color, renderer->screenTarget(), replayOre), m_renderer(renderer)
    {}

    RenderContext* renderContext() override { return m_renderer->gpuRenderContext(); }

    // The wasm build has no CPU image codecs, so replay decode must use the
    // browser async path, same as the immediate pipeline.
    Factory* factory() override { return WebGL2Factory::Instance(); }

    Renderer* beginScreen(uint64_t, bool clear, uint32_t color) override
    {
        // HostFrameSink already refused every target but the one this sink was
        // built for, so whatever arrives here is ours.
        m_renderer->beginScreenFrame(clear ? gpu::LoadAction::clear
                                           : gpu::LoadAction::preserveRenderTarget,
                                     color);
        return m_renderer;
    }

    Renderer* beginCanvasContent(gpu::RenderCanvas* canvas, uint32_t clearColor) override
    {
        m_activeCanvas = canvas;
        // Back the canvas before content renders so the flush target is valid.
        m_renderer->renderContextGL()->ensureCanvasBacking(canvas);
        RenderContext::FrameDescriptor frameDescriptor = {
            .renderTargetWidth = canvas->width(),
            .renderTargetHeight = canvas->height(),
            .loadAction = gpu::LoadAction::clear,
            .clearColor = clearColor,
        };
        m_renderer->gpuRenderContext()->beginFrame(std::move(frameDescriptor));
        // Draws go through the renderer so async decoded images get prepped.
        // save isolates the canvas content renderer state.
        m_renderer->save();
        return m_renderer;
    }

    void endCanvasContent() override
    {
        if (m_activeCanvas == nullptr)
        {
            return;
        }
        m_renderer->restore();
        HostFrameSink::endCanvasContent();
    }

    // A WebGL2RenderImage is context free until prep() uploads it, and it is
    // not a RiveRenderImage until then, so a bind group wanting its texture
    // has to force the upload here. Null while the browser is still decoding,
    // which drops the dependent make for this frame instead of binding null.
    RenderImage* prepForeignImage(RenderImage* image) override
    {
        if (auto* webglImage = lite_rtti_cast<WebGL2RenderImage*>(image))
        {
            return webglImage->prep(m_renderer, m_renderer->contextGL());
        }
        return image;
    }

private:
    WebGL2Renderer* m_renderer;
};

bool WebGL2Renderer::attachSession(WebGL2DeferredSession* session)
{
    // Detaching goes through detachSession(); a null here is a caller error,
    // and c2d's attach reports the same refusal.
    if (session == nullptr)
    {
        return false;
    }
    if (m_session == session)
    {
        return true;
    }
    // One canvas is one GL context and one ore context, and a session records
    // for exactly one of each, once. A session another renderer already took,
    // live or since destroyed, is spent; the caller re-imports instead.
    if (m_session != nullptr || session->everBound())
    {
        return false;
    }
    ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
    // The file imported with no device at all; this is the first ore context
    // to exist, so bind its replay caps now.
    session->bindReplayCaps(ore::ReplayCaps::from(*m_renderContext->getOreContext()));
    // Scripts imported through the session resolve GPU state through this.
    session->bindRenderContext(m_renderContext.get());
    // A session serves several targets, so claim an identity rather than
    // assuming we are its only one.
    m_screenTarget = session->acquireScreenTarget();
    m_host.bindSession(session, m_screenTarget);
    m_session = session;
    session->bindRenderer(this);
    return true;
}

void WebGL2Renderer::detachSession()
{
    if (m_session == nullptr)
    {
        return;
    }
    WebGL2DeferredSession* session = m_session;
    m_session = nullptr;
    m_target = nullptr;
    ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
    // Whatever we left open is never going to close, and a stuck target holds
    // the session's window shut.
    session->abandonTargetFrame(m_screenTarget);
    // Drops the unreplayed frame while the context is current: it retains real
    // GPU resources and content canvases that only this context can delete.
    session->resetFrame();
    session->releaseScreenTarget(m_screenTarget);
    m_screenTarget = 0;
    m_host.bindSession(nullptr);
    m_host.replayer().reset();
    // The context this points at dies with us; caps are plain values and the
    // session is spent anyway, so they stay bound.
    session->bindRenderContext(nullptr);
    session->bindRenderer(nullptr);
}

rcp<RenderImage> WebGL2DeferredSession::decodeImage(Span<const uint8_t> bytes)
{
    return WebGL2Factory::Instance()->decodeImage(bytes);
}

WebGL2DeferredSession::~WebGL2DeferredSession()
{
    // JS is free to drop the file before its canvas; the renderer keeps a raw
    // pointer to us, so it has to be told first.
    if (m_renderer != nullptr)
    {
        m_renderer->detachSession();
    }
}

void WebGL2Renderer::deferredFlush()
{
    m_target = nullptr;
    if (!m_session->endTargetFrame(m_screenTarget))
    {
        // Another target still owns the window; this canvas keeps its last
        // frame. Unreachable at one target per session — the seam for the
        // worker phase.
        return;
    }
    ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
    WebGL2FrameSink sink(this, m_host.doClear(), m_host.clearColor(), m_host.replayOre());
    m_host.replayInline(sink,
                        [this] { m_renderContext->flush({.renderTarget = m_renderTarget.get()}); });
}

#endif // RIVE_CANVAS && RIVE_ORE

rcp<RenderImage> WebGL2Factory::decodeImage(Span<const uint8_t> encodedBytes)
{
    return make_rcp<WebGL2RenderImage>(encodedBytes);
}

rcp<RenderBuffer> WebGL2Factory::makeRenderBuffer(RenderBufferType type,
                                                  RenderBufferFlags flags,
                                                  size_t sizeInBytes)
{
    return make_rcp<WebGL2RenderBuffer>(type, flags, sizeInBytes);
}

void WebGL2Factory::onWebGL2BufferDeleted(WebGL2RenderBuffer* webglRenderBuffer)
{
    for (WebGL2Renderer* renderer : m_renderers)
    {
        renderer->onWebGL2BufferDeleted(webglRenderBuffer->uniqueID());
    }
}

// JS Hooks.
#ifdef RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS
// Only the standalone build gets its factory from here. bindings_c2d.cpp defines jsFactory()
// whenever canvas 2D is present, including the combined build where WebGL2 covers only the
// draws canvas 2D can't express.
Factory* jsFactory() { return WebGL2Factory::Instance(); }
#endif

#ifdef RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS
EM_JS(void, ensure_images_map, (), {
    if (!Module["images"])
    {
        Module["images"] = new Map();
    }
});

WebGL2RenderImage* adoptWebGL2Image(emscripten::val htmlImage, int width, int height)
{
    // The canvas 2D renderer has already decoded htmlImage, so it can go straight into the images
    // map and be marked ready to upload.
    auto* renderImage = new WebGL2RenderImage();
    ensure_images_map();
    emscripten::val::module_property("images").call<void>(
        "set",
        static_cast<unsigned>(reinterpret_cast<uintptr_t>(renderImage)),
        htmlImage);
    renderImage->setWebImage(width, height);
    return renderImage;
}

rive::rcp<rive::RenderBuffer> makeWebGL2RenderBuffer(RenderBufferType type,
                                                     RenderBufferFlags flags,
                                                     size_t sizeInBytes)
{
    return make_rcp<WebGL2RenderBuffer>(type, flags, sizeInBytes);
}

// Holds a path the canvas 2D renderer delegates to the WebGL2 renderer.
class WebGL2Path : public RefCnt<WebGL2Path>
{
public:
    WebGL2Path() : m_path(WebGL2Factory::Instance()->makeEmptyRenderPath()) {}

    RenderPath* get() const { return m_path.get(); }

private:
    const rcp<RenderPath> m_path;
};

// Holds an image mesh's buffers until the WebGL2 renderer draws it into the atlas.
class WebGL2PendingMesh : public RefCnt<WebGL2PendingMesh>
{
public:
    WebGL2PendingMesh(rcp<RenderBuffer> vertices_f32,
                      rcp<RenderBuffer> uvCoords_f32,
                      rcp<RenderBuffer> indices_u16,
                      uint32_t vertexCount,
                      uint32_t indexCount,
                      ImageSampler imageSampler) :
        m_vertices(std::move(vertices_f32)),
        m_uvCoords(std::move(uvCoords_f32)),
        m_indices(std::move(indices_u16)),
        m_vertexCount(vertexCount),
        m_indexCount(indexCount),
        m_imageSampler(imageSampler)
    {}

    const float* vertices() const
    {
        return reinterpret_cast<const float*>(
            static_cast<WebGL2RenderBuffer*>(m_vertices.get())->bufferData()->contents());
    }

    void draw(WebGL2Renderer& renderer, WebGL2RenderImage* image)
    {
        renderer.drawImageMesh(image,
                               m_imageSampler,
                               m_vertices,
                               m_uvCoords,
                               m_indices,
                               m_vertexCount,
                               m_indexCount,
                               // Blend, opacity and additiveness are applied when the atlas
                               // is composited back to canvas 2D.
                               BlendMode::srcOver,
                               1.0f,
                               0.0f);
    }

private:
    const rcp<RenderBuffer> m_vertices;
    const rcp<RenderBuffer> m_uvCoords;
    const rcp<RenderBuffer> m_indices;
    const uint32_t m_vertexCount;
    const uint32_t m_indexCount;
    const ImageSampler m_imageSampler;
};

WebGL2Path* makeWebGL2Path() { return new WebGL2Path(); }

template <typename T> static std::vector<T> readTypedArray(const val& source)
{
    std::vector<T> values(source["length"].as<size_t>());
    if (!values.empty())
    {
        val{typed_memory_view(values.size(), values.data())}.call<void>("set", source);
    }
    return values;
}

RenderPaint* makeWebGL2Paint(RenderPaintStyle style,
                             ColorInt color,
                             float thickness,
                             StrokeJoin join,
                             StrokeCap cap,
                             float feather,
                             // Null when the paint has no gradient. The arguments after it are
                             // then ignored.
                             const val& gradientColors,
                             const val& gradientStops,
                             bool gradientIsRadial,
                             float sx,
                             float sy,
                             float ex,
                             float ey,
                             float xx,
                             float xy,
                             float yx,
                             float yy,
                             float tx,
                             float ty)
{
    WebGL2Factory* factory = WebGL2Factory::Instance();
    rcp<RenderPaint> paint = factory->makeRenderPaint();
    paint->style(style);
    paint->color(color);
    paint->thickness(thickness);
    paint->join(join);
    paint->cap(cap);
    paint->feather(feather);
    // This paint draws onto the atlas. The blend mode is applied when the atlas is composited back
    // to canvas 2D.
    if (!gradientColors.isNull())
    {
        std::vector<ColorInt> colors = readTypedArray<ColorInt>(gradientColors);
        std::vector<float> stops = readTypedArray<float>(gradientStops);
        const size_t count = std::min(colors.size(), stops.size());
        if (gradientIsRadial)
        {
            // renderer.js gives the radius as a point on the circle.
            float radius = Vec2D(ex - sx, ey - sy).length();
            paint->shader(
                factory->makeRadialGradient(sx, sy, radius, colors.data(), stops.data(), count));
        }
        else
        {
            paint->shader(
                factory->makeLinearGradient(sx, sy, ex, ey, colors.data(), stops.data(), count));
        }
        paint->shaderTransform(Mat2D(xx, xy, yx, yy, tx, ty));
    }
    return paint.release();
}

// outBounds should be an Int32Array to hold the resulting bounds
void webGL2PathPixelBounds(WebGL2Path* path,
                           RenderPaint* paint,
                           float xx,
                           float xy,
                           float yx,
                           float yy,
                           float tx,
                           float ty,
                           val outBounds)
{
    const IAABB bounds = gpu::PathDraw::calculatePixelBounds(Mat2D(xx, xy, yx, yy, tx, ty),
                                                             asRiveRenderPath(path->get()),
                                                             asRiveRenderPaint(paint));
    const int32_t values[4] = {bounds.left, bounds.top, bounds.right, bounds.bottom};
    outBounds.call<void>("set", val{typed_memory_view(4, values)});
}

WebGL2PendingMesh* makeWebGL2PendingMesh(rcp<RenderBuffer> vertices_f32,
                                         rcp<RenderBuffer> uvCoords_f32,
                                         rcp<RenderBuffer> indices_u16,
                                         uint32_t vertexCount,
                                         uint32_t indexCount,
                                         ImageSampler imageSampler)
{
    return new WebGL2PendingMesh(std::move(vertices_f32),
                                 std::move(uvCoords_f32),
                                 std::move(indices_u16),
                                 vertexCount,
                                 indexCount,
                                 imageSampler);
}

const float* webGL2PendingMeshVertices(const WebGL2PendingMesh* mesh) { return mesh->vertices(); }
#endif // RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS

#ifdef RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS
// Resolves the optional deferred session argument the import and decode entry
// points take. Resources for a deferred file must come from the session that
// imported it; everything else, including every other instance on the page,
// stays on the immediate factory.
//
// Like with jsFactory(), this only gets defined if the c2d version is not defined.
Factory* jsSessionFactory(const emscripten::val& session)
{
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    if (!session.isUndefined() && !session.isNull())
    {
        return session.as<WebGL2DeferredSession*>(allow_raw_pointers());
    }
#endif
    // Without deferred support makeDeferredSession is never bound, so JS has
    // no session to pass.
    return WebGL2Factory::Instance();
}
#endif // RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
// JS owns the returned session and deletes it with the file that imported
// through it; the file must not outlive it.
WebGL2DeferredSession* makeDeferredSession() { return new WebGL2DeferredSession(); }

// Pending stream content the artboard's own dirt flag cannot see, so the frame
// gate can keep a recorded stream from parking. Bound as a free function
// because the method is the base class's: embind registers a member pointer
// against the class that declares it, and cmd::DeferredSession is unbound.
// Must be read before the renderer clears: clear opens a recording window that
// marks the stream, so a later read reports every frame as dirty.
bool sessionRecordedThisFrame(WebGL2DeferredSession* session)
{
    return session != nullptr && session->recordedThisFrame();
}
#endif

WebGL2Renderer* makeWebGL2Renderer(int width, int height)
{
    if (auto renderContext = RenderContextGLImpl::MakeContext())
    {
        return new WebGL2Renderer(std::move(renderContext), width, height);
    }
    return nullptr;
}

#ifdef RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS
class WebGL2RenderImageWrapper : public wrapper<RenderImage>
{
public:
    EMSCRIPTEN_WRAPPER(WebGL2RenderImageWrapper);
    void unref() { RenderImage::unref(); }
};

// Optional trailing session: an image bound into a deferred file has to be
// created through that file's session, the rest go to the immediate factory.
WebGL2RenderImageWrapper* decodeWebGL2Image(emscripten::val byteArray, emscripten::val session)
{
    std::vector<unsigned char> vector;

    const auto l = byteArray["byteLength"].as<unsigned>();
    vector.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, vector.data())};
    memoryView.call<void>("set", byteArray);
    rcp rcpImage = jsSessionFactory(session)->decodeImage(vector);
    // NOTE: ref so the image does not get disposed after the scope of this function.
    rcpImage->ref();
    return (WebGL2RenderImageWrapper*)(rcpImage.get());
}
#endif

EMSCRIPTEN_BINDINGS(RiveWASM_WebGL2)
{
#if defined(RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS) &&                                           \
    defined(RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS)
#error RIVE_WEBGL2_RENDERER cannot have both _STANDALONE_BINDINGS and _CANVAS_BINDINGS enabled
#elif defined(RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS)
    class_<Renderer>("Renderer")
        .function("save", &Renderer::save)
        .function("restore", &Renderer::restore)
        .function("transform", &Renderer::transform, allow_raw_pointers())
        .function("modulateOpacity", &Renderer::modulateOpacity)
        .function("drawPath", &Renderer::drawPath, allow_raw_pointers())
        .function("clipPath", &Renderer::clipPath, allow_raw_pointers())
        .function(
            "align",
            select_overload<void(Renderer&, Fit, JsAlignment, const AABB&, const AABB&, float)>(
                [](Renderer& self,
                   Fit fit,
                   JsAlignment alignment,
                   const AABB& frame,
                   const AABB& content,
                   float scaleFactor) {
                    self.align(fit, convertAlignment(alignment), frame, content, scaleFactor);
                }));
    class_<WebGL2Renderer, base<Renderer>>("WebGL2Renderer")
        .function("clear", &WebGL2Renderer::clear)
        .function("flush", &WebGL2Renderer::flush)
        .function("resize", &WebGL2Renderer::resize)
        .function("saveClipRect", &WebGL2Renderer::saveClipRect)
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        .function("attachSession", &WebGL2Renderer::attachSession, allow_raw_pointers())
        .function("detachSession", &WebGL2Renderer::detachSession)
        .function("deferredActive", &WebGL2Renderer::deferredActive)
#endif
        .function("restoreClipRect", &WebGL2Renderer::restoreClipRect);
    class_<RenderImage>("RenderImage")
        .function("unref", &WebGL2RenderImageWrapper::unref)
        .allow_subclass<WebGL2RenderImageWrapper>("RenderImageWrapper");

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    // Deferred resources are Factory resources, so JS can hand the session
    // straight to load()/decode*() wherever a factory is expected.
    class_<WebGL2DeferredSession, base<Factory>>("DeferredSession")
        .function("recordedThisFrame", &sessionRecordedThisFrame, allow_raw_pointers());
    function("makeDeferredSession", &makeDeferredSession, allow_raw_pointers());
#endif
    function("makeRenderer", &makeWebGL2Renderer, allow_raw_pointers());
    function("decodeWebGL2Image", &decodeWebGL2Image, allow_raw_pointers());
#elif defined(RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS)
#if !defined(RIVE_CANVAS_2D_RENDERER)
#error RIVE_WEBGL2_RENDERER uses _CANVAS_BINDINGS but RIVE_CANVAS_2D_RENDERER is not enabled
#endif

    // bindings_c2d.cpp registers class_<rive::Renderer>, so the inherited methods are bound onto
    // WebGL2Renderer itself here.
    class_<WebGL2Renderer>("WebGL2Renderer")
        .function("save",
                  select_overload<void(WebGL2Renderer&)>([](WebGL2Renderer& self) { self.save(); }))
        .function("restore", select_overload<void(WebGL2Renderer&)>([](WebGL2Renderer& self) {
                      self.restore();
                  }))
        .function(
            "transform",
            select_overload<void(WebGL2Renderer&, const Mat2D&)>(
                [](WebGL2Renderer& self, const Mat2D& transform) { self.transform(transform); }))
        .function("modulateOpacity",
                  select_overload<void(WebGL2Renderer&, float)>(
                      [](WebGL2Renderer& self, float opacity) { self.modulateOpacity(opacity); }))
        .function("drawPath",
                  select_overload<void(WebGL2Renderer&, WebGL2Path*, RenderPaint*)>(
                      [](WebGL2Renderer& self, WebGL2Path* path, RenderPaint* paint) {
                          self.drawPath(path->get(), paint);
                      }),
                  allow_raw_pointers())
        .function("clipPath",
                  select_overload<void(WebGL2Renderer&, RenderPath*)>(
                      [](WebGL2Renderer& self, RenderPath* path) { self.clipPath(path); }),
                  allow_raw_pointers())
        .function("clear", &WebGL2Renderer::clear)
        .function("flush", &WebGL2Renderer::flush)
        .function("resize", &WebGL2Renderer::resize)
        .function("saveClipRect", &WebGL2Renderer::saveClipRect)
        .function("restoreClipRect", &WebGL2Renderer::restoreClipRect);

    class_<WebGL2RenderImage>("WebGL2RenderImage")
        .function("unref", select_overload<void(WebGL2RenderImage&)>([](WebGL2RenderImage& self) {
                      self.unref();
                  }));

    class_<WebGL2PendingMesh>("WebGL2PendingMesh")
        .function("unref", select_overload<void(WebGL2PendingMesh&)>([](WebGL2PendingMesh& self) {
                      self.unref();
                  }));

    class_<WebGL2Path>("WebGL2Path")
        .function("fillRule",
                  select_overload<void(WebGL2Path&, FillRule)>(
                      [](WebGL2Path& self, FillRule rule) { self.get()->fillRule(rule); }))
        .function("moveTo",
                  select_overload<void(WebGL2Path&, float, float)>(
                      [](WebGL2Path& self, float x, float y) { self.get()->moveTo(x, y); }))
        .function("lineTo",
                  select_overload<void(WebGL2Path&, float, float)>(
                      [](WebGL2Path& self, float x, float y) { self.get()->lineTo(x, y); }))
        .function(
            "cubicTo",
            select_overload<void(WebGL2Path&, float, float, float, float, float, float)>(
                [](WebGL2Path& self, float ox, float oy, float ix, float iy, float x, float y) {
                    self.get()->cubicTo(ox, oy, ix, iy, x, y);
                }))
        .function("close",
                  select_overload<void(WebGL2Path&)>([](WebGL2Path& self) { self.get()->close(); }))
        .function(
            "addPath",
            select_overload<
                void(WebGL2Path&, WebGL2Path*, float, float, float, float, float, float)>(
                [](WebGL2Path& self,
                   WebGL2Path* other,
                   float xx,
                   float xy,
                   float yx,
                   float yy,
                   float tx,
                   float ty) { self.get()->addPath(other->get(), Mat2D(xx, xy, yx, yy, tx, ty)); }),
            allow_raw_pointers())
        .function("ref", select_overload<void(WebGL2Path&)>([](WebGL2Path& self) { self.ref(); }))
        .function("unref",
                  select_overload<void(WebGL2Path&)>([](WebGL2Path& self) { self.unref(); }));

    function("makeWebGL2Path", &makeWebGL2Path, allow_raw_pointers());
    function("webGL2PathPixelBounds", &webGL2PathPixelBounds, allow_raw_pointers());
    function("makeWebGL2Paint", &makeWebGL2Paint, allow_raw_pointers());
    function("refWebGL2Paint",
             optional_override([](RenderPaint* paint) { paint->ref(); }),
             allow_raw_pointers());
    function("unrefWebGL2Paint",
             optional_override([](RenderPaint* paint) { paint->unref(); }),
             allow_raw_pointers());
    function("makeWebGL2Renderer", &makeWebGL2Renderer, allow_raw_pointers());
    function("adoptWebGL2Image", &adoptWebGL2Image, allow_raw_pointers());
    function("drawWebGL2PendingMesh",
             optional_override([](WebGL2Renderer& renderer,
                                  WebGL2PendingMesh* mesh,
                                  WebGL2RenderImage* image) { mesh->draw(renderer, image); }),
             allow_raw_pointers());
#else
#error RIVE_WEBGL2_RENDERER must have either _STANDALONE_BINDINGS or _CANVAS_BINDINGS enabled
#endif
}

#endif // RIVE_WEBGL2_RENDERER
