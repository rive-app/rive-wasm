#include "rive/rive_types.hpp"

#ifdef RIVE_WEBGL2_RENDERER

#include "rive/renderer/rive_render_image.hpp"
#include "rive/renderer/gl/render_context_gl_impl.hpp"
#include "rive/renderer/rive_renderer.hpp"
#include "rive/renderer/gl/render_target_gl.hpp"
#include "js_alignment.hpp"

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

static std::atomic<PLSResourceID> s_nextWebGL2ImageID;
static std::atomic<PLSResourceID> s_nextWebGL2BufferID;

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
    void onWebGL2ImageDeleted(WebGL2RenderImage*);
    void onWebGL2BufferDeleted(WebGL2RenderBuffer*);

    rcp<RenderImage> decodeImage(Span<const uint8_t> encodedBytes) override;
    rcp<RenderBuffer> makeRenderBuffer(RenderBufferType,
                                       RenderBufferFlags,
                                       size_t sizeInBytes) override;

private:
    WebGL2Factory() = default;

    std::set<WebGL2Renderer*> m_renderers;
};

// High-level, context agnostic RenderImage for the WebGL2 system. Wraps a blob of encoded image
// data, which is then decoded and uploaded to a texture on each separate context.
class WebGL2RenderImage : public LITE_RTTI_OVERRIDE(RenderImage, WebGL2RenderImage)
{
public:
    WebGL2RenderImage(Span<const uint8_t> encodedBytes) :
        m_encodedBytes(encodedBytes.begin(), encodedBytes.end())
    {
        m_Width = 0;
        m_Height = 0;
    }

    ~WebGL2RenderImage() { WebGL2Factory::Instance()->onWebGL2ImageDeleted(this); }

    PLSResourceID uniqueID() const { return m_uniqueID; }
    const std::vector<const uint8_t>& encodedBytes() const { return m_encodedBytes; }

private:
    friend class PLSPromiseImage;
    const PLSResourceID m_uniqueID = ++s_nextWebGL2ImageID;
    const std::vector<const uint8_t> m_encodedBytes;
};

// RAII utility to set and restore the current GL context.
class ScopedGLContextMakeCurrent
{
public:
    ScopedGLContextMakeCurrent(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE contextGL) :
        m_contextGL(contextGL), m_previousContext(emscripten_webgl_get_current_context())
    {
        if (m_contextGL != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_contextGL);
        }
    }

    ~ScopedGLContextMakeCurrent()
    {
        if (m_contextGL != m_previousContext)
        {
            emscripten_webgl_make_context_current(m_previousContext);
        }
    }

private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL;
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_previousContext;
};

// Wraps an Image that will be decoded in the future.
class PLSPromiseImage
{
public:
    PLSPromiseImage(const PLSPromiseImage&) = delete;
    PLSPromiseImage& operator=(const PLSPromiseImage&) = delete;

    PLSPromiseImage(const WebGL2Renderer*, const WebGL2RenderImage*);

    PLSPromiseImage(PLSPromiseImage&& rval) :
        m_contextGL(rval.m_contextGL),
        m_decodingTextureID(rval.m_decodingTextureID),
        m_renderImage(std::move(rval.m_renderImage))
    {}

    ~PLSPromiseImage()
    {
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        if (m_decodingTextureID != 0)
        {
            glDeleteTextures(1, &m_decodingTextureID);
        }
        m_renderImage.reset();
    }

