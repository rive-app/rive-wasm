// TODO: move to runtime/

#if defined(WITH_RIVE_SCRIPTNET) && defined(__EMSCRIPTEN__)

#include "rive/scriptnet/net.hpp"

#include <emscripten.h>
#include <emscripten/threading.h>
#include <string>
#include <vector>

#define EXPORT extern "C" EMSCRIPTEN_KEEPALIVE

using namespace rive;
using namespace rive::scriptnet;

namespace
{
// clang-format off
// js/script_fetch.js uses the UTF-8 writers.
EM_JS_DEPS(riveScriptFetch, "$UTF8ToString,$stringToUTF8,$lengthBytesUTF8,malloc,free");

// Views wasmMemory directly: memory growth detaches cached heap views.
EM_JS(int, rive_script_fetch_start, (uint32_t id, const char* url, const char* method, const char* const* headers, uint32_t headerCount, const uint8_t* body, uint32_t bodySize, uint32_t timeoutMs, uint32_t maxBodyBytes), {
    var bridge = Module["scriptFetch"];
    if (!bridge || typeof fetch !== "function") {
        return 0;
    }
    var words = new Uint32Array(wasmMemory.buffer, headers, headerCount * 2);
    var list = [];
    for (var i = 0; i < headerCount; i++) {
        list.push([UTF8ToString(words[i * 2]), UTF8ToString(words[i * 2 + 1])]);
    }
    // A copy out of the shared heap, so it can be transferred.
    var bytes = bodySize === 0 ? null : new Uint8Array(wasmMemory.buffer, body, bodySize).slice().buffer;
    bridge["start"](id, UTF8ToString(url), UTF8ToString(method), list, bytes, timeoutMs, maxBodyBytes >>> 0);
    return 1;
});

EM_JS(void, rive_script_fetch_abort, (uint32_t id), {
    var bridge = Module["scriptFetch"];
    if (bridge) {
        bridge["abort"](id);
    }
});

EM_JS(void, rive_script_fetch_resume, (uint32_t id), {
    var bridge = Module["scriptFetch"];
    if (bridge) {
        bridge["resume"](id);
    }
});
// clang-format on

class WebProvider : public Provider
{
public:
    void start(RequestId id, const HttpRequest& request) override
    {
        // The transport lives on the page's thread; outcomes are thread-affine.
        if (!emscripten_is_main_browser_thread())
        {
            fail(id,
                 {NetErrorCode::Network,
                  "on the web, only scripts on the page's main thread can fetch"});
            return;
        }
        std::vector<const char*> headers;
        headers.reserve(request.headers.size() * 2);
        for (const HttpHeader& header : request.headers)
        {
            headers.push_back(header.name.c_str());
            headers.push_back(header.value.c_str());
        }
        if (!rive_script_fetch_start(id,
                                     request.url.c_str(),
                                     request.method.c_str(),
                                     headers.data(),
                                     (uint32_t)request.headers.size(),
                                     request.body.data(),
                                     (uint32_t)request.body.size(),
                                     request.timeoutMs,
                                     limits().maxResponseBodyBytes))
        {
            fail(id, {NetErrorCode::Disabled, "this page has no script fetch transport"});
        }
    }

    void abort(RequestId id) override { rive_script_fetch_abort(id); }

    void resume(RequestId id) override { rive_script_fetch_resume(id); }
};
} // namespace

// `meta` is the status text, final URL, then header names and values, NUL
// separated. 0 refuses the response; 1 keeps timing the body, 2 does not.
EXPORT int
riveScriptFetchRespond(uint32_t id, uint32_t status, const char* meta, uint32_t metaLength)
{
    std::vector<std::string> fields;
    size_t fieldStart = 0;
    for (size_t i = 0; i <= metaLength; i++)
    {
        if (i == metaLength || meta[i] == '\0')
        {
            fields.emplace_back(meta + fieldStart, i - fieldStart);
            fieldStart = i + 1;
        }
    }
    if (fields.size() % 2 != 0 || status > 999)
    {
        fail(id, {NetErrorCode::Network, "the script fetch transport sent a malformed response"});
        return 0;
    }
    HttpResponse response;
    response.status = (uint16_t)status;
    response.statusText =
        fields[0].empty() ? standardReasonPhrase(response.status) : std::move(fields[0]);
    response.url = std::move(fields[1]);
    for (size_t i = 2; i < fields.size(); i += 2)
    {
        response.headers.push_back({std::move(fields[i]), std::move(fields[i + 1])});
    }
    // Re-check the final URL in case a proxy page followed a redirect.
    if (!response.url.empty())
    {
        HttpRequest landed;
        landed.url = response.url;
        NetError error;
        if (!NetPolicy::check(landed, limits(), &error))
        {
            fail(id, {NetErrorCode::Policy, "a redirect was refused: " + error.message});
            return 0;
        }
    }
    return respond(id, std::move(response)) ? 1 : 2;
}

// More of the body. False when the transport is to read no more: until it is
// resumed, or at all once the request is over.
EXPORT bool riveScriptFetchReceive(uint32_t id, const uint8_t* bytes, uint32_t length)
{
    return receive(id, bytes, length);
}

EXPORT void riveScriptFetchFinish(uint32_t id) { finish(id); }

// With no code and no message, when the page had no memory for either.
EXPORT void riveScriptFetchFail(uint32_t id,
                                const char* code,
                                uint32_t codeLength,
                                const char* message,
                                uint32_t messageLength)
{
    if (code == nullptr || message == nullptr)
    {
        fail(id, {NetErrorCode::Network, "the request failed and the page is out of memory"});
        return;
    }
    fail(id, {netErrorCodeFromName(code, codeLength), std::string(message, messageLength)});
}

// A byte cap of 0 keeps the default.
EXPORT void riveScriptFetchSetLimits(uint32_t maxResponseBytes)
{
    NetLimits netLimits;
    if (maxResponseBytes != 0)
    {
        netLimits.maxResponseBodyBytes = maxResponseBytes;
    }
    setLimits(netLimits);
}

// Requests already started finish on the transport that started them.
EXPORT void riveScriptFetchSetEnabled(bool enabled)
{
    if (!enabled)
    {
        setProvider(nullptr);
    }
    else if (!hasProvider())
    {
        setProvider(make_rcp<WebProvider>());
    }
}

#endif
