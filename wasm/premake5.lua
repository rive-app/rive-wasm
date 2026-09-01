dofile('rive_build_config.lua')

newoption({
    trigger = 'profiling-funcs',
    description = 'Build with --profiling-funcs for named WASM symbols in DevTools (uses -O2 instead of -Oz)',
})
RIVE_RUNTIME_DIR = os.isdir('../../runtime') and '../../runtime' or './submodules/rive-runtime'
dofile(RIVE_RUNTIME_DIR .. '/premake5_v2.lua')

RIVE_PLS_DIR = os.isdir('../../runtime/renderer') and '../../runtime/renderer'
    or './submodules/rive-runtime/renderer'
if _OPTIONS['renderer'] == 'webgl2' then
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
        if WITH_RIVE_TOOLS then
            exported_runtime_methods = exported_runtime_methods .. ',flushPendingDeletes'
        end

        linkoptions({
            '--bind',
            -- TODO: uncomment this to enable asyncify for wasm, check in with -Oz as well
            -- '-O3',
            -- '-s ASYNCIFY',
            '-s STACK_SIZE=256kb',
            '-s FORCE_FILESYSTEM=0',
            '-s MODULARIZE=1',
            '-s NO_EXIT_RUNTIME=1',
            '-s DISABLE_EXCEPTION_CATCHING=1',
            '-s WASM=1',
            -- "-s EXPORT_ES6=1",
            '-s EXPORT_NAME="Rive"',
            '-s ENVIRONMENT="web,webview,worker"',
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
        -- Link-time -Os gates emcc's wasm-opt pass; without it the wasm ships unoptimized.
        linkoptions({ '-Os', '-s ASSERTIONS=0', '--closure 1' })
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

    filter({ 'options:renderer=c2d' })
    do
        defines({ 'RIVE_CANVAS_2D_RENDERER' })
        -- The pure 2D deferred layer needs only the cmd headers and sources,
        -- no ore backend. gpu_resource carries the GPUResource vtable,
        -- ore_binding_map the blob codec and ore_bind_group_layout the layout
        -- queries the ore cmd headers reference.
        includedirs({ RIVE_PLS_DIR .. '/include' })
        files({
            RIVE_PLS_DIR .. '/src/deferred_cmd.cpp',
            RIVE_PLS_DIR .. '/src/gpu_resource.cpp',
            RIVE_PLS_DIR .. '/src/ore/ore_binding_map.cpp',
            RIVE_PLS_DIR .. '/src/ore/ore_bind_group_layout.cpp',
        })
        linkoptions({
            -- Classic-script wrapper: currentScript-based, no import.meta.
            -- finalize_glue.py converts it to the published ESM shape we
            -- ship in v2.x
            '--oformat=js',
            '--pre-js ' .. path.getabsolute('./js/renderer.js'),
        })
    end

    filter({ 'options:renderer=c2d', 'options:not wasm_single' })
    do
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced.mjs',
        })
        finalizeGlue('canvas_advanced.mjs')
    end

    filter({ 'options:renderer=c2d', 'options:wasm_single' })
    do
        linkoptions({
            -- Embed the wasm as base64; raw binary-in-UTF-8 gzips worse.
            '-s SINGLE_FILE_BINARY_ENCODE=0',
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced_single.mjs',
        })
        finalizeGlue('canvas_advanced_single.mjs')
    end

    filter({ 'options:renderer=webgl2' })
    do
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
            -- See the c2d filter.
            '--oformat=js',
            '--pre-js ' .. path.getabsolute('./js/webgl2_renderer.js'),
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl2_advanced.mjs',
        })
        finalizeGlue('webgl2_advanced.mjs')
    end

    filter({ 'options:renderer=webgl2', 'system:not emscripten' })
    do
        -- For generating the compilation database.
        includedirs({ RIVE_PLS_DIR .. '/glad' })
        externalincludedirs({ RIVE_PLS_DIR .. 'glad/include' })
    end

    filter({})
end

newoption({
    trigger = 'renderer',
    description = 'Which renderer to use.',
    allowed = {
        { 'c2d' },
        { 'webgl2' },
    },
    default = 'c2d',
})
