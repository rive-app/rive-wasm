#include "rive/rive_types.hpp"

#ifdef RIVE_CANVAS_2D_RENDERER

#include "rive/factory.hpp"
#include "rive/renderer.hpp"
#include "rive/math/path_types.hpp"
#include "rive/renderer/cmd/deferred_replayer.hpp"
#include "rive/renderer/cmd/deferred_session.hpp"
#include "utils/factory_utils.hpp"

#include "rive/assets/file_asset.hpp"
#include "rive/assets/image_asset.hpp"

#include "skia_imports/include/private/SkVx.h"
#include "js_alignment.hpp"
#include "webgl2_bridge.hpp"

#include <cmath>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <vector>

using namespace emscripten;

#ifdef WITH_RIVE_TOOLS
// Defined at the bottom of this file.
extern rive::Factory* jsFactory();
#endif

// Computes the post-transform bounding box of an array of points in high
// performance WASM SIMD.
static std::array<float, 4> bbox(const float m[6], const float* vertexData, int numVertexFloats)
{
    using float2 = skvx::Vec<2, float>;
    using float4 = skvx::Vec<4, float>;

    assert(numVertexFloats > 0);
    assert(numVertexFloats % 2 == 0); // numVertexFloats must be even -- 2 floats per vertex.

    float4 scale = {m[0], m[3], m[0], m[3]};
    float4 skew = {m[2], m[1], m[2], m[1]};
    float2 translate = {m[4], m[5]};

    // Compute two partial bounding boxes in parallel lanes of float4. Defer the translation until
    // after min/max reduction.
    float4 partialTopLefts, partialBotRights;
    float4 v0;
    int i;
    // TODO: could 128-bit alignment on loads impact our speed in WASM?
    if (!(numVertexFloats & 3))
    {
        // Even number of vertices -- number of floats is divisible by 4. Load 2
        // vertices initially.
        v0 = float4::Load(vertexData);
        i = 4;
    }
    else
    {
        // Odd number of vertices. Load 1 vertex initially so the rest will be
        // divisible by 4.
        v0 = float2::Load(vertexData).xyxy();
        i = 2;
    }
    partialTopLefts = partialBotRights = v0 * scale + v0.yxwz() * skew;
    // Crunch the remaining vertices in float4 SIMD.
    for (; i < numVertexFloats; i += 4)
    {
        float4 v = float4::Load(vertexData + i);
        v = v * scale + v.yxwz() * skew;
        partialTopLefts = min(partialTopLefts, v);
        partialBotRights = max(partialBotRights, v);
    }
    assert(i == numVertexFloats);

    // Merge the two parallel bounding boxes into one complete, translated,
    // integer bounding box.
    float2 topLeft = floor(min(partialTopLefts.lo, partialTopLefts.hi) + translate);
    float2 botRight = ceil(max(partialBotRights.lo, partialBotRights.hi) + translate);
    return {topLeft.x(), topLeft.y(), botRight.x(), botRight.y()};
}

class Canvas2DRendererWrapper : public wrapper<rive::Renderer>
{
public:
    EMSCRIPTEN_WRAPPER(Canvas2DRendererWrapper);

    void save() override { call<void>("save"); }

    void restore() override { call<void>("restore"); }

    void transform(const rive::Mat2D& transform) override
    {
        call<void>("transform",
                   transform.xx(),
                   transform.xy(),
                   transform.yx(),
                   transform.yy(),
                   transform.tx(),
                   transform.ty());
    }

    void modulateOpacity(float opacity) override { call<void>("modulateOpacity", opacity); }

    void align(rive::Fit fit,
               JsAlignment alignment,
               const rive::AABB& foo,
               const rive::AABB& bar,
               const float scaleFactor = 1.0f)
    {
        transform(computeAlignment(fit, convertAlignment(alignment), foo, bar, scaleFactor));
    }

    void drawPath(rive::RenderPath* path, rive::RenderPaint* paint) override
    {
        call<void>("_drawPath", path, paint, allow_raw_pointers());
    }

    void clipPath(rive::RenderPath* path) override
    {
        call<void>("_clipPath", path, allow_raw_pointers());
    }

    void drawImage(const rive::RenderImage* image,
                   const rive::ImageSampler options,
                   rive::BlendMode value,
                   float opacity) override
    {
        call<void>("_drawRiveImage", image, value, opacity, allow_raw_pointers());
    }

