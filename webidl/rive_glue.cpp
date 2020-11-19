#include "animation/linear_animation.hpp"
#include "animation/linear_animation_instance.hpp"
#include "artboard.hpp"
#include "core/binary_reader.hpp"
#include "file.hpp"
#include "math/mat2d.hpp"
#include "renderer.hpp"
#include "transform_component.hpp"

using namespace rive;

class RiveHelper
{
public:
	static File* makeFile(char* bytes, unsigned int numBytes)
	{
		auto reader = BinaryReader((uint8_t*)bytes, numBytes);
		File* file = nullptr;
		auto result = File::import(reader, &file);
		return file;
	}

	static LinearAnimation* animation(Artboard* artboard, std::string name)
	{
		return artboard->animation<LinearAnimation>(name);
	}

	static TransformComponent* transformComponent(Artboard* artboard,
	                                              std::string name)
	{
		return artboard->find<TransformComponent>(name);
	}
};

class LinearAnimationInstanceJS : public LinearAnimationInstance
{
public:
	LinearAnimationInstanceJS(LinearAnimation* animation) :
	    LinearAnimationInstance(animation)
	{
	}
	void setTime(float value) { time(value); }
};

#include "glue.cpp"

namespace rive
{
	RenderPaint* makeRenderPaint()
	{
		return reinterpret_cast<RenderPaint*>(
		    EM_ASM_INT({ return Module['makeRenderPaint']().ptr; }));
	}

	RenderPath* makeRenderPath()
	{
		return reinterpret_cast<RenderPath*>(
		    EM_ASM_INT({ return Module['makeRenderPath']().ptr; }));
	}
} // namespace rive