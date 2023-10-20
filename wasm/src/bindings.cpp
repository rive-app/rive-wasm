#include "rive/animation/animation_state.hpp"
#include "rive/animation/animation.hpp"
#include "rive/animation/any_state.hpp"
#include "rive/animation/entry_state.hpp"
#include "rive/animation/exit_state.hpp"
#include "rive/animation/linear_animation_instance.hpp"
#include "rive/animation/linear_animation.hpp"
#include "rive/animation/nested_state_machine.hpp"
#include "rive/animation/state_machine_bool.hpp"
#include "rive/animation/state_machine_input_instance.hpp"
#include "rive/animation/state_machine_instance.hpp"
#include "rive/animation/state_machine_number.hpp"
#include "rive/animation/state_machine_trigger.hpp"
#include "rive/artboard.hpp"
#include "rive/assets/file_asset.hpp"
#include "rive/assets/image_asset.hpp"
#include "rive/bones/bone.hpp"
#include "rive/bones/root_bone.hpp"
#include "rive/component_dirt.hpp"
#include "rive/component.hpp"
#include "rive/constraints/constraint.hpp"
#include "rive/core.hpp"
#include "rive/core/binary_reader.hpp"
#include "rive/custom_property_boolean.hpp"
#include "rive/custom_property_number.hpp"
#include "rive/custom_property_string.hpp"
#include "rive/event.hpp"
#include "rive/file_asset_loader.hpp"
#include "rive/file.hpp"
#include "rive/layout.hpp"
#include "rive/math/mat2d.hpp"
#include "rive/nested_artboard.hpp"
#include "rive/node.hpp"
#include "rive/open_url_event.hpp"
#include "rive/renderer.hpp"
#include "rive/shapes/cubic_vertex.hpp"
#include "rive/shapes/path.hpp"
#include "rive/text/text_style.hpp"
#include "rive/text/text_value_run.hpp"
#include "rive/text/text.hpp"
#include "rive/transform_component.hpp"

#include "js_alignment.hpp"
#include "js_asset.hpp"

#include "src/core/SkIPoint16.h"
#include "src/gpu/GrDynamicRectanizer.h"

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdint.h>
#include <stdio.h>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <sanitizer/lsan_interface.h>

using namespace emscripten;

// Returns the global factory (either c2d or skia backed)
extern rive::Factory* jsFactory();

// We had to do this because binding the core class const defined types directly
// caused wasm-ld linker issues. See
// https://www.mail-archive.com/emscripten-discuss@googlegroups.com/msg09132.html
// for other people suffering our same pains.
const uint16_t stateMachineBoolTypeKey = rive::StateMachineBoolBase::typeKey;

const uint16_t stateMachineNumberTypeKey = rive::StateMachineNumberBase::typeKey;

const uint16_t stateMachineTriggerTypeKey = rive::StateMachineTriggerBase::typeKey;

rive::Alignment convertAlignment(JsAlignment alignment)
{
    switch (alignment)
    {
        case JsAlignment::topLeft:
            return rive::Alignment::topLeft;
        case JsAlignment::topCenter:
            return rive::Alignment::topCenter;
        case JsAlignment::topRight:
            return rive::Alignment::topRight;
        case JsAlignment::centerLeft:
            return rive::Alignment::centerLeft;
        case JsAlignment::center:
            return rive::Alignment::center;
        case JsAlignment::centerRight:
            return rive::Alignment::centerRight;
        case JsAlignment::bottomLeft:
            return rive::Alignment::bottomLeft;
        case JsAlignment::bottomCenter:
            return rive::Alignment::bottomCenter;
        case JsAlignment::bottomRight:
            return rive::Alignment::bottomRight;
    }
    return rive::Alignment::center;
}

rive::Mat2D computeAlignment(rive::Fit fit, JsAlignment alignment, rive::AABB orig, rive::AABB dest)
{
    return rive::computeAlignment(fit, convertAlignment(alignment), orig, dest);
}

