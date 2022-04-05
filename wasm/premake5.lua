workspace "rive"
configurations {"debug", "release"}

project "rive"
kind "ConsoleApp"
language "C++"
cppdialect "C++17"
targetdir ((os.getenv("OUT_DIR") or "build") .. "/bin/%{cfg.buildcfg}")
objdir ((os.getenv("OUT_DIR") or "build") .. "/obj/%{cfg.buildcfg}")
includedirs {"./submodules/rive-cpp/include"}

files {"./submodules/rive-cpp/src/**.cpp", "./src/bindings.cpp"}

buildoptions {
            "-Oz", 
            "-g0",
            "-s STRICT=1",
            "-s DISABLE_EXCEPTION_CATCHING=1", 
            "-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0", 
            "-DSINGLE",
            "-DANSI_DECLARATORS", 
            "-Wno-c++17-extensions", 
            "-fno-exceptions", 
            "-fno-rtti", 
            "-flto",
            "-fno-unwind-tables",
            "--no-entry"
        }

linkoptions {
            "-Oz", 
            "-g0", 
            "--closure 1",
            "--bind", 
            "-s ASSERTIONS=0",
            "-s FORCE_FILESYSTEM=0", 
            "-s MODULARIZE=1", 
            "-s NO_EXIT_RUNTIME=1", 
            "-s STRICT=1", 
            "-flto",
            "-s ALLOW_MEMORY_GROWTH=1", 
            "-s DISABLE_EXCEPTION_CATCHING=1", 
            "-s WASM=1", 
            -- "-s EXPORT_ES6=1",
            "-s USE_ES6_IMPORT_META=0", 
            "-s EXPORT_NAME=\"Rive\"", 
            "-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0", 
            "-DSINGLE",
            "-DANSI_DECLARATORS", 
            "-Wno-c++17-extensions", 
            "-fno-exceptions", 
            "-fno-rtti", 
            "-fno-unwind-tables",
            "--no-entry"
        }

filter { "options:not skia", "options:not single_file" }
    linkoptions {
            "--pre-js ./js/renderer.js",
            "-o %{cfg.targetdir}/canvas_advanced.mjs",
        }

filter { "options:not skia", "options:single_file" }
    linkoptions {
            "--pre-js ./js/renderer.js",
            "-o %{cfg.targetdir}/canvas_advanced_single.mjs",
        }


filter { "options:skia", "options:single_file" }
    linkoptions {
        "-o %{cfg.targetdir}/webgl_advanced_single.mjs",
    }

filter { "options:skia", "options:not single_file" }
    linkoptions {
        "-o %{cfg.targetdir}/webgl_advanced.mjs",
    }

filter "options:skia"
    defines {"RIVE_SKIA_RENDERER"}
    buildoptions { "-DSK_GL", "-DSK_SUPPORT_GPU=1" }
    includedirs {"./submodules/rive-cpp/skia/renderer/include", 
                "./submodules/rive-cpp/skia/dependencies/skia-experimental",
                "./submodules/rive-cpp/skia/dependencies/skia-experimental/include/core",
                "./submodules/rive-cpp/skia/dependencies/skia-experimental/include/effects",
                "./submodules/rive-cpp/skia/dependencies/skia-experimental/include/gpu",
                "./submodules/rive-cpp/skia/dependencies/skia-experimental/include/config"}
    files {"./submodules/rive-cpp/skia/renderer/src/**.cpp"}
    libdirs {"submodules/rive-cpp/skia/dependencies/skia-experimental/out/wasm/"}
    links {"skia", "GL"}
    linkoptions {
            "-s USE_WEBGL2=1",
            "-s MIN_WEBGL_VERSION=1",
            "-s MAX_WEBGL_VERSION=2",
            "--pre-js ./js/skia_renderer.js"
        }

filter "options:single_file"
        linkoptions {
            "-s SINGLE_FILE=1"
        }

filter "configurations:debug"
defines {"DEBUG"}
symbols "On"

filter "configurations:release"
defines {"RELEASE"}
defines {"NDEBUG"}
optimize "On"

newoption {
    trigger = "skia",
    description = "Set when linking with Skia."
}

newoption {
    trigger = "single_file",
    description = "Set when the wasm should be packed in with the js code."
}
