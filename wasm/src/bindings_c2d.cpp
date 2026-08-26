#include "rive/rive_types.hpp"

#ifdef RIVE_CANVAS_2D_RENDERER

#include "rive/factory.hpp"
#include "rive/renderer.hpp"
#include "rive/math/path_types.hpp"
#include "utils/factory_utils.hpp"

#include "rive/assets/file_asset.hpp"
#include "rive/assets/image_asset.hpp"

#include "skia_imports/include/private/SkVx.h"
#include "js_alignment.hpp"

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdint.h>
#include <stdio.h>
#include <string>
#include <vector>

using namespace emscripten;

#ifdef WITH_RIVE_TOOLS
// Defined at the bottom of this file, once gC2DFactory exists.
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

class RendererWrapper : public wrapper<rive::Renderer>
{
public:
    EMSCRIPTEN_WRAPPER(RendererWrapper);

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
        LITE_RTTI_CAST_OR_RETURN(vtx, rive::DataRenderBuffer*, vertices_f32.get());
        LITE_RTTI_CAST_OR_RETURN(uv, rive::DataRenderBuffer*, uvCoords_f32.get());
        LITE_RTTI_CAST_OR_RETURN(indices, rive::DataRenderBuffer*, indices_u16.get());

        uint32_t f32Count = vertexCount * 2;
        assert(vtx->sizeInBytes() == f32Count * sizeof(float));
        assert(uv->sizeInBytes() == f32Count * sizeof(float));
        assert(indices->sizeInBytes() == indexCount * sizeof(uint16_t));

        if (f32Count == 0 || indexCount == 0)
        {
            return;
        }

        intptr_t uvByteOffset = reinterpret_cast<intptr_t>(uv->f32s());
        intptr_t vtxByteOffset = reinterpret_cast<intptr_t>(vtx->f32s());
        intptr_t indicesByteOffset = reinterpret_cast<intptr_t>(indices->u16s());

        // Compute the mesh's bounding box.
        float m[6];
        emscripten::val mJS{emscripten::typed_memory_view(6, m)};
        call<void>("_getMatrix", mJS);
        auto [l, t, r, b] = bbox(m, vtx->f32s(), f32Count);

        call<void>("_drawImageMesh",
                   image,
                   value,
                   opacity,
                   vtxByteOffset,
                   static_cast<int>(f32Count),
                   uvByteOffset,
                   static_cast<int>(f32Count),
                   indicesByteOffset,
                   static_cast<int>(indexCount),
                   l,
                   t,
                   r,
                   b,
                   allow_raw_pointers());
    }
};

class RenderPathWrapper : public wrapper<rive::RenderPath>
{
public:
    EMSCRIPTEN_WRAPPER(RenderPathWrapper);

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

class RenderPaintWrapper;
class GradientShader : public rive::RenderShader
{
private:
    std::vector<float> m_Stops;
    std::vector<rive::ColorInt> m_Colors;

public:
    GradientShader(const rive::ColorInt colors[], const float stops[], int count) :
        m_Stops(stops, stops + count), m_Colors(colors, colors + count)
    {}

    void passStopsToJS(const RenderPaintWrapper& wrapper);

    virtual void passToJS(const RenderPaintWrapper& wrapper) = 0;
};

class LinearGradientShader : public GradientShader
{
private:
    float m_StartX;
    float m_StartY;
    float m_EndX;
    float m_EndY;

public:
    LinearGradientShader(const rive::ColorInt colors[],
                         const float stops[],
                         int count,
                         float sx,
                         float sy,
                         float ex,
                         float ey) :
        GradientShader(colors, stops, count), m_StartX(sx), m_StartY(sy), m_EndX(ex), m_EndY(ey)
    {}

    void passToJS(const RenderPaintWrapper& wrapper) override;
};

class RadialGradientShader : public GradientShader
{
private:
    float m_CenterX;
    float m_CenterY;
    float m_Radius;

public:
    RadialGradientShader(const rive::ColorInt colors[],
                         const float stops[],
                         int count,
                         float cx,
                         float cy,
                         float r) :
        GradientShader(colors, stops, count), m_CenterX(cx), m_CenterY(cy), m_Radius(r)
    {}

