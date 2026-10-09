dofile('rive_build_config.lua')

-- Canvas 2D replay drops ore work, so its sessions record none. Workspace scope,
-- as it changes the session layout; tools builds that embed this have ore backends.
if not _OPTIONS['with-canvas-2d'] and (_OPTIONS['renderer'] or 'c2d') ~= 'webgl2' then
    defines({ 'RIVE_DEFERRED_NO_ORE' })
end

newoption({
    trigger = 'profiling-funcs',
    description = 'Build with --profiling-funcs for named WASM symbols in DevTools (uses -O2 instead of -Oz)',
})
RIVE_RUNTIME_DIR = os.isdir('../../runtime') and '../../runtime' or './submodules/rive-runtime'
dofile(RIVE_RUNTIME_DIR .. '/premake5_v2.lua')

RIVE_PLS_DIR = os.isdir('../../runtime/renderer') and '../../runtime/renderer'
    or './submodules/rive-runtime/renderer'

local rendererOption = _OPTIONS['renderer'] or 'c2d'
RIVE_WITH_CANVAS_2D = rendererOption == 'c2d' or rendererOption == 'c2d_only'
RIVE_WITH_WEBGL2 = rendererOption == 'webgl2' or rendererOption == 'c2d'

if RIVE_WITH_WEBGL2 then
    dofile(RIVE_PLS_DIR .. '/premake5_pls_renderer.lua')
end

-- emcc emits a UMD script; finalize_glue.py rewrites it into the ES module we
-- publish. Part of the link so that no caller has to remember it.
local function finalizeGlue(moduleName)
    postbuildcommands({
        'python3 '
            .. path.getabsolute('./finalize_glue.py')
            .. ' '
            .. path.getabsolute(RIVE_BUILD_OUT)
            .. '/'
            .. moduleName,
    })
end