    RiveRenderImage* getImage(const WebGL2Renderer*, const WebGL2RenderImage*);

private:
    const EMSCRIPTEN_WEBGL_CONTEXT_HANDLE m_contextGL;
    GLuint m_decodingTextureID = 0;
    rcp<RiveRenderImage> m_renderImage;
    PLSResourceID m_frameIDWhenValid = 0;
};

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
        m_plsSynchronizedBuffers.clear();
        m_plsPromiseImages.clear();
        m_renderTarget.release();
        m_renderContext.release();
    }

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE contextGL() const { return m_contextGL; }

    PLSResourceID currentFrameID() const { return m_currentFrameID; }

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
        RenderContext::FrameDescriptor frameDescriptor = {
            .renderTargetWidth = m_renderTarget->width(),
            .renderTargetHeight = m_renderTarget->height(),
            .loadAction = gpu::LoadAction::clear,
            .clearColor = 0,
        };
        if (m_renderTarget->sampleCount() > 1)
        {
            // Use MSAA if we were given a canvas with 'antialias: true'.
            frameDescriptor.msaaSampleCount = m_renderTarget->sampleCount();
        }
        else if (!m_renderContext->platformFeatures().supportsRasterOrdering &&
                 !m_renderContext->platformFeatures().supportsFragmentShaderAtomics)
        {
            // Always use MSAA if we don't have WEBGL_shader_pixel_local_storage.
            frameDescriptor.msaaSampleCount = 4;
        }
        m_renderContext->beginFrame(std::move(frameDescriptor));
        ++m_currentFrameID;
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

    void drawImage(const RenderImage* renderImage, BlendMode blendMode, float opacity) override
    {
        LITE_RTTI_CAST_OR_RETURN(webglRenderImage, const WebGL2RenderImage*, renderImage);
        if (RiveRenderImage* renderImage = getImage(webglRenderImage))
        {
            // The renderImage is done decoding.
            RiveRenderer::drawImage(renderImage, blendMode, opacity);
        }
    }

    void drawImageMesh(const RenderImage* renderImage,
                       rcp<RenderBuffer> vertices_f32,
                       rcp<RenderBuffer> uvCoords_f32,
                       rcp<RenderBuffer> indices_u16,
                       uint32_t vertexCount,
                       uint32_t indexCount,
                       BlendMode blendMode,
                       float opacity) override
    {
        LITE_RTTI_CAST_OR_RETURN(webglRenderImage, const WebGL2RenderImage*, renderImage);
        if (RiveRenderImage* renderImage = getImage(webglRenderImage))
        {
            // The renderImage is done decoding.
            LITE_RTTI_CAST_OR_RETURN(vertexBuffer, WebGL2RenderBuffer*, vertices_f32.get());
            LITE_RTTI_CAST_OR_RETURN(uvBuffer, WebGL2RenderBuffer*, uvCoords_f32.get());
            LITE_RTTI_CAST_OR_RETURN(indexBuffer, WebGL2RenderBuffer*, indices_u16.get());
            RiveRenderer::drawImageMesh(renderImage,
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
        ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
        m_renderContext->flush({.renderTarget = m_renderTarget.get()});
    }

    // Delete our corresponding PLS image when a WebGL2RenderImage is deleted.
    void onWebGL2ImageDeleted(PLSResourceID webglImageID)
    {
        m_plsPromiseImages.erase(webglImageID);
    }

    // Delete our corresponding PLS buffer when a WebGL2RenderBuffer is deleted.
    void onWebGL2BufferDeleted(PLSResourceID webglBufferID)
    {
        m_plsSynchronizedBuffers.erase(webglBufferID);
    }

private:
    RiveRenderImage* getImage(const WebGL2RenderImage* webglImage)
    {
        PLSPromiseImage& promiseImage =
            m_plsPromiseImages.try_emplace(webglImage->uniqueID(), this, webglImage).first->second;
        return promiseImage.getImage(this, webglImage);
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

    std::map<PLSResourceID, PLSPromiseImage> m_plsPromiseImages;
    std::map<PLSResourceID, PLSSynchronizedBuffer> m_plsSynchronizedBuffers;

    PLSResourceID m_currentFrameID = 0;
};

EM_JS(void, begin_texture_image_decode, (GLuint texture, uintptr_t imgDataPtr, int imgDataLength), {
    texture = GL.textures[texture];
    texture.image = new Image();
    texture.image.src = URL.createObjectURL(
        new Blob([Module["HEAP8"].subarray(imgDataPtr, imgDataPtr + imgDataLength)]),
        {type : "image/png"});
    texture.complete = false;
});

EM_JS(bool, is_texture_image_done_decoding, (GLuint texture), {
    texture = GL.textures[texture];
    return texture.complete || texture.image.complete;
});

EM_JS(void, set_decoded_tex_image_2d, (EMSCRIPTEN_WEBGL_CONTEXT_HANDLE gl, GLuint texture), {
    gl = GL.getContext(gl).GLctx;
    texture = GL.textures[texture];
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    texture.imageWidth = texture.image.width;
    texture.imageHeight = texture.image.height;
    texture.complete = true;
    delete texture.image;
});

EM_JS(int, texture_image_width, (GLuint texture), {
    texture = GL.textures[texture];
    return texture.imageWidth;
});

EM_JS(int, texture_image_height, (GLuint texture), {
    texture = GL.textures[texture];
    return texture.imageHeight;
});

PLSPromiseImage::PLSPromiseImage(const WebGL2Renderer* webglRenderer,
                                 const WebGL2RenderImage* webglRenderImage) :
    m_contextGL(webglRenderer->contextGL())
{
    ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
    glGenTextures(1, &m_decodingTextureID);
    if (m_decodingTextureID != 0)
    {
        begin_texture_image_decode(
            m_decodingTextureID,
            reinterpret_cast<uintptr_t>(webglRenderImage->encodedBytes().data()),
            webglRenderImage->encodedBytes().size());
    }
}

RiveRenderImage* PLSPromiseImage::getImage(const WebGL2Renderer* webglRenderer,
                                           const WebGL2RenderImage* webglRenderImage)
{
    assert(emscripten_webgl_get_current_context() == m_contextGL);
    if (m_renderImage == nullptr) // Is the image not yet decoded?
    {
        if (m_decodingTextureID != 0 && is_texture_image_done_decoding(m_decodingTextureID))
        {
            // The HTML image just finished decoding.
            ScopedGLContextMakeCurrent makeCurrent(m_contextGL);
            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_2D, m_decodingTextureID);
            webglRenderer->renderContextGL()->state()->bindBuffer(GL_PIXEL_UNPACK_BUFFER, 0);
            set_decoded_tex_image_2d(emscripten_webgl_get_current_context(), m_decodingTextureID);
            glGenerateMipmap(GL_TEXTURE_2D);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
            m_renderImage =
                make_rcp<RiveRenderImage>(webglRenderer->renderContextGL()->adoptImageTexture(
                    texture_image_width(m_decodingTextureID),
                    texture_image_height(m_decodingTextureID),
                    m_decodingTextureID));
            m_decodingTextureID = 0;
            if (webglRenderImage->width() != m_renderImage->width() ||
                webglRenderImage->height() != m_renderImage->width())
            {
                assert(webglRenderImage->width() == 0);
                assert(webglRenderImage->height() == 0);
                // Update the WebGL2RenderImage's size now that we have a decoded image.
                const_cast<WebGL2RenderImage*>(webglRenderImage)->m_Width = m_renderImage->width();
                const_cast<WebGL2RenderImage*>(webglRenderImage)->m_Height =
                    m_renderImage->height();
            }
            // Don't draw until next frame. Even though the image is fully decoded at this point,
            // the runtime already positioned it based on its previous, potentially empty size.
            m_frameIDWhenValid = webglRenderer->currentFrameID() + 1;
        }
    }
    return webglRenderer->currentFrameID() >= m_frameIDWhenValid ? m_renderImage.get() : nullptr;
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

void WebGL2Factory::onWebGL2ImageDeleted(WebGL2RenderImage* webglRenderImage)
{
    for (WebGL2Renderer* renderer : m_renderers)
    {
        renderer->onWebGL2ImageDeleted(webglRenderImage->uniqueID());
    }
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

RenderImageWrapper* decodeWebGL2Image(emscripten::val byteArray)
{
    std::vector<unsigned char> vector;

    const auto l = byteArray["byteLength"].as<unsigned>();
    vector.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, vector.data())};
    memoryView.call<void>("set", byteArray);
    rcp rcpImage = jsFactory()->decodeImage(vector);
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
        .function("drawPath", &Renderer::drawPath, allow_raw_pointers())
        .function("clipPath", &Renderer::clipPath, allow_raw_pointers())
        .function("align",
                  optional_override([](Renderer& self,
                                       Fit fit,
                                       JsAlignment alignment,
                                       const AABB& frame,
                                       const AABB& content) {
                      self.align(fit, convertAlignment(alignment), frame, content);
                  }));
    class_<WebGL2Renderer, base<Renderer>>("WebGL2Renderer")
        .function("clear", &WebGL2Renderer::clear)
        .function("flush", &WebGL2Renderer::flush)
        .function("resize", &WebGL2Renderer::resize)
        .function("saveClipRect", &WebGL2Renderer::saveClipRect)
        .function("restoreClipRect", &WebGL2Renderer::restoreClipRect);
    class_<RenderImage>("RenderImage")
        .function("unref", &RenderImageWrapper::unref)
        .allow_subclass<RenderImageWrapper>("RenderImageWrapper");

    function("makeRenderer", &makeWebGL2Renderer, allow_raw_pointers());
    function("decodeWebGL2Image", &decodeWebGL2Image, allow_raw_pointers());
}

#endif // RIVE_WEBGL2_RENDERER