    void passToJS(const RenderPaintWrapper& wrapper) override;
};

class RenderPaintWrapper : public wrapper<rive::RenderPaint>
{
public:
    EMSCRIPTEN_WRAPPER(RenderPaintWrapper);

    void color(unsigned int value) override { call<void>("color", value); }
    void thickness(float value) override { call<void>("thickness", value); }
    void join(rive::StrokeJoin value) override { call<void>("join", value); }
    void cap(rive::StrokeCap value) override { call<void>("cap", value); }
    void blendMode(rive::BlendMode value) override { call<void>("blendMode", value); }

    void style(rive::RenderPaintStyle value) override { call<void>("style", value); }

    void shader(rive::rcp<rive::RenderShader> shader) override
    {
        if (shader == nullptr)
        {
            call<void>("clearGradient");
            return;
        }
        static_cast<GradientShader*>(shader.get())->passToJS(*this);
    }

    void invalidateStroke() override {}
};

void GradientShader::passStopsToJS(const RenderPaintWrapper& wrapper)
{
    // Consider passing in a bulk op encoding into a single array.
    for (std::size_t i = 0; i < m_Stops.size(); i++)
    {
        wrapper.call<void>("addStop", m_Colors[i], m_Stops[i]);
    }
}

void LinearGradientShader::passToJS(const RenderPaintWrapper& wrapper)
{
    wrapper.call<void>("linearGradient", m_StartX, m_StartY, m_EndX, m_EndY);
    passStopsToJS(wrapper);
}

void RadialGradientShader::passToJS(const RenderPaintWrapper& wrapper)
{
    wrapper.call<void>("radialGradient", m_CenterX, m_CenterY, m_CenterX + m_Radius, m_CenterY);
    passStopsToJS(wrapper);
}

class RenderImageWrapper : public wrapper<rive::RenderImage>
{
public:
    EMSCRIPTEN_WRAPPER(RenderImageWrapper);

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

class C2DFactory : public Factory
{
    rcp<RenderBuffer> makeRenderBuffer(RenderBufferType type,
                                       RenderBufferFlags flags,
                                       size_t sizeInBytes) override
    {
        return make_rcp<DataRenderBuffer>(type, flags, sizeInBytes);
    }