    void drawImageMesh(const rive::RenderImage* image,
                       const rive::ImageSampler options,
                       rive::rcp<rive::RenderBuffer> vertices_f32,
                       rive::rcp<rive::RenderBuffer> uvCoords_f32,
                       rive::rcp<rive::RenderBuffer> indices_u16,
                       uint32_t vertexCount,
                       uint32_t indexCount,
                       rive::BlendMode value,
                       float opacity) override
    {
        uint32_t f32Count = vertexCount * 2;
        assert(vertices_f32->sizeInBytes() == f32Count * sizeof(float));
        assert(uvCoords_f32->sizeInBytes() == f32Count * sizeof(float));
        assert(indices_u16->sizeInBytes() == indexCount * sizeof(uint16_t));

        if (f32Count == 0 || indexCount == 0)
        {
            return;
        }

        float m[6];
        emscripten::val mJS{emscripten::typed_memory_view(6, m)};
        call<void>("_getMatrix", mJS);

#ifdef RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS
        // The atlas draw happens after this call returns, so the buffers have to outlive it.
        // WebGL2PendingMesh holds them.
        WebGL2PendingMesh* mesh = makeWebGL2PendingMesh(std::move(vertices_f32),
                                                        std::move(uvCoords_f32),
                                                        std::move(indices_u16),
                                                        vertexCount,
                                                        indexCount,
                                                        options);

        auto [l, t, r, b] = bbox(m, webGL2PendingMeshVertices(mesh), f32Count);

        call<void>("_drawImageMesh", image, mesh, value, opacity, l, t, r, b, allow_raw_pointers());
#else
        LITE_RTTI_CAST_OR_RETURN(vtx, rive::DataRenderBuffer*, vertices_f32.get());
        LITE_RTTI_CAST_OR_RETURN(uv, rive::DataRenderBuffer*, uvCoords_f32.get());
        LITE_RTTI_CAST_OR_RETURN(indices, rive::DataRenderBuffer*, indices_u16.get());

        auto [l, t, r, b] = bbox(m, vtx->f32s(), f32Count);

        // JS copies the buffers out of the heap before this call returns, so passing their
        // offsets is enough.
        call<void>("_drawImageMeshFromHeap",
                   image,
                   value,
                   opacity,
                   reinterpret_cast<intptr_t>(vtx->f32s()),
                   static_cast<int>(f32Count),
                   reinterpret_cast<intptr_t>(uv->f32s()),
                   static_cast<int>(f32Count),
                   reinterpret_cast<intptr_t>(indices->u16s()),
                   static_cast<int>(indexCount),
                   l,
                   t,
                   r,
                   b,
                   allow_raw_pointers());
#endif
    }
};

class Canvas2DRenderPathWrapper : public wrapper<rive::RenderPath>
{
public:
    EMSCRIPTEN_WRAPPER(Canvas2DRenderPathWrapper);

    void rewind() override { call<void>("rewind"); }

    void addRawPath(const rive::RawPath& path) override
    {
        // It might be faster to do this on the JS side, and just pass up the
        // arrays... for now, we do it one segment at a time (each turns into an
        // up-call to JS)
        const rive::Vec2D* pts = path.points().data();
        for (auto v : path.verbs())
        {
            switch ((rive::PathVerb)v)
            {
                case rive::PathVerb::move:
                    move(*pts++);
                    break;
                case rive::PathVerb::line:
                    line(*pts++);
                    break;
                case rive::PathVerb::cubic:
                    cubic(pts[0], pts[1], pts[2]);
                    pts += 3;
                    break;
                case rive::PathVerb::close:
                    close();
                    break;
                default:
                    assert(false); // unexpected verb
            }
        }
        assert(pts - path.points().data() == path.points().size());
    }

    void addRenderPath(const rive::RenderPath* path, const rive::Mat2D& transform) override
    {
        float xx = transform.xx();
        float xy = transform.xy();
        float yx = transform.yx();
        float yy = transform.yy();
        float tx = transform.tx();
        float ty = transform.ty();
        call<void>("addPath", path, xx, xy, yx, yy, tx, ty, allow_raw_pointers());
    }
    void fillRule(rive::FillRule value) override { call<void>("fillRule", value); }

