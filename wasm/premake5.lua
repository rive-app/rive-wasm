workspace 'rive'
configurations {'debug', 'release'}

project 'rive'

kind 'ConsoleApp'
language 'C++'
cppdialect 'C++17'
targetdir((os.getenv('OUT_DIR') or 'build') .. '/bin/%{cfg.buildcfg}')
objdir((os.getenv('OUT_DIR') or 'build') .. '/obj/%{cfg.buildcfg}')
includedirs {'./submodules/rive-cpp/include'}

files {'./submodules/rive-cpp/src/**.cpp', './src/*.cpp'}

buildoptions {
    '-s STRICT=1',
    '-s DISABLE_EXCEPTION_CATCHING=1',
    '-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0',
    '-DSINGLE',
    '-DANSI_DECLARATORS',
    '-Wno-c++17-extensions',
    '-fno-exceptions',
    '-fno-rtti',
    '-fno-unwind-tables',
    '--no-entry'
}

linkoptions {
    '--bind',
    '-s FORCE_FILESYSTEM=0',
    '-s MODULARIZE=1',
    '-s NO_EXIT_RUNTIME=1',
    '-s STRICT=1',
    '-s DYNAMIC_EXECUTION=0',
    '-s ALLOW_MEMORY_GROWTH=1',
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
    '--no-entry'
}

filter {'options:not skia', 'options:not single_file'}
do
    linkoptions {
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/renderer.js',
        '-o %{cfg.targetdir}/canvas_advanced.mjs'
    }
end

filter {'options:not skia', 'options:single_file'}
do
    linkoptions {
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/renderer.js',
        '-o %{cfg.targetdir}/canvas_advanced_single.mjs'
    }
end

filter {'options:skia', 'options:single_file'}
do
    linkoptions {
        '-o %{cfg.targetdir}/webgl_advanced_single.mjs'
    }
end

filter {'options:skia', 'options:not single_file'}
do
    linkoptions {
        '-o %{cfg.targetdir}/webgl_advanced.mjs'
    }
end

filter 'options:skia'
do
    defines {'RIVE_SKIA_RENDERER'}
    buildoptions {'-DSK_GL', '-DSK_SUPPORT_GPU=1'}
    includedirs {
        './submodules/rive-cpp/skia/renderer/include',
        './submodules/rive-cpp/skia/dependencies/skia_rive_optimized',
        './submodules/rive-cpp/skia/dependencies/skia_rive_optimized/include/core',
        './submodules/rive-cpp/skia/dependencies/skia_rive_optimized/include/effects',
        './submodules/rive-cpp/skia/dependencies/skia_rive_optimized/include/gpu',
        './submodules/rive-cpp/skia/dependencies/skia_rive_optimized/include/config'
    }
    files {'./submodules/rive-cpp/skia/renderer/src/**.cpp'}
    libdirs {'submodules/rive-cpp/skia/dependencies/skia_rive_optimized/out/wasm/'}
    links {'skia', 'GL'}
    linkoptions {
        '-s USE_WEBGL2=1',
        '-s MIN_WEBGL_VERSION=1',
        '-s MAX_WEBGL_VERSION=2',
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/skia_renderer.js'
    }
end

filter 'options:not skia'
do
    includedirs {'./src/skia_imports'}
    files {'./src/skia_imports/**.cpp'}
end

filter 'options:single_file'
do
    linkoptions {
        '-s SINGLE_FILE=1'
    }
end

filter 'configurations:debug'
do
    defines {'DEBUG'}
    symbols 'On'
    buildoptions {
        '-g2',
        '-fsanitize=address'
        -- '-fsanitize=leak'
    }
    linkoptions {
        '-s ERROR_ON_UNDEFINED_SYMBOLS=0',
        '-s ASSERTIONS=1',
        '-s ABORTING_MALLOC=0',
        '-s DEMANGLE_SUPPORT=1',
        '-g2',
        '-fsanitize=address'
        -- '-fsanitize=leak',
    }
end

filter 'configurations:release'
do
    defines {'RELEASE'}
    defines {'NDEBUG'}
    optimize 'On'
    buildoptions {
        '-flto',
        '-Oz',
        '-g0'
    }
    linkoptions {
        '-s ASSERTIONS=0',
        '--closure 1',
        '-flto',
        '-Oz',
        '-g0'
    }
end

newoption {
    trigger = 'skia',
    description = 'Set when linking with Skia.'
}

newoption {
    trigger = 'single_file',
    description = 'Set when the wasm should be packed in with the js code.'
}
