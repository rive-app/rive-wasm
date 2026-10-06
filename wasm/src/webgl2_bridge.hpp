#ifndef _RIVE_WEBGL2_BRIDGE_HPP_
#define _RIVE_WEBGL2_BRIDGE_HPP_

#include "rive/rive_types.hpp"

#ifdef RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS

#include "rive/refcnt.hpp"
#include "rive/renderer.hpp"

// Canvas 2D delegates image mesh draws to the WebGL2 renderer, so its factory allocates render
// buffers here.
rive::rcp<rive::RenderBuffer> makeWebGL2RenderBuffer(rive::RenderBufferType type,
                                                     rive::RenderBufferFlags flags,
                                                     size_t sizeInBytes);

// Holds an image mesh's buffers and draw parameters until the WebGL2 renderer draws it into the
// atlas, which happens after canvas 2D's drawImageMesh() returns.
class WebGL2PendingMesh;

WebGL2PendingMesh* makeWebGL2PendingMesh(rive::rcp<rive::RenderBuffer> vertices_f32,
                                         rive::rcp<rive::RenderBuffer> uvCoords_f32,
                                         rive::rcp<rive::RenderBuffer> indices_u16,
                                         uint32_t vertexCount,
                                         uint32_t indexCount,
                                         rive::ImageSampler imageSampler);

const float* webGL2PendingMeshVertices(const WebGL2PendingMesh*);

#endif // RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS
#endif