rive::Vec2D mapXY(rive::Mat2D invertedMatrix, rive::Vec2D canvasVector)
{
    return invertedMatrix * canvasVector;
}

bool hasListeners(rive::StateMachineInstance* smi)
{
    if (smi->stateMachine()->listenerCount() != 0)
    {
        return true;
    }
    for (auto nestedArtboard : smi->artboard()->nestedArtboards())
    {
        for (auto animation : nestedArtboard->nestedAnimations())
        {
            if (animation->is<rive::NestedStateMachine>())
            {
                auto nestedStateMachine = animation->as<rive::NestedStateMachine>();
                if (hasListeners(nestedStateMachine->stateMachineInstance()))
                {
                    return true;
                }
            }
        }
    }
    return false;
}

emscripten::val createRiveEventObject(rive::Event* event)
{
    emscripten::val eventObject = emscripten::val::object();
    eventObject.set("name", event->name());
    eventObject.set("type", event->coreType());
    if (event->is<rive::OpenUrlEvent>())
    {
        auto urlEvent = event->as<rive::OpenUrlEvent>();
        eventObject.set("url", urlEvent->url());
        const char* target = nullptr;
        switch (urlEvent->targetValue())
        {
            case 0:
                target = "_blank";
                break;
            case 1:
                target = "_parent";
                break;
            case 2:
                target = "_self";
                break;
            case 3:
                target = "_top";
                break;
        }
        if (target != nullptr)
        {
            eventObject.set("target", target);
        }
    }
    bool haveCustom = false;
    emscripten::val propertiesObject = emscripten::val::object();
    for (auto child : event->children())
    {
        if (child->is<rive::CustomProperty>())
        {
            if (!child->name().empty())
            {
                switch (child->coreType())
                {
                    case rive::CustomPropertyBoolean::typeKey:
                        propertiesObject.set(
                            child->name(),
                            child->as<rive::CustomPropertyBoolean>()->propertyValue());
                        break;
                    case rive::CustomPropertyString::typeKey:
                        propertiesObject.set(
                            child->name(),
                            child->as<rive::CustomPropertyString>()->propertyValue());
                        break;
                    case rive::CustomPropertyNumber::typeKey:
                        propertiesObject.set(
                            child->name(),
                            child->as<rive::CustomPropertyNumber>()->propertyValue());
                        break;
                }
                haveCustom = true;
            }
        }
    }
    if (haveCustom)
    {
        eventObject.set("properties", propertiesObject);
    }
    return eventObject;
}

class DynamicRectanizer
{
public:
    DynamicRectanizer(int maxAtlasSize) :
        m_Rectanizer(SkISize::Make(1, 1),
                     maxAtlasSize,
                     GrDynamicRectanizer::RectanizerAlgorithm::kSkyline)
    {}

    void reset(int initialWidth, int initialHeight)
    {
        m_Rectanizer.reset({initialWidth, initialHeight});
    }

    int addRect(int width, int height)
    {
        SkIPoint16 loc;
        if (!m_Rectanizer.addRect(width, height, &loc))
        {
            return -1;
        }
        return (loc.y() << 16) | loc.x();
    }

    int drawWidth() const { return m_Rectanizer.drawBounds().width(); }

    int drawHeight() const { return m_Rectanizer.drawBounds().height(); }

private:
    GrDynamicRectanizer m_Rectanizer;
};

class FileAssetLoaderWrapper : public wrapper<rive::FileAssetLoader>
{
public:
    EMSCRIPTEN_WRAPPER(FileAssetLoaderWrapper);

    bool loadContents(rive::FileAsset& asset, rive::Span<const uint8_t> inBandBytes)
    {
        auto bytes =
            emscripten::val(emscripten::typed_memory_view(inBandBytes.size(), inBandBytes.data()));
        return call<bool>("loadContents", (intptr_t)&asset, bytes);
    };
};

