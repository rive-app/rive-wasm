#include "animation/linear_animation.hpp"
#include "animation/linear_animation_instance.hpp"
#include "artboard.hpp"
#include "bones/bone.hpp"
#include "bones/root_bone.hpp"
#include "component.hpp"
#include "core.hpp"
#include "core/binary_reader.hpp"
#include "file.hpp"
#include "layout.hpp"
#include "math/mat2d.hpp"
#include "node.hpp"
#include "renderer.hpp"
#include "transform_component.hpp"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdio.h>
#include <string>
#include <vector>

using namespace emscripten;

class RendererWrapper : public wrapper<rive::Renderer>
{
public:
	EMSCRIPTEN_WRAPPER(RendererWrapper);

	void save() override { call<void>("save"); }

	void restore() override { call<void>("restore"); }

	void transform(const rive::Mat2D& transform) override
	{
		call<void>("transform", transform);
	}

	void drawPath(rive::RenderPath* path, rive::RenderPaint* paint) override
	{
		call<void>("drawPath", path, paint);
	}

	void clipPath(rive::RenderPath* path) override
	{
		call<void>("clipPath", path);
	}
};

class RenderPathWrapper : public wrapper<rive::RenderPath>
{
public:
	EMSCRIPTEN_WRAPPER(RenderPathWrapper);

	void reset() override { call<void>("reset"); }

	void addRenderPath(rive::RenderPath* path, const rive::Mat2D& transform) override
	{
		call<void>("addPath", path, transform);
	}
	void fillRule(rive::FillRule value) override
	{
		call<void>("fillRule", value);
	}

	void moveTo(float x, float y) override { call<void>("moveTo", x, y); }
	void lineTo(float x, float y) override { call<void>("lineTo", x, y); }
	void
	cubicTo(float ox, float oy, float ix, float iy, float x, float y) override
	{
		call<void>("cubicTo", ox, oy, ix, iy, x, y);
	}
	void close() override { call<void>("close"); }
};

class RenderPaintWrapper : public wrapper<rive::RenderPaint>
{
public:
	EMSCRIPTEN_WRAPPER(RenderPaintWrapper);

	void color(unsigned int value) override { call<void>("color", value); }
	void thickness(float value) override { call<void>("thickness", value); }
	void join(rive::StrokeJoin value) override { call<void>("join", value); }
	void cap(rive::StrokeCap value) override { call<void>("cap", value); }
	void blendMode(rive::BlendMode value) override
	{
		call<void>("blendMode", value);
	}

	void style(rive::RenderPaintStyle value) override
	{
		call<void>("style", value);
	}
	void linearGradient(float sx, float sy, float ex, float ey) override
	{
		call<void>("linearGradient", sx, sy, ex, ey);
	}
	void radialGradient(float sx, float sy, float ex, float ey) override
	{
		call<void>("radialGradient", sx, sy, ex, ey);
	}
	void addStop(unsigned int color, float stop) override
	{
		call<void>("addStop", color, stop);
	}
	void completeGradient() override { call<void>("completeGradient"); }
};

namespace rive
{
	RenderPaint* makeRenderPaint()
	{
		val renderPaint =
		    val::module_property("renderFactory").call<val>("makeRenderPaint");
		return renderPaint.as<RenderPaint*>(allow_raw_pointers());
	}

	RenderPath* makeRenderPath()
	{
		val renderPath =
		    val::module_property("renderFactory").call<val>("makeRenderPath");
		return renderPath.as<RenderPath*>(allow_raw_pointers());
	}
} // namespace rive

rive::File* load(emscripten::val byteArray)
{
	std::vector<unsigned char> rv;

	const auto l = byteArray["byteLength"].as<unsigned>();
	rv.resize(l);

	emscripten::val memoryView{emscripten::typed_memory_view(l, rv.data())};
	memoryView.call<void>("set", byteArray);
	auto reader = rive::BinaryReader(rv.data(), rv.size());
	rive::File* file = nullptr;
	auto result = rive::File::import(reader, &file);
	return file;
}

