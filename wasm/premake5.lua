workspace "rive"
configurations {"debug", "release"}

project "rive"
kind "ConsoleApp"
language "C++"
cppdialect "C++17"
targetdir "build/bin/%{cfg.buildcfg}"
objdir "build/obj/%{cfg.buildcfg}"
includedirs {"./submodules/rive-cpp/include"}

files {"./submodules/rive-cpp/src/**.cpp", "./src/bindings.cpp"}

buildoptions {"-Oz", "-g1", "--closure 0", "--bind", "-g1", "-o build/bin/%{cfg.buildcfg}/rive.mjs", "-s ASSERTIONS=0",
              "-s FORCE_FILESYSTEM=0", "-s MODULARIZE=1", "-s NO_EXIT_RUNTIME=1", "-s STRICT=1",
              "-s ALLOW_MEMORY_GROWTH=1", "-s DISABLE_EXCEPTION_CATCHING=1", "-s WASM=1", "-s SINGLE_FILE=0",
              "-s USE_ES6_IMPORT_META=0", "-s EXPORT_NAME=\"Rive\"", "-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0",
              "-DSINGLE", "-DANSI_DECLARATORS", "-Wno-c++17-extensions", "-fno-exceptions", "-fno-rtti",
              "-fno-unwind-tables", "--no-entry", "--post-js ./js/marker.js"}

linkoptions {"-Oz", "-g1", "--closure 0", "--bind", "-g1", "-o build/bin/%{cfg.buildcfg}/rive.mjs", "-s ASSERTIONS=0",
             "-s FORCE_FILESYSTEM=0", "-s MODULARIZE=1", "-s NO_EXIT_RUNTIME=1", "-s STRICT=1",
             "-s ALLOW_MEMORY_GROWTH=1", "-s DISABLE_EXCEPTION_CATCHING=1", "-s WASM=1", "-s SINGLE_FILE=0",
             "-s USE_ES6_IMPORT_META=0", "-s EXPORT_NAME=\"Rive\"", "-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0", "-DSINGLE",
             "-DANSI_DECLARATORS", "-Wno-c++17-extensions", "-fno-exceptions", "-fno-rtti", "-fno-unwind-tables",
             "--no-entry", "--post-js ./js/marker.js"}

filter "configurations:debug"
defines {"DEBUG"}
symbols "On"

filter "configurations:release"
defines {"RELEASE"}
defines {"NDEBUG"}
optimize "On"

