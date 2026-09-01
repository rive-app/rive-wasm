#include "rive/rive_types.hpp"

#ifdef RIVE_WEBGL2_RENDERER

#include "rive/renderer/rive_render_image.hpp"
#include "rive/renderer/gl/render_context_gl_impl.hpp"
#include "rive/renderer/rive_renderer.hpp"
#include "rive/renderer/gl/render_target_gl.hpp"
#include "js_alignment.hpp"

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
#include "rive/renderer/cmd/deferred_host.hpp"
#if defined(WITH_RIVE_SCRIPTING)
#include "rive/file.hpp"
#include "rive/lua/rive_lua_libs.hpp"
#include "rive/lua/scripting_vm.hpp"
#endif
#endif

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <emscripten/html5.h>
using namespace emscripten;

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
    void unregisterContext(WebGL2Renderer* renderer) { m_renderers.erase(renderer); }

    // Hooks for WebGL 2 objects to notify all contexts when they get deleted.
    void onWebGL2BufferDeleted(WebGL2RenderBuffer*);

    rcp<RenderImage> decodeImage(Span<const uint8_t> encodedBytes) override;
    rcp<RenderBuffer> makeRenderBuffer(RenderBufferType,
                                       RenderBufferFlags,
                                       size_t sizeInBytes) override;

private:
    WebGL2Factory() = default;

    std::set<WebGL2Renderer*> m_renderers;
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

        ref();
        decode_image(reinterpret_cast<uintptr_t>(this),
                     reinterpret_cast<uintptr_t>(encodedBytes.data()),
                     encodedBytes.size());
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
{
public:
    WebGL2Renderer(std::unique_ptr<RenderContext> renderContext, int width, int height) :
        RiveRenderer(renderContext.get()), m_renderContext(std::move(renderContext))
    {
        resize(width, height);
    }

    ~WebGL2Renderer()
    {
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
        m_renderContext->beginFrame(std::move(frameDescriptor));
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
                   float opacity) override
    {
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
        if (m_target != nullptr)
        {
            m_target->drawImage(renderImage, imageSampler, blendMode, opacity);
            return;
        }
        // Canvas backed images from the deferred replay are not WebGL2
        // images; they draw directly.
        if (auto webglRenderImage = lite_rtti_cast<const WebGL2RenderImage*>(renderImage))
        {
            renderImage = ((WebGL2RenderImage*)webglRenderImage)->prep(this, m_contextGL);
            if (renderImage == nullptr)
            {
                // Still decoding.
                return;
            }
        }
#else
        // Without a deferred replay every image is a WebGL2 image; anything
        // else is dropped.
        LITE_RTTI_CAST_OR_RETURN(webglRenderImage, const WebGL2RenderImage*, renderImage);
        renderImage = ((WebGL2RenderImage*)webglRenderImage)->prep(this, m_contextGL);
        if (renderImage == nullptr)
        {
            // Still decoding.
            return;
        }
#endif
        RiveRenderer::drawImage(renderImage, imageSampler, blendMode, opacity);
    }

    void drawImageMesh(const RenderImage* renderImage,
                       const ImageSampler imageSampler,
                       rcp<RenderBuffer> vertices_f32,
                       rcp<RenderBuffer> uvCoords_f32,
                       rcp<RenderBuffer> indices_u16,
                       uint32_t vertexCount,
                       uint32_t indexCount,
                       BlendMode blendMode,
                       float opacity) override
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
                                    opacity);
            return;
        }
        // Canvas backed images from the deferred replay are not WebGL2
        // images; they draw directly.
        if (auto webglRenderImage = lite_rtti_cast<const WebGL2RenderImage*>(renderImage))
        {
            renderImage = ((WebGL2RenderImage*)webglRenderImage)->prep(this, m_contextGL);
            if (renderImage == nullptr)
            {
                // Still decoding.
                return;
            }
        }
