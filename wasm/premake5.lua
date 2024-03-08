dofile('rive_build_config.lua')

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

filter('options:config=debug')
do
    defines({ 'DEBUG' })
    symbols('On')
    buildoptions({
        '-g2',
        '-fsanitize=address',
        -- '-fsanitize=leak'
    })
    linkoptions({
        '-s ERROR_ON_UNDEFINED_SYMBOLS=0',
        '-s ASSERTIONS=1',
        '-s ABORTING_MALLOC=0',
        '-s DEMANGLE_SUPPORT=1',
        '-g2',
        '-fsanitize=address',
        -- '-fsanitize=leak',
    })
end

filter('options:config=release')
do
    buildoptions({ '-flto', '-Oz', '-g0' })
    linkoptions({ '-s ASSERTIONS=0', '--closure 1', '-flto', '-Oz', '-g0' })
end

filter({})

RIVE_RUNTIME_DIR = os.isdir('../../runtime') and '../../runtime' or './submodules/rive-cpp'
dofile(RIVE_RUNTIME_DIR .. '/premake5_v2.lua')

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

    filter({ 'options:with_rive_text' })
    do
        links({
            'rive_harfbuzz',
            'rive_sheenbidi',
        })
    end

    filter({ 'options:not skia' })
    do
        linkoptions({
            '--pre-js ' .. path.getabsolute('./js/animation_callback_handler.js'),
            '--pre-js ' .. path.getabsolute('./js/max_recent_size.js'),
            '--pre-js ' .. path.getabsolute('./js/renderer.js'),
            '--pre-js ' .. path.getabsolute('./js/shared.js'),
        })
    end

    filter({ 'options:not skia', 'options:not wasm_single' })
    do
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced.mjs',
        })
    end

    filter({ 'options:not skia', 'options:wasm_single' })
    do
        linkoptions({
            '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/canvas_advanced_single.mjs',
        })
    end

    filter({ 'options:skia', 'options:wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl_advanced_single.mjs' })
    end

    filter({ 'options:skia', 'options:not wasm_single' })
    do
        linkoptions({ '-o ' .. path.getabsolute(RIVE_BUILD_OUT) .. '/webgl_advanced.mjs' })
    end

    filter('options:skia')
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
            '--pre-js ' .. path.getabsolute('./js/animation_callback_handler.js'),
            '--pre-js ' .. path.getabsolute('./js/max_recent_size.js'),
            '--pre-js ' .. path.getabsolute('./js/skia_renderer.js'),
            '--pre-js ' .. path.getabsolute('./js/shared.js'),
        })
    end

    filter('options:not skia')
    do
        includedirs({ './src/skia_imports' })
        files({ './src/skia_imports/**.cpp' })
    end

    filter({})
end

newoption({ trigger = 'skia', description = 'Set when linking with Skia.' })