rive::File* load(emscripten::val byteArray, rive::FileAssetLoader* fileAssetLoader)
{
    std::vector<unsigned char> rv;

    const auto l = byteArray["byteLength"].as<unsigned>();
    rv.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, rv.data())};
    memoryView.call<void>("set", byteArray);

    return rive::File::import(rv, jsFactory(), nullptr, fileAssetLoader).release();
}

// utility function to get File Asset object from pointer
rive::FileAsset* ptrToFileAsset(intptr_t pointer) { return (rive::FileAsset*)pointer; }
rive::ImageAsset* ptrToImageAsset(intptr_t pointer) { return (rive::ImageAsset*)pointer; }
rive::FontAsset* ptrToFontAsset(intptr_t pointer) { return (rive::FontAsset*)pointer; }

rive::rcp<rive::Font> decodeFont(emscripten::val byteArray)
{
    std::vector<unsigned char> vector;

    const auto l = byteArray["byteLength"].as<unsigned>();
    vector.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, vector.data())};
    memoryView.call<void>("set", byteArray);
    return jsFactory()->decodeFont(vector);
}

EMSCRIPTEN_BINDINGS(RiveWASM)
{
    function("ptrToFileAsset", &ptrToFileAsset, allow_raw_pointers());
    function("ptrToImageAsset", &ptrToImageAsset, allow_raw_pointers());
    function("ptrToFontAsset", &ptrToFontAsset, allow_raw_pointers());
    function("decodeFont", &decodeFont, allow_raw_pointers());
    function("load", &load, allow_raw_pointers());
    function("jsFactory", &jsFactory, allow_raw_pointers());
    function("computeAlignment", &computeAlignment);
    function("mapXY", &mapXY);
    function("hasListeners", &hasListeners, allow_raw_pointers());

#ifdef ENABLE_QUERY_FLAT_VERTICES
    class_<rive::FlattenedPath>("FlattenedPath")
        .function("length", optional_override([](rive::FlattenedPath& self) -> size_t {
                      return self.vertices().size();
                  }))
        .function("isCubic", optional_override([](rive::FlattenedPath& self, size_t index) -> bool {
                      if (index >= self.vertices().size())
                      {
                          return false;
                      }
                      return self.vertices()[index]->is<rive::CubicVertex>();
                  }))
        .function("x", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->x();
                  }))
        .function("y", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->y();
                  }))
        .function("inX", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->as<rive::CubicVertex>()->renderIn()[0];
                  }))
        .function("inY", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->as<rive::CubicVertex>()->renderIn()[1];
                  }))
        .function("outX", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->as<rive::CubicVertex>()->renderOut()[0];
                  }))
        .function("outY", optional_override([](rive::FlattenedPath& self, size_t index) -> float {
                      return self.vertices()[index]->as<rive::CubicVertex>()->renderOut()[1];
                  }));