    void moveTo(float x, float y) override { call<void>("moveTo", x, y); }
    void lineTo(float x, float y) override { call<void>("lineTo", x, y); }
    void cubicTo(float ox, float oy, float ix, float iy, float x, float y) override
    {
        call<void>("cubicTo", ox, oy, ix, iy, x, y);
    }
    void close() override { call<void>("close"); }
};

class Canvas2DRenderPaintWrapper;
class Canvas2DGradientShader : public rive::RenderShader
{
private:
    std::vector<float> m_Stops;
    std::vector<rive::ColorInt> m_Colors;

public:
    Canvas2DGradientShader(const rive::ColorInt colors[], const float stops[], int count) :
        m_Stops(stops, stops + count), m_Colors(colors, colors + count)
    {}

    void passStopsToJS(const Canvas2DRenderPaintWrapper& wrapper);

    virtual void passToJS(const Canvas2DRenderPaintWrapper& wrapper) = 0;
};

class Canvas2DLinearGradientShader : public Canvas2DGradientShader
{
private:
    float m_StartX;
    float m_StartY;
    float m_EndX;
    float m_EndY;

public:
    Canvas2DLinearGradientShader(const rive::ColorInt colors[],
                                 const float stops[],
                                 int count,
                                 float sx,
                                 float sy,
                                 float ex,
                                 float ey) :
        Canvas2DGradientShader(colors, stops, count),
        m_StartX(sx),
        m_StartY(sy),
        m_EndX(ex),
        m_EndY(ey)
    {}

    void passToJS(const Canvas2DRenderPaintWrapper& wrapper) override;
};

class Canvas2DRadialGradientShader : public Canvas2DGradientShader
{
private:
    float m_CenterX;
    float m_CenterY;
    float m_Radius;

public:
    Canvas2DRadialGradientShader(const rive::ColorInt colors[],
                                 const float stops[],
                                 int count,
                                 float cx,
                                 float cy,
                                 float r) :
        Canvas2DGradientShader(colors, stops, count), m_CenterX(cx), m_CenterY(cy), m_Radius(r)
    {}

    void passToJS(const Canvas2DRenderPaintWrapper& wrapper) override;
};

class Canvas2DRenderPaintWrapper : public wrapper<rive::RenderPaint>
{
public:
    EMSCRIPTEN_WRAPPER(Canvas2DRenderPaintWrapper);

    void color(unsigned int value) override { call<void>("color", value); }
    void thickness(float value) override { call<void>("thickness", value); }
    void join(rive::StrokeJoin value) override { call<void>("join", value); }
    void cap(rive::StrokeCap value) override { call<void>("cap", value); }
    void feather(float value) override { call<void>("feather", value); }
    void blendMode(rive::BlendMode value) override { call<void>("blendMode", value); }

    void style(rive::RenderPaintStyle value) override { call<void>("style", value); }

    void shader(rive::rcp<rive::RenderShader> shader) override
    {
        if (shader == nullptr)
        {
            call<void>("clearGradient");
            return;
        }
        static_cast<Canvas2DGradientShader*>(shader.get())->passToJS(*this);
    }

    void shaderTransform(const rive::Mat2D& transform) override
    {
        rive::Mat2D gradientTransform = transform;
        rive::Mat2D inverseGradientTransform = transform;
        if (!gradientTransform.invert(&inverseGradientTransform))
        {
            // Ignore a transform that isn't invertible. TODO(ben): some degenerate transforms are
            // still renderable; a vertical scale of 0 leaves a horizontal gradient unchanged.
            gradientTransform = rive::Mat2D();
            inverseGradientTransform = rive::Mat2D();
        }

        // Canvas 2D applies the gradient transform to the whole path, which also scales a stroke's
        // thickness. Under uniform scale renderer.js cancels that by multiplying thickness by
        // thicknessScale. A thicknessScale of 0 means the scale is non-uniform, and renderer.js
        // delegates the stroke to the WebGL2 renderer.
        float thicknessScale = 0;
        if (gradientTransform.hasUniformScale())
        {
            float maxScale = gradientTransform.findMaxScale();
            if (maxScale > 0)
            {
                thicknessScale = 1 / maxScale;
            }
        }

        call<void>("_setGradientTransform",
                   gradientTransform.xx(),
                   gradientTransform.xy(),
                   gradientTransform.yx(),
                   gradientTransform.yy(),
                   gradientTransform.tx(),
                   gradientTransform.ty(),
                   inverseGradientTransform.xx(),
                   inverseGradientTransform.xy(),
                   inverseGradientTransform.yx(),
                   inverseGradientTransform.yy(),
                   inverseGradientTransform.tx(),
                   inverseGradientTransform.ty(),
                   thicknessScale);
    }