project('rive_wasm')
do
    -- Filter these options out when generate the compilation database.
    filter('system:emscripten')
    do
        buildoptions({
            '-s STRICT=1',
            '-s DISABLE_EXCEPTION_CATCHING=1',
            '-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0',
            '-DSINGLE',
            '-DANSI_DECLARATORS',
            '-Wno-c++17-extensions',
            '-fno-exceptions',
            '-fno-rtti',
            '-fno-unwind-tables',
            '--no-entry',
            '-DYOGA_EXPORT=',
        })

        -- The pre-js glue reads these off Module; they are not exported by default.
        local exported_runtime_methods = 'HEAP8,HEAPU8,HEAP32,HEAPU32,HEAPF32,HEAPU16'
        if _OPTIONS['with_rive_tools'] then
            exported_runtime_methods = exported_runtime_methods .. ',flushPendingDeletes'
        end

        linkoptions({
            '--bind',
            -- TODO: uncomment this to enable asyncify for wasm, check in with -Oz as well
            -- '-O3',
            -- '-s ASYNCIFY',
            '-s STACK_SIZE=256kb',
            -- Nothing opens files, so the filesystem glue would ship unused.
            '-s FILESYSTEM=0',
            '-s MODULARIZE=1',
            '-s NO_EXIT_RUNTIME=1',
            '-s DISABLE_EXCEPTION_CATCHING=1',
            '-s WASM=1',
            -- "-s EXPORT_ES6=1",
            '-s EXPORT_NAME="Rive"',
            '-s ENVIRONMENT="web,webview,worker"',
            -- Pinned rather than derived. emcc defaults WASM_BIGINT from the
            -- browser baseline, which the fallback lowers (MIN_SAFARI_VERSION
            -- in the no-wasm-simd block of rive_build_config.lua), resolving to
            -- 0 there and 1 here. WASM_BIGINT=0 implies LEGALIZE_JS_FFI, which
            -- splits each i64 at the JS boundary into two i32s, so the two
            -- builds would disagree on import signatures. They share one JS
            -- glue and must match.
            '-s WASM_BIGINT=0',
            '-s EXPORTED_RUNTIME_METHODS=' .. exported_runtime_methods,
            '-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0',
            '-DSINGLE',
            '-DANSI_DECLARATORS',
            '-Wno-c++17-extensions',
            '-fno-exceptions',
            '-fno-rtti',
            '-fno-unwind-tables',
            '--no-entry',
        })
    end

    filter('options:config=debug')
    do
        defines({ 'DEBUG' })
        symbols('On')
        linkoptions({
            '-s ERROR_ON_UNDEFINED_SYMBOLS=0',
            '-s ASSERTIONS=1',
            '-s ABORTING_MALLOC=0',
            '-g',
        })
    end

    filter('options:profiling-funcs')
    do
        optimize('On')
        defines({ 'NDEBUG' })
        -- Explicit -O2 overrides the -Oz added by rive_build_config.lua's release wasm-arch block,
        -- since it appears later in the accumulated flags (last opt flag wins in Clang).
        buildoptions({ '-O2' })
        linkoptions({
            '-s ASSERTIONS=0',
            '--profiling-funcs',
        })
    end

    filter('options:config=release')
    do
        -- Link-time -Oz gates emcc's wasm-opt pass; without it the wasm ships unoptimized.
        -- -lexports.js disables emcc's internal MINIFY_WASM_EXPORT_NAMES (see
        -- the '-lexports.js' in linker_args check in link.py). Without it, -Oz
        -- renames imports/exports to per-build ordinals (a.a, a.b, ...) numbered
        -- in each binary's own import order, which the primary and fallback do
        -- not agree on. One JS glue serves both, so the names must stay literal.
        -- DECLARE_ASM_MODULE_EXPORTS=0 reaches the same setting, but emcc
        -- rejects it alongside MODULARIZE. TODO: revisit how to work with the
        -- recommended flag alongside MODULARIZE
        -- -Oz would otherwise assume TextDecoder, which jsdom does not have.
        linkoptions({
            '-Oz',
            '-s TEXTDECODER=1',
            -- Whole program flow analysis still finds code -Oz alone keeps.
            '-s BINARYEN_EXTRA_PASSES=--gufa,-Oz',
            '-s ASSERTIONS=0',
            '-lexports.js',
            '--closure 1',
        })
    end

    filter({})

    kind('ConsoleApp')
    language('C++')
    includedirs({
        RIVE_RUNTIME_DIR .. '/include',
    })
    fatalwarnings({ 'All' })

    links({
        'rive',
    })

    files({ './src/*.cpp' })

    linkoptions({
        '--pre-js ' .. path.getabsolute('./js/animation_callback_handler.js'),
        '--pre-js ' .. path.getabsolute('./js/max_recent_size.js'),
        '--pre-js ' .. path.getabsolute('./js/shared.js'),
    })

    do
        includedirs({ './src/skia_imports' })
        files({ './src/skia_imports/**.cpp' })
    end

    filter({ 'options:with_rive_text' })
    do
        defines({ 'WITH_RIVE_TEXT' })
        links({
            'rive_harfbuzz',
            'rive_sheenbidi',
        })
    end

    filter({ 'options:with_rive_audio=system or options:with_rive_audio=external' })
    do
        -- rive_lua_libs.hpp reaches audio headers, which include miniaudio.h.
        includedirs({ miniaudio })
        links({
            'miniaudio',
        })
    end

    filter({ 'options:with_rive_layout' })
    do
        defines({ 'YOGA_EXPORT=' })
        includedirs({ yoga })
        links({
            'rive_yoga',
        })
    end

    filter({})
    if _OPTIONS['scripting_vm'] == 'wasm' or _OPTIONS['scripting_vm'] == 'both'
    then
        -- Script modules run on the browser's wasm engine; this is the page
        -- side of that, generated in the runtime.
        linkoptions({
            '--pre-js ' .. path.getabsolute(
                RIVE_RUNTIME_DIR .. '/src/wasm/web/rive_scripting_pre.js'
            ),
        })
    end

    filter({ 'options:with_rive_scripting' })
    do
        includedirs({
            luau .. '/VM/include',
            luau .. '/Common/include',
        })
        links({
            'luau_vm',
        })
    end

    filter({})

    if RIVE_WITH_CANVAS_2D then
        defines({ 'RIVE_CANVAS_2D_RENDERER' })
        -- The pure 2D deferred layer needs only the cmd headers and sources,
        -- no ore backend. gpu_resource carries the GPUResource vtable,
        -- ore_binding_map the blob codec and ore_bind_group_layout the layout
        -- queries the ore cmd headers reference.
        includedirs({ RIVE_PLS_DIR .. '/include' })
        if not RIVE_WITH_WEBGL2 then
            -- rive_pls_renderer already compiles these, so the c2d build,
            -- which links it, would define them twice.
            files({
                RIVE_PLS_DIR .. '/src/deferred_cmd.cpp',
                RIVE_PLS_DIR .. '/src/gpu_resource.cpp',
                RIVE_PLS_DIR .. '/src/ore/ore_binding_map.cpp',
                RIVE_PLS_DIR .. '/src/ore/ore_bind_group_layout.cpp',
            })
        end
        linkoptions({
            -- Classic-script wrapper: currentScript-based, no import.meta.
            -- finalize_glue.py converts it to the published ESM shape we
            -- ship in v2.x
            '--oformat=js',
        })

        linkoptions({
            '--pre-js ' .. path.getabsolute('./js/canvas_offscreen_renderer.js'),
        })
        if RIVE_WITH_WEBGL2 then
            linkoptions({
                '--pre-js ' .. path.getabsolute('./js/canvas_offscreen_webgl2.js'),
            })
        else
            -- Without the WebGL2 renderer, a standalone WebGL context draws image meshes
            -- and nothing else is delegated.
            linkoptions({
                '--pre-js ' .. path.getabsolute('./js/canvas_offscreen_mesh.js'),
            })
        end

        linkoptions({
            '--pre-js ' .. path.getabsolute('./js/renderer.js'),
        })

        local moduleName = RIVE_WITH_WEBGL2 and 'canvas_advanced'
            or 'canvas_advanced_c2d_only'
        if _OPTIONS['wasm_single'] then
            moduleName = moduleName .. '_single'
            linkoptions({
                -- Embed the wasm as base64; raw binary-in-UTF-8 gzips worse.
                '-s SINGLE_FILE_BINARY_ENCODE=0',
            })
        end
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/' .. moduleName .. '.mjs',
        })
        finalizeGlue(moduleName .. '.mjs')
        -- The make target is the glue, so a link that is up to date is skipped.
        targetname(moduleName)
        targetextension('.mjs')
    end

    if RIVE_WITH_WEBGL2 then
        defines({ 'RIVE_WEBGL2_RENDERER' })
        includedirs({ RIVE_PLS_DIR .. '/include' })
        links({
            'rive_pls_renderer',
            'GL',
        })
        linkoptions({
            '-s USE_WEBGL2=1',
            '-s MIN_WEBGL_VERSION=2',
            '-s MAX_WEBGL_VERSION=2',
        })

        -- The WebGL renderer is either standalone or used by the canvas 2D renderer for
        -- features that canvas 2D can't implement itself.
        if RIVE_WITH_CANVAS_2D then
            defines({ 'RIVE_WEBGL2_RENDERER_CANVAS_BINDINGS' })
        else
            defines({ 'RIVE_WEBGL2_RENDERER_STANDALONE_BINDINGS' })
            linkoptions({
                -- See the Canvas2D branch.
                '--oformat=js',
                '--pre-js ' .. path.getabsolute('./js/webgl2_renderer.js'),
                '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl2_advanced.mjs',
            })
            finalizeGlue('webgl2_advanced.mjs')
            targetname('webgl2_advanced')
            targetextension('.mjs')
        end

        filter({ 'system:not emscripten' })
        do
            -- For generating the compilation database.
            includedirs({ RIVE_PLS_DIR .. '/glad' })
            externalincludedirs({ RIVE_PLS_DIR .. 'glad/include' })
        end
    end

    filter({})
end

newoption({
    trigger = 'renderer',
    description = 'Which renderer to use.',
    allowed = {
        { 'c2d', 'Canvas2D, delegating what it cannot draw to an internal WebGL2' },
        { 'c2d_only', 'Canvas2D alone, some features unsupported' },
        { 'webgl2', 'WebGL2' },
    },
    default = 'c2d',
})