#endif

    class_<rive::Vec2D>("Vec2D")
        .constructor<float, float>()
        // TODO: For next major verison, make these properties instead of methods to match
        // patterns on other math-based Rive classes, such as Mat2D
        .function("x", optional_override([](rive::Vec2D self) -> float { return self.x; }))
        .function("y", optional_override([](rive::Vec2D self) -> float { return self.y; }));

    class_<rive::Mat2D>("Mat2D")
        .constructor<>()
        .property("xx",
                  select_overload<float() const>(&rive::Mat2D::xx),
                  select_overload<void(float)>(&rive::Mat2D::xx))
        .property("xy",
                  select_overload<float() const>(&rive::Mat2D::xy),
                  select_overload<void(float)>(&rive::Mat2D::xy))
        .property("yx",
                  select_overload<float() const>(&rive::Mat2D::yx),
                  select_overload<void(float)>(&rive::Mat2D::yx))
        .property("yy",
                  select_overload<float() const>(&rive::Mat2D::yy),
                  select_overload<void(float)>(&rive::Mat2D::yy))
        .property("tx",
                  select_overload<float() const>(&rive::Mat2D::tx),
                  select_overload<void(float)>(&rive::Mat2D::tx))
        .property("ty",
                  select_overload<float() const>(&rive::Mat2D::ty),
                  select_overload<void(float)>(&rive::Mat2D::ty))
        .function("invert", optional_override([](rive::Mat2D& self, rive::Mat2D& result) -> bool {
                      return self.invert(&result);
                  }))
        .function("multiply",
                  optional_override([](rive::Mat2D& self, rive::Mat2D& result, rive::Mat2D& other)
                                        -> void { result = rive::Mat2D::multiply(self, other); }));

    class_<rive::File>("File")
        .function("defaultArtboard",
                  optional_override([](rive::File& self) -> rive::ArtboardInstance* {
                      return self.artboardAt(0).release();
                  }),
                  allow_raw_pointers())
        .function("artboardByName",
                  optional_override([](const rive::File& self,
                                       const std::string& name) -> rive::ArtboardInstance* {
                      return self.artboardNamed(name).release();
                  }),
                  allow_raw_pointers())
        .function(
            "artboardByIndex",
            optional_override([](const rive::File& self, size_t index) -> rive::ArtboardInstance* {
                return self.artboardAt(index).release();
            }),
            allow_raw_pointers())
        .function("artboardCount", &rive::File::artboardCount);
    class_<rive::rcp<rive::Font>>("rcpFont");
    class_<rive::Font>("Font");
    class_<rive::Artboard>("ArtboardBase");
    class_<rive::ArtboardInstance, base<rive::Artboard>>("Artboard")
#ifdef ENABLE_QUERY_FLAT_VERTICES
        .function("flattenPath",
                  optional_override([](rive::Artboard& self,
                                       size_t index,
                                       bool transformToParent) -> rive::FlattenedPath* {
                      auto artboardObjects = self.objects();
                      if (index >= artboardObjects.size())
                      {
                          return nullptr;
                      }
                      auto object = artboardObjects[index];
                      if (!object->is<rive::Path>())
                      {
                          return nullptr;
                      }
                      auto path = object->as<rive::Path>();
                      return path->makeFlat(transformToParent);
                  }),
                  allow_raw_pointers())