    // Bound to JS as `gradientTransform` (rive_advanced.mjs.d.ts), which passes the matrix as six
    // floats.
    void jsGradientTransform(float xx, float xy, float yx, float yy, float tx, float ty)
    {
        shaderTransform(rive::Mat2D(xx, xy, yx, yy, tx, ty));
    }

    void invalidateStroke() override {}
};

void Canvas2DGradientShader::passStopsToJS(const Canvas2DRenderPaintWrapper& wrapper)
{
    // Consider passing in a bulk op encoding into a single array.
    for (std::size_t i = 0; i < m_Stops.size(); i++)
    {
        wrapper.call<void>("addStop", m_Colors[i], m_Stops[i]);
    }
}

void Canvas2DLinearGradientShader::passToJS(const Canvas2DRenderPaintWrapper& wrapper)
{
    wrapper.call<void>("linearGradient", m_StartX, m_StartY, m_EndX, m_EndY);
    passStopsToJS(wrapper);
}

void Canvas2DRadialGradientShader::passToJS(const Canvas2DRenderPaintWrapper& wrapper)
{
    wrapper.call<void>("radialGradient", m_CenterX, m_CenterY, m_CenterX + m_Radius, m_CenterY);
    passStopsToJS(wrapper);
}

class Canvas2DRenderImageWrapper : public wrapper<rive::RenderImage>
{
public:
    EMSCRIPTEN_WRAPPER(Canvas2DRenderImageWrapper);

    bool decode(rive::Span<const uint8_t> bytes)
    {
        emscripten::val byteArray =
            emscripten::val(emscripten::typed_memory_view(bytes.size(), bytes.data()));
        call<val>("decode", byteArray);
        return true;
    }

    void size(int width, int height)
    {
        m_Width = width;
        m_Height = height;
    }
    void unref() { rive::RenderImage::unref(); }
};

namespace rive
{

class Canvas2DFactory : public Factory
{
    rcp<RenderBuffer> makeRenderBuffer(RenderBufferType type,
                                       RenderBufferFlags flags,
                                       size_t sizeInBytes) override
    {
#ifdef RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS
        // The WebGL2 renderer draws the meshes, and it needs its own RenderBuffer implementation.
        return makeWebGL2RenderBuffer(type, flags, sizeInBytes);
#else
        return make_rcp<DataRenderBuffer>(type, flags, sizeInBytes);
#endif
    }

    rcp<RenderShader> makeLinearGradient(float sx,
                                         float sy,
                                         float ex,
                                         float ey,
                                         const ColorInt colors[], // [count]
                                         const float stops[],     // [count]
                                         size_t count) override
    {
        return rcp<RenderShader>(
            new Canvas2DLinearGradientShader(colors, stops, count, sx, sy, ex, ey));
    }
    rcp<RenderShader> makeRadialGradient(float cx,
                                         float cy,
                                         float radius,
                                         const ColorInt colors[], // [count]
                                         const float stops[],     // [count]
                                         size_t count) override
    {
        return rcp<RenderShader>(
            new Canvas2DRadialGradientShader(colors, stops, count, cx, cy, radius));
    }

    rcp<RenderPath> makeRenderPath(RawPath& path, FillRule fr) override
    {
        val renderPath = val::module_property("renderFactory").call<val>("makeRenderPath");
        auto ptr = renderPath.as<RenderPath*>(allow_raw_pointers());
        ptr->addRawPath(path);

        ptr->fillRule(fr);

        return rcp(ptr); // Adopt this ref without increasing the refcount.
    }

    rcp<RenderPath> makeEmptyRenderPath() override
    {
        val renderPath = val::module_property("renderFactory").call<val>("makeRenderPath");
        auto ptr = renderPath.as<RenderPath*>(allow_raw_pointers());
        return rcp(ptr); // Adopt this ref without increasing the refcount.
    }