#else
        // Without a deferred replay every image is a WebGL2 image; anything
        // else is dropped.
        LITE_RTTI_CAST_OR_RETURN(webglRenderImage, const WebGL2RenderImage*, renderImage);
        renderImage = ((WebGL2RenderImage*)webglRenderImage)->prep(this, m_contextGL);
        if (renderImage == nullptr)
        {
            // Still decoding.
            return;
        }
#endif
        {
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
                                        opacity);
        }
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

    // Delete our corresponding PLS buffer when a WebGL2RenderBuffer is deleted.
    void onWebGL2BufferDeleted(PLSResourceID webglBufferID)
    {
        m_plsSynchronizedBuffers.erase(webglBufferID);
    }

private:
#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    void deferredFlush();
#endif

    rcp<RenderBuffer> refPLSBuffer(WebGL2RenderBuffer* wglBuff)
    {
        PLSSynchronizedBuffer& synchronizedBuffer =
            m_plsSynchronizedBuffers.try_emplace(wglBuff->uniqueID(), this, wglBuff).first->second;
        return synchronizedBuffer.get();
    }

    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL = emscripten_webgl_get_current_context();

    std::unique_ptr<RenderContext> m_renderContext;
    rcp<FramebufferRenderTargetGL> m_renderTarget;

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
Factory* jsFactory() { return WebGL2Factory::Instance(); }

// Resolves the optional deferred session argument the import and decode entry
// points take. Resources for a deferred file must come from the session that
// imported it; everything else, including every other instance on the page,
// stays on the immediate factory.
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

class RenderImageWrapper : public wrapper<RenderImage>
{
public:
    EMSCRIPTEN_WRAPPER(RenderImageWrapper);
    void unref() { RenderImage::unref(); }
};

// Optional trailing session: an image bound into a deferred file has to be
// created through that file's session, the rest go to the immediate factory.
RenderImageWrapper* decodeWebGL2Image(emscripten::val byteArray, emscripten::val session)
{
    std::vector<unsigned char> vector;

    const auto l = byteArray["byteLength"].as<unsigned>();
    vector.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, vector.data())};
    memoryView.call<void>("set", byteArray);
    rcp rcpImage = jsSessionFactory(session)->decodeImage(vector);
    // NOTE: ref so the image does not get disposed after the scope of this function.
    rcpImage->ref();
    return (RenderImageWrapper*)(rcpImage.get());
}

EMSCRIPTEN_BINDINGS(RiveWASM_WebGL2)
{
    class_<Renderer>("Renderer")
        .function("save", &Renderer::save)
        .function("restore", &Renderer::restore)
        .function("transform", &Renderer::transform, allow_raw_pointers())
        .function("modulateOpacity", &Renderer::modulateOpacity)
        .function("drawPath", &Renderer::drawPath, allow_raw_pointers())
        .function("clipPath", &Renderer::clipPath, allow_raw_pointers())
        .function("align",
                  optional_override([](Renderer& self,
                                       Fit fit,
                                       JsAlignment alignment,
                                       const AABB& frame,
                                       const AABB& content,
                                       const float scaleFactor = 1.0f) {
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
        .function("unref", &RenderImageWrapper::unref)
        .allow_subclass<RenderImageWrapper>("RenderImageWrapper");

#if defined(RIVE_CANVAS) && defined(RIVE_ORE)
    // Deferred resources are Factory resources, so JS can hand the session
    // straight to load()/decode*() wherever a factory is expected.
    class_<WebGL2DeferredSession, base<Factory>>("DeferredSession")
        .function("recordedThisFrame", &sessionRecordedThisFrame, allow_raw_pointers());
    function("makeDeferredSession", &makeDeferredSession, allow_raw_pointers());
#endif
    function("makeRenderer", &makeWebGL2Renderer, allow_raw_pointers());
    function("decodeWebGL2Image", &decodeWebGL2Image, allow_raw_pointers());
}

#endif // RIVE_WEBGL2_RENDERER