    rcp<RenderShader> makeLinearGradient(float sx,
                                         float sy,
                                         float ex,
                                         float ey,
                                         const ColorInt colors[], // [count]
                                         const float stops[],     // [count]
                                         size_t count) override
    {
        return rcp<RenderShader>(new LinearGradientShader(colors, stops, count, sx, sy, ex, ey));
    }
    rcp<RenderShader> makeRadialGradient(float cx,
                                         float cy,
                                         float radius,
                                         const ColorInt colors[], // [count]
                                         const float stops[],     // [count]
                                         size_t count) override
    {
        return rcp<RenderShader>(new RadialGradientShader(colors, stops, count, cx, cy, radius));
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
        //   ... that would avoid that tricky cast to RenderImageWrapper*

        val renderImage = val::module_property("renderFactory").call<val>("makeRenderImage");

        rcp<RenderImageWrapper> ptr =
            rcp(renderImage.as<RenderImageWrapper*>(allow_raw_pointers()));
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
// The test harness (testing_window_canvas2d.cpp) lives in a separate wasm
// module, so it cannot hold pointers into our heap, and thus cannot directly
// invoke the functions defined above. However, most of this functionality is
// just making simple calls into JS via `call`, so the test harness can just
// make these same calls directly. However, a few functions in this file are
// more complex, and we want to avoid duplicating their logic in the test
// harness. Therefore, Canvas2DTestUtilities implements wrappers for these
// more complex functions. These wrappers have emscripten bindings (see below)
// which can be invoked from the test harness.
class Canvas2DTestUtilities
{
public:
    // Copies `elementCount` elements out of a JS TypedArray into a fresh
    // DataRenderBuffer on *our* heap. The source typically views a different
    // wasm module's memory, which is fine: a TypedArray is an ordinary JS
    // object, so it reads correctly from here regardless of which ArrayBuffer
    // it wraps. Matching the element type keeps TypedArray.set() a straight
    // copy -- setting a Uint8Array from a Float32Array would silently convert
    // each element instead.
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

    // This exists so the harness can drive the real
    // RendererWrapper::drawImageMesh() rather than reimplementing its
    // bounding-box and buffer handling on its own side.
    static void testDrawImageMesh(RendererWrapper* rendererWrapper,
                                  RenderImageWrapper* imageWrapper,
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

    // The harness needs the decoded dimensions to populate its own
    // rive::RenderImage. It could read them off the <img> element that
    // renderer.js stashes on the CanvasRenderImage, but that field is private
    // to renderer.js and only ever accessed there with dot notation, so closure
    // renames it in release builds. These go through the values renderer.js
    // sets via size(), which is what the runtime itself draws with.
    static int testImageWidth(RenderImageWrapper* imageWrapper) { return imageWrapper->width(); }

    static int testImageHeight(RenderImageWrapper* imageWrapper) { return imageWrapper->height(); }
};
#endif // WITH_RIVE_TOOLS
} // namespace rive

// Placeholder for a method that only exists in JS.
//
// pure_virtual() is what makes embind reject a .extend() subclass that forgot a
// method, but it registers against the class that *declares* the bound member
// -- .function() deduces that from the pointer and ignores the class_<>.
// Neither obvious choice works here. The wrapper's override declares its own
// member, so it registers against RendererWrapper and the check silently never
// runs. The real base method often isn't declared where you'd expect either:
// RenderPath's verbs come from CommandPath, which has no class_<>, so the
// registration waits forever on an unresolved type and the method never appears
// at all. (The signature is a fiction regardless -- these JS classes are not
// the same shape as the C++ ones; they take loose floats where C++ takes a
// Mat2D.)
//
// A null pointer-to-member pins the class explicitly, sidestepping both. Only
// valid alongside pure_virtual(), which guarantees the JS override shadows this
// binding so the null is never invoked.
template <typename T> constexpr void (T::* pureVirtualMethod())() { return nullptr; }

EMSCRIPTEN_BINDINGS(RiveWASM_C2D)
{
    class_<rive::Renderer>("Renderer")
        .function("save", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("restore", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("transform", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        .function("modulateOpacity", pureVirtualMethod<rive::Renderer>(), pure_virtual())
        // These three are not pure_virtual(): drawPath and clipPath are
        // implemented in JS under different names (_drawPath / _clipPath), and
        // align is a C++ helper that JS calls rather than implements.
        .function("drawPath", &RendererWrapper::drawPath, allow_raw_pointers())
        .function("clipPath", &RendererWrapper::clipPath, allow_raw_pointers())
        .function("align", &RendererWrapper::align, allow_raw_pointers())
        .allow_subclass<RendererWrapper>("RendererWrapper");

    class_<rive::RenderPath>("RenderPath")
        .function("rewind", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("addPath", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("fillRule", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("moveTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("lineTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("cubicTo", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .function("close", pureVirtualMethod<rive::RenderPath>(), pure_virtual())
        .allow_subclass<RenderPathWrapper>("RenderPathWrapper");
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
        .function("blendMode", pureVirtualMethod<rive::RenderPaint>(), pure_virtual())
        // Not pure_virtual(): implemented in C++, which decomposes it into the
        // linearGradient / radialGradient / addStop calls that JS does provide.
        .function("shader", &RenderPaintWrapper::shader, allow_raw_pointers())
        .allow_subclass<RenderPaintWrapper>("RenderPaintWrapper");

    class_<rive::RenderImage>("RenderImage")
        .function("size", &RenderImageWrapper::size)
        .function("unref", &RenderImageWrapper::unref)
        .allow_subclass<RenderImageWrapper>("RenderImageWrapper");

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
                        allow_raw_pointers());
#endif
}

static rive::C2DFactory gC2DFactory;
rive::Factory* jsFactory() { return &gC2DFactory; }

#endif // RIVE_CANVAS_2D_RENDERER