    rcp<RenderPaint> makeRenderPaint() override
    {
        val renderPaint = val::module_property("renderFactory").call<val>("makeRenderPaint");
        auto ptr = renderPaint.as<RenderPaint*>(allow_raw_pointers());
        return rcp(ptr); // Adopt this ref without increasing the refcount.
    }

    rcp<RenderImage> decodeImage(Span<const uint8_t> bytes) override
    {
        // NOTE::
        // This path is only used for hostedImages & embedded images.
        // I think we should refactor this so everything follows the same path.

        // TODO: seems like we should change the constructor the the JS
        // RenderImage to
        //       be passed the byteArray, and have it decode (or fail) right
        //       away. It could just return null to us for its object if it
        //       failed.
        //   ... that would avoid that tricky cast to Canvas2DRenderImageWrapper*

        val renderImage = val::module_property("renderFactory").call<val>("makeRenderImage");

        rcp<Canvas2DRenderImageWrapper> ptr =
            rcp(renderImage.as<Canvas2DRenderImageWrapper*>(allow_raw_pointers()));
        if (!ptr->decode(bytes))
        {
            // Question, what do we do when we end up here?
            //       safe_unref(ptr);
            //       ptr = nullptr;
        }

        return ptr;
    }
};

#ifdef WITH_RIVE_TOOLS
EM_JS(void, setMaxCanvasAtlasSize, (uint32_t size), {
    canvasOffscreenRenderer.setMaxAtlasSize(size);
});

EM_JS(int, pendingAtlasReleaseCount, (), { return canvasOffscreenRenderer.pendingReleaseCount(); });

// Wrappers that let the test harness run the more involved functions in this file. The harness is a
// separately linked wasm module, so it cannot hold pointers into our heap and reaches us only
// through JS values and these bindings; see
// packages/runtime/tests/common/testing_window_canvas2d.cpp.
class Canvas2DTestUtilities
{
public:
    static void testSetMaxCanvasAtlasSize(uint32_t size) { setMaxCanvasAtlasSize(size); }

    static int testPendingAtlasReleaseCount() { return pendingAtlasReleaseCount(); }

    // Copies `elementCount` elements out of a JS TypedArray into a render buffer on our heap. The
    // source typically views another wasm module's memory, which works because a TypedArray is an
    // ordinary JS object. T must match the source's element type, since TypedArray.set() converts
    // between differing types.
    template <typename T>
    static rive::rcp<rive::RenderBuffer> uploadRenderBuffer(rive::RenderBufferType type,
                                                            const emscripten::val& source,
                                                            size_t elementCount)
    {
        rive::rcp<rive::RenderBuffer> buffer =
            jsFactory()->makeRenderBuffer(type,
                                          rive::RenderBufferFlags::none,
                                          elementCount * sizeof(T));
        T* dst = static_cast<T*>(buffer->map());
        emscripten::val{emscripten::typed_memory_view(elementCount, dst)}.call<void>("set", source);
        buffer->unmap();
        return buffer;
    }

    static void testDrawImageMesh(Canvas2DRendererWrapper* rendererWrapper,
                                  Canvas2DRenderImageWrapper* imageWrapper,
                                  const emscripten::val& vertices_f32,
                                  const emscripten::val& uvCoords_f32,
                                  const emscripten::val& indices_u16,
                                  rive::BlendMode blendMode,
                                  float opacity)
    {
        const uint32_t f32Count = vertices_f32["length"].as<uint32_t>();
        const uint32_t indexCount = indices_u16["length"].as<uint32_t>();
        assert(uvCoords_f32["length"].as<uint32_t>() == f32Count);
        assert(f32Count % 2 == 0);

        static_cast<rive::Renderer*>(rendererWrapper)
            ->drawImageMesh(
                static_cast<rive::RenderImage*>(imageWrapper),
                rive::ImageSampler::LinearClamp(),
                uploadRenderBuffer<float>(rive::RenderBufferType::vertex, vertices_f32, f32Count),
                uploadRenderBuffer<float>(rive::RenderBufferType::vertex, uvCoords_f32, f32Count),
                uploadRenderBuffer<uint16_t>(rive::RenderBufferType::index,
                                             indices_u16,
                                             indexCount),
                f32Count / 2,
                indexCount,
                blendMode,
                opacity);
    }