EMSCRIPTEN_BINDINGS(RiveWASM)
{
	function("load", &load, allow_raw_pointers());

	class_<rive::Renderer>("Renderer")
	    .function("save",
	              &RendererWrapper::save,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("restore",
	              &RendererWrapper::restore,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("transform",
	              &RendererWrapper::transform,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("drawPath",
	              &RendererWrapper::drawPath,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("clipPath",
	              &RendererWrapper::clipPath,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("align", &rive::Renderer::align)
	    .allow_subclass<RendererWrapper>("RendererWrapper");

	class_<rive::RenderPath>("RenderPath")
	    .function("reset",
	              &RenderPathWrapper::reset,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("addPath",
	              &RenderPathWrapper::addRenderPath,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("fillRule", &RenderPathWrapper::fillRule, pure_virtual())
	    .function("moveTo",
	              &RenderPathWrapper::moveTo,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("lineTo",
	              &RenderPathWrapper::lineTo,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("cubicTo",
	              &RenderPathWrapper::cubicTo,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("close",
	              &RenderPathWrapper::close,
	              pure_virtual(),
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

	class_<rive::RenderPaint>("RenderPaint")
	    .function("color",
	              &RenderPaintWrapper::color,
	              pure_virtual(),
	              allow_raw_pointers())

	    .function("style",
	              &RenderPaintWrapper::style,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("thickness",
	              &RenderPaintWrapper::thickness,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("join",
	              &RenderPaintWrapper::join,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("cap",
	              &RenderPaintWrapper::cap,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("blendMode",
	              &RenderPaintWrapper::blendMode,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("linearGradient",
	              &RenderPaintWrapper::linearGradient,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("radialGradient",
	              &RenderPaintWrapper::radialGradient,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("addStop",
	              &RenderPaintWrapper::addStop,
	              pure_virtual(),
	              allow_raw_pointers())
	    .function("completeGradient",
	              &RenderPaintWrapper::completeGradient,
	              pure_virtual(),
	              allow_raw_pointers())
	    .allow_subclass<RenderPaintWrapper>("RenderPaintWrapper");

	class_<rive::Mat2D>("Mat2D")
	    .property("xx", &rive::Mat2D::xx)
	    .property("xy", &rive::Mat2D::xy)
	    .property("yx", &rive::Mat2D::yx)
	    .property("yy", &rive::Mat2D::yy)
	    .property("tx", &rive::Mat2D::tx)
	    .property("ty", &rive::Mat2D::ty);

	class_<rive::File>("File")
	    .function("artboard",
	              select_overload<rive::Artboard*(std::string) const>(
	                  &rive::File::artboard),
	              allow_raw_pointers())
	    .function(
	        "defaultArtboard",
	        select_overload<rive::Artboard*() const>(&rive::File::artboard),
	        allow_raw_pointers());

	class_<rive::Artboard>("Artboard")
	    .function("advance", &rive::Artboard::advance)
	    .function("draw", &rive::Artboard::draw, allow_raw_pointers())
	    .function("transformComponent",
	              &rive::Artboard::find<rive::TransformComponent>,
	              allow_raw_pointers())
	    .function(
	        "node", &rive::Artboard::find<rive::Node>, allow_raw_pointers())
	    .function(
	        "bone", &rive::Artboard::find<rive::Bone>, allow_raw_pointers())
	    .function("rootBone",
	              &rive::Artboard::find<rive::RootBone>,
	              allow_raw_pointers())
		// Animations
		.function("animationByIndex",
						select_overload<rive::LinearAnimation*(size_t)>(&rive::Artboard::animation),
						allow_raw_pointers())
		.function("animationByName",
						select_overload<rive::LinearAnimation*(std::string)>(&rive::Artboard::animation),
						allow_raw_pointers())
	    .function("animationCount", &rive::Artboard::animationCount)
		// State machines
		.function("stateMachineByIndex",
						select_overload<rive::StateMachine*(size_t)>(&rive::Artboard::stateMachine),
						allow_raw_pointers())
		.function("stateMachineByName",
						select_overload<rive::StateMachine*(std::string)>(&rive::Artboard::stateMachine),
						allow_raw_pointers())
	    .function("stateMachineCount", &rive::Artboard::stateMachineCount)

	    .property("bounds", &rive::Artboard::bounds);

	class_<rive::TransformComponent>
	    ("TransformComponent")
	        .property(
	            "scaleX",
	            select_overload<float() const>(
	                &rive::TransformComponent::scaleX),
	            select_overload<void(float)>(&rive::TransformComponent::scaleX))
	        .property(
	            "scaleY",
	            select_overload<float() const>(
	                &rive::TransformComponent::scaleY),
	            select_overload<void(float)>(&rive::TransformComponent::scaleY))
	        .property("rotation",
	                  select_overload<float() const>(
	                      &rive::TransformComponent::rotation),
	                  select_overload<void(float)>(
	                      &rive::TransformComponent::rotation));

	class_<rive::Node, base<rive::TransformComponent>>("Node")
	    .property("x",
	              select_overload<float() const>(&rive::TransformComponent::x),
	              select_overload<void(float)>(&rive::Node::x))
	    .property("y",
	              select_overload<float() const>(&rive::TransformComponent::y),
	              select_overload<void(float)>(&rive::Node::y));

	class_<rive::Bone, base<rive::TransformComponent>>("Bone").property(
	    "length",
	    select_overload<float() const>(&rive::Bone::length),
	    select_overload<void(float)>(&rive::Bone::length));

	class_<rive::RootBone, base<rive::Bone>>("RootBone")
	    .property("x",
	              select_overload<float() const>(&rive::TransformComponent::x),
	              select_overload<void(float)>(&rive::RootBone::x))
	    .property("y",
	              select_overload<float() const>(&rive::TransformComponent::y),
	              select_overload<void(float)>(&rive::RootBone::y));

	class_<rive::LinearAnimation>("LinearAnimation")
		.property(
	        "name",
	        select_overload<std::string() const>(&rive::AnimationBase::name))
	    .property(
	        "duration",
	        select_overload<int() const>(&rive::LinearAnimationBase::duration))
	    .property("fps",
	              select_overload<int() const>(&rive::LinearAnimationBase::fps))
		.property("workStart",
	              select_overload<int() const>(&rive::LinearAnimationBase::workStart))
		.property("workEnd",
	              select_overload<int() const>(&rive::LinearAnimationBase::workEnd))
		.property("enableWorkArea",
	              select_overload<bool() const>(&rive::LinearAnimationBase::enableWorkArea))
		.property("loopValue",
	              select_overload<int() const>(&rive::LinearAnimationBase::loopValue))
		.property("speed",
	              select_overload<float() const>(&rive::LinearAnimationBase::speed))
	    .function("apply", &rive::LinearAnimation::apply, allow_raw_pointers());

	class_<rive::LinearAnimationInstance>("LinearAnimationInstance")
	    .constructor<rive::LinearAnimation*>()
	    .property(
	        "time",
	        select_overload<float() const>(
	            &rive::LinearAnimationInstance::time),
	        select_overload<void(float)>(&rive::LinearAnimationInstance::time))
		.property("didLoop",
 			select_overload<bool() const>(&rive::LinearAnimationInstance::didLoop))
	    .function("advance",
	              select_overload<bool(float)>(
	                  &rive::LinearAnimationInstance::advance))
	    .function("apply",
	              &rive::LinearAnimationInstance::apply,
	              allow_raw_pointers());

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
}