#endif
        .property("name", select_overload<const std::string&() const>(&rive::Artboard::name))
        .function("advance",
                  optional_override([](rive::ArtboardInstance& self, double seconds) -> bool {
                      return self.advance(seconds);
                  }),
                  allow_raw_pointers())
        .function("draw",
                  optional_override([](rive::ArtboardInstance& self, rive::Renderer* renderer) {
                      return self.draw(renderer, rive::Artboard::DrawOption::kNormal);
                  }),
                  allow_raw_pointers())
        .function("transformComponent",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name) {
                      return self.find<rive::TransformComponent>(name);
                  }),
                  allow_raw_pointers())
        .function("node",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name) {
                      return self.find<rive::Node>(name);
                  }),
                  allow_raw_pointers())
        .function("textRun",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name) {
                      return self.find<rive::TextValueRun>(name);
                  }),
                  allow_raw_pointers())
        .function("bone",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name) {
                      return self.find<rive::Bone>(name);
                  }),
                  allow_raw_pointers())
        .function("rootBone",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name) {
                      return self.find<rive::RootBone>(name);
                  }),
                  allow_raw_pointers())
        // Animations
        .function("animationByIndex",
                  optional_override(
                      [](rive::ArtboardInstance& self, size_t index) -> rive::LinearAnimation* {
                          return self.animation(index);
                      }),
                  allow_raw_pointers())
        .function("animationByName",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name)
                                        -> rive::LinearAnimation* { return self.animation(name); }),
                  allow_raw_pointers())
        .function("animationCount", optional_override([](rive::ArtboardInstance& self) -> size_t {
                      return self.animationCount();
                  }))
        // State machines
        .function("stateMachineByIndex",
                  optional_override(
                      [](rive::ArtboardInstance& self, size_t index) -> rive::StateMachine* {
                          return self.stateMachine(index);
                      }),
                  allow_raw_pointers())
        .function("stateMachineByName",
                  optional_override([](rive::ArtboardInstance& self, const std::string& name)
                                        -> rive::StateMachine* { return self.stateMachine(name); }),
                  allow_raw_pointers())
        .function("stateMachineCount",
                  optional_override([](rive::ArtboardInstance& self) -> size_t {
                      return self.stateMachineCount();
                  }))
        .function("textValueRunCount",
                  optional_override([](rive::ArtboardInstance& self) -> size_t {
                      return self.textValueRunCount();
                  }))
        .function("textValueRunByIndex",
                  optional_override(
                      [](rive::ArtboardInstance& self, size_t index) -> rive::TextValueRun* {
                          return self.textValueRunAt(index);
                      }),
                  allow_raw_pointers())
        .function("eventCount", optional_override([](rive::ArtboardInstance& self) -> size_t {
                      return self.eventCount();
                  }))
        .function(
            "eventByIndex",
            optional_override([](rive::ArtboardInstance& self, size_t index) -> emscripten::val {
                rive::Event* event = self.eventAt(index);
                return createRiveEventObject(event);
            }),
            allow_raw_pointers())
        .property("bounds", optional_override([](const rive::ArtboardInstance& self) -> rive::AABB {
                      return self.bounds();
                  }))
        .property("frameOrigin",
                  select_overload<bool() const>(&rive::Artboard::frameOrigin),
                  select_overload<void(bool)>(&rive::Artboard::frameOrigin));

    class_<rive::TransformComponent>("TransformComponent")
        .property("scaleX",
                  select_overload<float() const>(&rive::TransformComponent::scaleX),
                  select_overload<void(float)>(&rive::TransformComponent::scaleX))
        .property("scaleY",
                  select_overload<float() const>(&rive::TransformComponent::scaleY),
                  select_overload<void(float)>(&rive::TransformComponent::scaleY))
        .property("rotation",
                  select_overload<float() const>(&rive::TransformComponent::rotation),
                  select_overload<void(float)>(&rive::TransformComponent::rotation))
        .function("worldTransform",
                  optional_override([](rive::TransformComponent& self) -> rive::Mat2D& {
                      return self.mutableWorldTransform();
                  }),
                  allow_raw_pointers())
        .function(
            "parentWorldTransform",
            optional_override([](rive::TransformComponent& self, rive::Mat2D& result) -> void {
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

    class_<rive::TextValueRun>("TextValueRun")
        .property("name",
                  select_overload<const std::string&() const>(&rive::TextValueRunBase::name))
        .property("text",
                  select_overload<const std::string&() const>(&rive::TextValueRunBase::text),
                  select_overload<void(std::string)>(&rive::TextValueRunBase::text));

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

    class_<rive::Animation>("Animation")
        .property("name", select_overload<const std::string&() const>(&rive::AnimationBase::name));

    class_<rive::LinearAnimation, base<rive::Animation>>("LinearAnimation")
        .property("name", select_overload<const std::string&() const>(&rive::AnimationBase::name))
        .property("duration",
                  select_overload<uint32_t() const>(&rive::LinearAnimationBase::duration))
        .property("fps", select_overload<uint32_t() const>(&rive::LinearAnimationBase::fps))
        .property("workStart",
                  select_overload<uint32_t() const>(&rive::LinearAnimationBase::workStart))
        .property("workEnd", select_overload<uint32_t() const>(&rive::LinearAnimationBase::workEnd))
        .property("enableWorkArea",
                  select_overload<bool() const>(&rive::LinearAnimationBase::enableWorkArea))
        .property("loopValue",
                  select_overload<uint32_t() const>(&rive::LinearAnimationBase::loopValue))
        .property("speed", select_overload<float() const>(&rive::LinearAnimationBase::speed))
        .function("apply", &rive::LinearAnimation::apply, allow_raw_pointers());

    class_<rive::LinearAnimationInstance>("LinearAnimationInstance")
        .constructor<rive::LinearAnimation*, rive::ArtboardInstance*>()
        .property("time",
                  select_overload<float() const>(&rive::LinearAnimationInstance::time),
                  select_overload<void(float)>(&rive::LinearAnimationInstance::time))
        .property("didLoop", &rive::LinearAnimationInstance::didLoop)
        .function("advance", select_overload<bool(float)>(&rive::LinearAnimationInstance::advance))
        .function("apply", &rive::LinearAnimationInstance::apply, allow_raw_pointers());

    class_<rive::StateMachine, base<rive::Animation>>("StateMachine");
    class_<rive::Factory>("Factory")
        .function("decodeImage", &rive::Factory::decodeImage, allow_raw_pointers())
        .function("decodeFont", &rive::Factory::decodeFont, allow_raw_pointers());
    class_<rive::Span<const uint8_t>>("Span");

    class_<rive::FileAsset>("FileAsset")
        .property("name", select_overload<const std::string&() const>(&rive::FileAssetBase::name))
        .property("cdnBaseUrl",
                  select_overload<const std::string&() const>(&rive::FileAssetBase::cdnBaseUrl))
        .property("fileExtension",
                  select_overload<std::string() const>(&rive::FileAsset::fileExtension))
        .property("isImage", optional_override([](const rive::FileAsset& self) -> bool {
                      return self.is<rive::ImageAsset>();
                  }))
        .property("isFont", optional_override([](const rive::FileAsset& self) -> bool {
                      return self.is<rive::FontAsset>();
                  }))
        .property(
            "cdnUuid",
            optional_override([](const rive::FileAsset& self) -> std::string {
                if (self.cdnUuid().size() != 16)
                {
                    return "";
                }
                std::vector<int> indices = {3, 2, 1, 0, 5, 4, 7, 6, 9, 8, 15, 14, 13, 12, 11, 10};

                std::stringstream ss;
                ss << std::hex << std::setfill('0');
                for (int i : indices)
                {
                    ss << std::setw(2) << static_cast<int>(self.cdnUuid()[i]);
                    if (i == 0 || i == 4 || i == 6 || i == 8)
                        ss << '-';
                }

                return ss.str();
            }))
        .function("decode",
                  optional_override([](rive::FileAsset& self, emscripten ::val byteArray) {
                      std::vector<unsigned char> charVector;
                      const auto length = byteArray["byteLength"].as<unsigned>();
                      charVector.resize(length);

                      emscripten::val memoryView{
                          emscripten::typed_memory_view(length, charVector.data())};

                      memoryView.call<void>("set", byteArray);
                      self.decode(charVector, jsFactory());
                  }),
                  allow_raw_pointers());

    class_<rive::ImageAsset, base<rive::FileAsset>>("ImageAsset")
        .function(
            "setRenderImage",
            optional_override([](rive::ImageAsset& self, rive::RenderImage* renderImage) -> void {
                self.renderImage(std::unique_ptr<rive::RenderImage>(renderImage));
            }),
            allow_raw_pointers());

    class_<rive::FontAsset, base<rive::FileAsset>>("FontAsset")
        .function("setFont",
                  optional_override([](rive::FontAsset& self, rive::rcp<rive::Font> font) -> void {
                      // why is this rcp and not unique_ptr
                      self.font(rive::rcp<rive::Font>(font));
                  }),
                  allow_raw_pointers());

    class_<rive::StateMachineInstance>("StateMachineInstance")
        .constructor<rive::StateMachine*, rive::ArtboardInstance*>()
        .function("advance", &rive::StateMachineInstance::advance, allow_raw_pointers())
        .function("inputCount", &rive::StateMachineInstance::inputCount)
        .function("input", &rive::StateMachineInstance::input, allow_raw_pointers())
        .function("pointerDown",
                  optional_override([](rive::StateMachineInstance& self, double x, double y) {
                      self.pointerDown(rive::Vec2D((float)x, (float)y));
                  }))
        .function("pointerMove",
                  optional_override([](rive::StateMachineInstance& self, double x, double y) {
                      self.pointerMove(rive::Vec2D((float)x, (float)y));
                  }))
        .function("pointerUp",
                  optional_override([](rive::StateMachineInstance& self, double x, double y) {
                      self.pointerUp(rive::Vec2D((float)x, (float)y));
                  }))
        .function("reportedEventCount", &rive::StateMachineInstance::reportedEventCount)
        .function("reportedEventAt",
                  optional_override(
                      [](rive::StateMachineInstance& self, size_t index) -> emscripten::val {
                          const rive::EventReport report = self.reportedEventAt(index);
                          if (report.event() == nullptr)
                          {
                              return emscripten::val::undefined();
                          }
                          rive::Event* event = report.event();
                          emscripten::val eventObject = createRiveEventObject(event);
                          eventObject.set("delay", report.secondsDelay());
                          return eventObject;
                      }),
                  allow_raw_pointers())
        .function("stateChangedCount", &rive::StateMachineInstance::stateChangedCount)
        .function(
            "stateChangedNameByIndex",
            optional_override([](rive::StateMachineInstance& self, size_t index) -> std::string {
                const rive::LayerState* state = self.stateChangedByIndex(index);
                if (state != nullptr)
                    switch (state->coreType())
                    {
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
                  optional_override([](rive::SMIInput& self) -> rive::SMIBool* {
                      if (self.inputCoreType() != stateMachineBoolTypeKey)
                      {
                          return nullptr;
                      }
                      return static_cast<rive::SMIBool*>(&self);
                  }),
                  allow_raw_pointers())
        .function("asNumber",
                  optional_override([](rive::SMIInput& self) -> rive::SMINumber* {
                      if (self.inputCoreType() != stateMachineNumberTypeKey)
                      {
                          return nullptr;
                      }
                      return static_cast<rive::SMINumber*>(&self);
                  }),
                  allow_raw_pointers())
        .function("asTrigger",
                  optional_override([](rive::SMIInput& self) -> rive::SMITrigger* {
                      if (self.inputCoreType() != stateMachineTriggerTypeKey)
                      {
                          return nullptr;
                      }
                      return static_cast<rive::SMITrigger*>(&self);
                  }),
                  allow_raw_pointers());

    class_<rive::SMIBool, base<rive::SMIInput>>("SMIBool").property(
        "value",
        select_overload<bool() const>(&rive::SMIBool::value),
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

    enum_<JsAlignment>("Alignment")
        .value("topLeft", JsAlignment::topLeft)
        .value("topCenter", JsAlignment::topCenter)
        .value("topRight", JsAlignment::topRight)
        .value("centerLeft", JsAlignment::centerLeft)
        .value("center", JsAlignment::center)
        .value("centerRight", JsAlignment::centerRight)
        .value("bottomLeft", JsAlignment::bottomLeft)
        .value("bottomCenter", JsAlignment::bottomCenter)
        .value("bottomRight", JsAlignment::bottomRight);

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

    class_<rive::FileAssetLoader>("FileAssetLoader")
        .function("loadContents",
                  &FileAssetLoaderWrapper::loadContents,
                  pure_virtual(),
                  allow_raw_pointers())
        .allow_subclass<FileAssetLoaderWrapper>("FileAssetLoaderWrapper");

#ifdef DEBUG
    function("doLeakCheck", &__lsan_do_recoverable_leak_check);
#endif
}