    static int testImageWidth(Canvas2DRenderImageWrapper* imageWrapper)
    {
        return imageWrapper->width();
    }

    static int testImageHeight(Canvas2DRenderImageWrapper* imageWrapper)
    {
        return imageWrapper->height();
    }
};
#endif // WITH_RIVE_TOOLS
} // namespace rive

// Placeholder for a method that JS implements. Only valid alongside pure_virtual(), which
// guarantees the JS override shadows this binding, so the null is never invoked and its declared
// signature never matters.
template <typename T> constexpr void (T::* pureVirtualMethod())() { return nullptr; }

EMSCRIPTEN_BINDINGS(RiveWASM_C2D)
{
    class_<rive::Renderer>("Renderer")
        .function("save", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("restore", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("transform", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("modulateOpacity", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        // drawPath and clipPath forward to JS under the names _drawPath and _clipPath. align
        // computes the alignment matrix here in C++.
        .function("drawPath", &Canvas2DRendererWrapper::drawPath, allow_raw_pointers())
        .function("clipPath", &Canvas2DRendererWrapper::clipPath, allow_raw_pointers())
        .function("align", &Canvas2DRendererWrapper::align, allow_raw_pointers())
        .allow_subclass<Canvas2DRendererWrapper>("RendererWrapper");

    class_<rive::RenderPath>("RenderPath")
        .function("rewind", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("addPath", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("fillRule", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("moveTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("lineTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("cubicTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("close", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .allow_subclass<Canvas2DRenderPathWrapper>("RenderPathWrapper");
    enum_<rive::RenderPaintStyle>("RenderPaintStyle")
        .value("fill", rive::RenderPaintStyle::fill)
        .value("stroke", rive::RenderPaintStyle::stroke);

    enum_<rive::FillRule>("FillRule")
        .value("nonZero", rive::FillRule::nonZero)
        .value("evenOdd", rive::FillRule::evenOdd)
        .value("clockwise", rive::FillRule::clockwise);

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
        .value("additive", rive::BlendMode::additive)
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

    enum_<rive::ImageWrap>("ImageWrap")
        .value("clamp", rive::ImageWrap::clamp)
        .value("repeat", rive::ImageWrap::repeat)
        .value("mirror", rive::ImageWrap::mirror);
    enum_<rive::ImageFilter>("ImageFilter")
        .value("bilinear", rive::ImageFilter::bilinear)
        .value("nearest", rive::ImageFilter::nearest);

    class_<rive::ImageSampler>("ImageSampler");

    class_<rive::rcp<rive::RenderShader>>("RenderShader");

    class_<rive::RenderPaint>("RenderPaint")
        .function("color", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("style", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("thickness", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("join", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("cap", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("feather", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        .function("blendMode", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        // Implemented in C++, which decomposes the shader into the linearGradient,
        // radialGradient and addStop calls that JS provides.
        .function("shader", &Canvas2DRenderPaintWrapper::shader, allow_raw_pointers())
        .function("gradientTransform", &Canvas2DRenderPaintWrapper::jsGradientTransform)
        .allow_subclass<Canvas2DRenderPaintWrapper>("RenderPaintWrapper");

    class_<rive::RenderImage>("RenderImage")
        .function("size", &Canvas2DRenderImageWrapper::size)
        .function("unref", &Canvas2DRenderImageWrapper::unref)
        .allow_subclass<Canvas2DRenderImageWrapper>("RenderImageWrapper");

#ifdef WITH_RIVE_TOOLS
    class_<rive::Canvas2DTestUtilities>("Canvas2DTestUtilities")
        .class_function("drawImageMesh",
                        &rive::Canvas2DTestUtilities::testDrawImageMesh,
                        allow_raw_pointers())
        .class_function("imageWidth",
                        &rive::Canvas2DTestUtilities::testImageWidth,
                        allow_raw_pointers())
        .class_function("imageHeight",
                        &rive::Canvas2DTestUtilities::testImageHeight,
                        allow_raw_pointers())
        .class_function("setMaxCanvasAtlasSize",
                        &rive::Canvas2DTestUtilities::testSetMaxCanvasAtlasSize)
        .class_function("pendingAtlasReleaseCount",
                        &rive::Canvas2DTestUtilities::testPendingAtlasReleaseCount);
#endif
}

static rive::Canvas2DFactory gCanvas2DFactory;

namespace
{
// Pure 2D deferred: one session per deferred file records, and replay drives
// the JS implemented RendererWrapper so the canvas2d draw list receives the
// real draws. No ore backend exists here, so the ore half of the session stays
// empty. JS owns the session and deletes it with the file that imported
// through it; the replayer's resident table travels with it so a session is
// self contained.
class C2DDeferredSession : public rive::cmd::DeferredSession
{
public:
    // 2D only: no ore replays, so default caps are never consulted.
    C2DDeferredSession() :
        DeferredSession(rive::ore::ReplayCaps{}), m_screenTarget(acquireScreenTarget())
    {}

    uint64_t screenTarget() const { return m_screenTarget; }
    rive::Renderer* recorder() { return screenRenderer(m_screenTarget); }
    rive::cmd::DeferredReplayer& replayer() { return m_replayer; }

    // The browser decodes asynchronously, so a recorded decode would only
    // start at first replay: load() resolves with nothing pending and a
    // static first frame draws before the image exists, permanently blank.
    // Decoding through the immediate factory keeps load() waiting exactly as
    // an immediate import does, and the recorder draws the image as a
    // foreign image through the registry.
    rive::rcp<rive::RenderImage> decodeImage(rive::Span<const uint8_t> bytes) override
    {
        return static_cast<rive::Factory&>(gCanvas2DFactory).decodeImage(bytes);
    }

    // A claim is for the session's whole life, not just the attachment:
    // detaching resets the replayer's resident table, so the recorded stream's
    // handles resolve against nothing and a second renderer cannot replay it.
    // Never cleared, detach included; the caller re-imports instead.
    bool claim()
    {
        if (m_everClaimed)
        {
            return false;
        }
        m_everClaimed = true;
        return true;
    }

private:
    // Claimed for this session's lifetime; canvas2d replay targets one canvas.
    const uint64_t m_screenTarget;
    rive::cmd::DeferredReplayer m_replayer;
    bool m_everClaimed = false;
};

class C2DFrameSink : public rive::cmd::DeferredFrameSink
{
public:
    C2DFrameSink(rive::Renderer* target, uint64_t screenTarget) :
        m_target(target), m_screenTarget(screenTarget)
    {}
    rive::Factory* factory() override { return &gCanvas2DFactory; }
    // Content no screen segment claimed still belongs to this canvas.
    uint64_t defaultScreenTarget() override { return m_screenTarget; }
    rive::Renderer* beginScreenFrame(uint64_t target) override
    {
        // The session drives a single canvas; anything else is another
        // session's stream and must not paint here.
        return target == m_screenTarget ? m_target : nullptr;
    }

private:
    rive::Renderer* m_target;
    const uint64_t m_screenTarget;
};
} // namespace

// JS owns the returned session and deletes it with the file that imported
// through it; the file must not outlive it.
static C2DDeferredSession* makeDeferredSession() { return new C2DDeferredSession(); }

// Takes the one renderer attachment a session ever gets, so JS learns before
// it mutates anything that a session another renderer already took, live or
// since detached, is spent. False also for no session at all: there is nothing
// to attach to.
static bool c2dDeferredClaim(C2DDeferredSession* session)
{
    return session != nullptr && session->claim();
}

static rive::Renderer* c2dDeferredRenderer(C2DDeferredSession* session)
{
    return session != nullptr ? session->recorder() : nullptr;
}

// Opens the recording window; the replay below closes it.
static void c2dDeferredBeginFrame(C2DDeferredSession* session)
{
    if (session != nullptr)
    {
        session->beginTargetFrame(session->screenTarget());
    }
}

// The target renderer arrives at replay rather than at attach, so one session
// can be replayed into whichever canvas renderer currently displays it.
static void c2dDeferredReplay(C2DDeferredSession* session, rive::Renderer* target)
{
    if (session == nullptr || target == nullptr)
    {
        return;
    }
    session->endTargetFrame(session->screenTarget());
    if (session->commandBuffer().empty())
    {
        return;
    }
    C2DFrameSink sink(target, session->screenTarget());
    session->replayer().replayFrame(*session, sink);
    session->resetFrame();
}

// Pending stream content the artboard's own dirt flag cannot see, so the frame
// gate can keep a recorded stream from parking. Bound as a free function
// because the method is the base class's: embind registers a member pointer
// against the class that declares it, and cmd::DeferredSession is unbound.
// Must be read before the renderer clears: clear opens the recording window,
// so a later read reports every frame as dirty.
static bool sessionRecordedThisFrame(C2DDeferredSession* session)
{
    return session != nullptr && session->recordedThisFrame();
}

// The canvas renderer this session recorded for is going away. The resident
// table would otherwise keep holding JS side resources created against it, and
// a later session restarts its handle namespace, so it must not inherit them.
// Idempotent: nothing here needs an open frame or a live renderer.
static void c2dDeferredDetach(C2DDeferredSession* session)
{
    if (session == nullptr)
    {
        return;
    }
    // Whatever the last frame left open is never going to close, and a stuck
    // target holds the session's window shut.
    session->abandonTargetFrame(session->screenTarget());
    // Drops the unreplayed frame; the screen target stays claimed, since it is
    // this session's identity for its whole life.
    session->resetFrame();
    session->replayer().reset();
}

rive::Factory* jsFactory() { return &gCanvas2DFactory; }

// Resolves the optional deferred session that import and decode entry points
// accept. Routing is per call and never global, so a deferred file leaves
// every other instance on the page alone.
rive::Factory* jsSessionFactory(const emscripten::val& session)
{
    if (session.isUndefined() || session.isNull())
    {
        return &gCanvas2DFactory;
    }
    return session.as<C2DDeferredSession*>(allow_raw_pointers());
}

// The Renderer JS class only materializes methods on JS subclasses, so the
// recorder records through these instead of bound member calls.
static void c2dDeferredSave(C2DDeferredSession* session)
{
    if (session != nullptr)
    {
        session->recorder()->save();
    }
}

static void c2dDeferredRestore(C2DDeferredSession* session)
{
    if (session != nullptr)
    {
        session->recorder()->restore();
    }
}

static void c2dDeferredTransform(C2DDeferredSession* session,
                                 float xx,
                                 float xy,
                                 float yx,
                                 float yy,
                                 float tx,
                                 float ty)
{
    if (session != nullptr)
    {
        session->recorder()->transform(rive::Mat2D(xx, xy, yx, yy, tx, ty));
    }
}

static void c2dDeferredAlign(C2DDeferredSession* session,
                             rive::Fit fit,
                             JsAlignment alignment,
                             float frameMinX,
                             float frameMinY,
                             float frameMaxX,
                             float frameMaxY,
                             float contentMinX,
                             float contentMinY,
                             float contentMaxX,
                             float contentMaxY,
                             float scaleFactor)
{
    if (session != nullptr)
    {
        session->recorder()->transform(
            rive::computeAlignment(fit,
                                   convertAlignment(alignment),
                                   rive::AABB(frameMinX, frameMinY, frameMaxX, frameMaxY),
                                   rive::AABB(contentMinX, contentMinY, contentMaxX, contentMaxY),
                                   scaleFactor));
    }
}

EMSCRIPTEN_BINDINGS(RiveWASM_C2D_Deferred)
{
    // Deferred resources are Factory resources, so JS can hand the session
    // straight to load()/decode*() wherever a factory is expected.
    class_<C2DDeferredSession, base<rive::Factory>>("DeferredSession")
        .function("recordedThisFrame", &sessionRecordedThisFrame, allow_raw_pointers());
    function("makeDeferredSession", &makeDeferredSession, allow_raw_pointers());
    function("c2dDeferredClaim", &c2dDeferredClaim, allow_raw_pointers());
    function("c2dDeferredRenderer", &c2dDeferredRenderer, allow_raw_pointers());
    function("c2dDeferredBeginFrame", &c2dDeferredBeginFrame, allow_raw_pointers());
    function("c2dDeferredReplay", &c2dDeferredReplay, allow_raw_pointers());
    function("c2dDeferredDetach", &c2dDeferredDetach, allow_raw_pointers());
    function("c2dDeferredSave", &c2dDeferredSave, allow_raw_pointers());
    function("c2dDeferredRestore", &c2dDeferredRestore, allow_raw_pointers());
    function("c2dDeferredTransform", &c2dDeferredTransform, allow_raw_pointers());
    function("c2dDeferredAlign", &c2dDeferredAlign, allow_raw_pointers());
}

#endif // RIVE_CANVAS_2D_RENDERER
