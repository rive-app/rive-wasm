dofile('rive_build_config.lua')

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
    })

    linkoptions({
        '--bind',
        -- TODO: uncomment this to enable asyncify for wasm, check in with -Oz as well
        -- '-O3',
        -- '-s ASYNCIFY',
        '-s FORCE_FILESYSTEM=0',
        '-s MODULARIZE=1',
        '-s NO_EXIT_RUNTIME=1',
        '-s STRICT=1',
        '-s DISABLE_EXCEPTION_CATCHING=1',
        '-s WASM=1',
        -- "-s EXPORT_ES6=1",
        '-s USE_ES6_IMPORT_META=0',
        '-s EXPORT_NAME="Rive"',
        '-s ENVIRONMENT="web,webview,worker"',
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
        '-s DEMANGLE_SUPPORT=1',
    })
end

filter('options:config=release')
do
    linkoptions({ '-s ASSERTIONS=0', '--closure 1' })
end

filter({})

RIVE_RUNTIME_DIR = os.isdir('../../runtime') and '../../runtime' or './submodules/rive-cpp'
dofile(RIVE_RUNTIME_DIR .. '/premake5_v2.lua')

RIVE_PLS_DIR = os.isdir('../../pls') and '../../pls' or './submodules/rive-renderer'
if _OPTIONS['renderer'] == 'webgl2' then
    dofile(RIVE_PLS_DIR .. '/premake5_pls_renderer.lua')
end

project('rive_wasm')
do
    kind('ConsoleApp')
    language('C++')
    cppdialect('C++17')
    includedirs({
        RIVE_RUNTIME_DIR .. '/include',
    })
    flags({ 'FatalCompileWarnings' })

    files({
        './src/*.cpp',
    })

    links({
        'rive',
    })

    files({ './src/*.cpp' })

    linkoptions({
        '--pre-js ' .. path.getabsolute('./js/animation_callback_handler.js'),
        '--pre-js ' .. path.getabsolute('./js/max_recent_size.js'),
        '--pre-js ' .. path.getabsolute('./js/shared.js'),
    })

    filter({ 'not options:renderer=skia' })
    do
        includedirs({ './src/skia_imports' })
        files({ './src/skia_imports/**.cpp' })
    end

    filter({ 'options:with_rive_text' })
    do
        links({
            'rive_harfbuzz',
            'rive_sheenbidi',
        })
    end

    filter({ 'options:renderer=c2d' })
    do
        defines({ 'RIVE_CANVAS_2D_RENDERER' })
        linkoptions({
            '--pre-js ' .. path.getabsolute('./js/renderer.js'),
        })
    end

    filter({ 'options:renderer=c2d', 'options:not wasm_single' })
    do
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced.mjs',
        })
    end

    filter({ 'options:renderer=c2d', 'options:wasm_single' })
    do
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced_single.mjs',
        })
    end

    filter({ 'options:renderer=skia', 'options:wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl_advanced_single.mjs' })
    end

    filter({ 'options:renderer=skia', 'options:not wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl_advanced.mjs' })
    end

    filter('options:renderer=skia')
    do
        defines({ 'RIVE_SKIA_RENDERER' })
        buildoptions({ '-DSK_GL', '-DSK_SUPPORT_GPU=1' })
        includedirs({
            RIVE_RUNTIME_DIR .. '/skia/renderer/include',
            RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized',
            RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized/include/core',
            RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized/include/effects',
            RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized/include/gpu',
            RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized/include/config',
        })
        files({ RIVE_RUNTIME_DIR .. '/skia/renderer/src/**.cpp' })
        libdirs({ RIVE_RUNTIME_DIR .. '/skia/dependencies/skia_rive_optimized/out/wasm/' })
        links({ 'skia', 'GL' })
        linkoptions({
            '-s USE_WEBGL2=1',
            '-s MIN_WEBGL_VERSION=1',
            '-s MAX_WEBGL_VERSION=2',
            '--pre-js ' .. path.getabsolute('./js/skia_renderer.js'),
        })
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
            '--pre-js ' .. path.getabsolute('./js/webgl2_renderer.js'),
        })
    end

    filter({ 'options:renderer=webgl2', 'options:wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl2_advanced_single.mjs' })
    end

    filter({ 'options:renderer=webgl2', 'options:not wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl2_advanced.mjs' })
    end

    filter({ 'options:renderer=webgl2', 'system:not emscripten' })
    do
        -- For generating the compilation database.
        includedirs({ RIVE_PLS_DIR .. '/glad' })
    end

    filter({})
end

newoption({
    trigger = 'renderer',
    description = 'Which renderer to use.',
    allowed = {
        { 'c2d' },
        { 'skia' },
        { 'webgl2' },
    },
    default = 'c2d',
})
