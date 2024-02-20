local dependency = require('dependency')
harfbuzz = dependency.github('rive-app/harfbuzz', 'rive_8.3.0')
sheenbidi = dependency.github('Tehreer/SheenBidi', 'v2.6')
miniaudio = dependency.github('rive-app/miniaudio', 'rive_changes')

workspace('rive')
configurations({ 'debug', 'release' })

project('rive')

kind('ConsoleApp')
language('C++')
cppdialect('C++17')
targetdir((os.getenv('OUT_DIR') or 'build') .. '/bin/%{cfg.buildcfg}')
objdir((os.getenv('OUT_DIR') or 'build') .. '/obj/%{cfg.buildcfg}')
source = os.isdir('../../runtime') and '../../runtime' or './submodules/rive-cpp'
includedirs({
    source .. '/include',
    harfbuzz .. '/src',
    sheenbidi .. '/Headers',
    miniaudio,
})
flags({ 'FatalCompileWarnings' })

files({
    source .. '/src/**.cpp',
    './src/*.cpp',
    harfbuzz .. '/src/hb-aat-layout-ankr-table.hh',
    harfbuzz .. '/src/hb-aat-layout-bsln-table.hh',
    harfbuzz .. '/src/hb-aat-layout-common.hh',
    harfbuzz .. '/src/hb-aat-layout-feat-table.hh',
    harfbuzz .. '/src/hb-aat-layout-just-table.hh',
    harfbuzz .. '/src/hb-aat-layout-kerx-table.hh',
    harfbuzz .. '/src/hb-aat-layout-morx-table.hh',
    harfbuzz .. '/src/hb-aat-layout-opbd-table.hh',
    harfbuzz .. '/src/hb-aat-layout-trak-table.hh',
    harfbuzz .. '/src/hb-aat-layout.cc',
    harfbuzz .. '/src/hb-aat-layout.hh',
    harfbuzz .. '/src/hb-aat-ltag-table.hh',
    harfbuzz .. '/src/hb-aat-map.cc',
    harfbuzz .. '/src/hb-aat-map.hh',
    harfbuzz .. '/src/hb-aat.h',
    harfbuzz .. '/src/hb-algs.hh',
    harfbuzz .. '/src/hb-array.hh',
    harfbuzz .. '/src/hb-atomic.hh',
    harfbuzz .. '/src/hb-bimap.hh',
    harfbuzz .. '/src/hb-bit-page.hh',
    harfbuzz .. '/src/hb-bit-set-invertible.hh',
    harfbuzz .. '/src/hb-bit-set.hh',
    harfbuzz .. '/src/hb-blob.cc',
    harfbuzz .. '/src/hb-blob.hh',
    harfbuzz .. '/src/hb-buffer-deserialize-json.hh',
    harfbuzz .. '/src/hb-buffer-deserialize-text.hh',
    harfbuzz .. '/src/hb-buffer-serialize.cc',
    harfbuzz .. '/src/hb-buffer-verify.cc',
    harfbuzz .. '/src/hb-buffer.cc',
    harfbuzz .. '/src/hb-buffer.hh',
    harfbuzz .. '/src/hb-cache.hh',
    harfbuzz .. '/src/hb-cff-interp-common.hh',
    harfbuzz .. '/src/hb-cff-interp-cs-common.hh',
    harfbuzz .. '/src/hb-cff-interp-dict-common.hh',
    harfbuzz .. '/src/hb-cff1-interp-cs.hh',
    harfbuzz .. '/src/hb-cff2-interp-cs.hh',
    harfbuzz .. '/src/hb-common.cc',
    harfbuzz .. '/src/hb-config.hh',
    harfbuzz .. '/src/hb-debug.hh',
    harfbuzz .. '/src/hb-dispatch.hh',
    harfbuzz .. '/src/hb-draw.cc',
    harfbuzz .. '/src/hb-draw.h',
    harfbuzz .. '/src/hb-draw.hh',
    harfbuzz .. '/src/hb-face.cc',
    harfbuzz .. '/src/hb-face.hh',
    harfbuzz .. '/src/hb-font.cc',
    harfbuzz .. '/src/hb-font.hh',
    harfbuzz .. '/src/hb-iter.hh',
    harfbuzz .. '/src/hb-kern.hh',
    harfbuzz .. '/src/hb-machinery.hh',
    harfbuzz .. '/src/hb-map.cc',
    harfbuzz .. '/src/hb-map.hh',
    harfbuzz .. '/src/hb-meta.hh',
    harfbuzz .. '/src/hb-ms-feature-ranges.hh',
    harfbuzz .. '/src/hb-mutex.hh',
    harfbuzz .. '/src/hb-null.hh',
    harfbuzz .. '/src/hb-number-parser.hh',
    harfbuzz .. '/src/hb-number.cc',
    harfbuzz .. '/src/hb-number.hh',
    harfbuzz .. '/src/hb-object.hh',
    harfbuzz .. '/src/hb-open-file.hh',
    harfbuzz .. '/src/hb-open-type.hh',
    harfbuzz .. '/src/hb-ot-cff-common.hh',
    harfbuzz .. '/src/hb-ot-cff1-std-str.hh',
    harfbuzz .. '/src/hb-ot-cff1-table.cc',
    harfbuzz .. '/src/hb-ot-cff1-table.hh',
    harfbuzz .. '/src/hb-ot-cff2-table.cc',
    harfbuzz .. '/src/hb-ot-cff2-table.hh',
    harfbuzz .. '/src/hb-ot-cmap-table.hh',
    harfbuzz .. '/src/hb-ot-color-cbdt-table.hh',
    harfbuzz .. '/src/hb-ot-color-colr-table.hh',
    harfbuzz .. '/src/hb-ot-color-colrv1-closure.hh',
    harfbuzz .. '/src/hb-ot-color-cpal-table.hh',
    harfbuzz .. '/src/hb-ot-color-sbix-table.hh',
    harfbuzz .. '/src/hb-ot-color-svg-table.hh',
    harfbuzz .. '/src/hb-ot-color.cc',
    harfbuzz .. '/src/hb-ot-color.h',
    harfbuzz .. '/src/hb-ot-deprecated.h',
    harfbuzz .. '/src/hb-ot-face-table-list.hh',
    harfbuzz .. '/src/hb-ot-face.cc',
    harfbuzz .. '/src/hb-ot-face.hh',
    harfbuzz .. '/src/hb-ot-font.cc',
    harfbuzz .. '/src/hb-ot-gasp-table.hh',
    harfbuzz .. '/src/hb-ot-glyf-table.hh',
    harfbuzz .. '/src/hb-ot-hdmx-table.hh',
    harfbuzz .. '/src/hb-ot-head-table.hh',
    harfbuzz .. '/src/hb-ot-hhea-table.hh',
    harfbuzz .. '/src/hb-ot-hmtx-table.hh',
    harfbuzz .. '/src/hb-ot-kern-table.hh',
    harfbuzz .. '/src/hb-ot-layout-base-table.hh',
    harfbuzz .. '/src/hb-ot-layout-common.hh',
    harfbuzz .. '/src/hb-ot-layout-gdef-table.hh',
    harfbuzz .. '/src/hb-ot-layout-gpos-table.hh',
    harfbuzz .. '/src/hb-ot-layout-gsub-table.hh',
    harfbuzz .. '/src/hb-ot-layout-gsubgpos.hh',
    harfbuzz .. '/src/hb-ot-layout-jstf-table.hh',
    harfbuzz .. '/src/hb-ot-layout.cc',
    harfbuzz .. '/src/hb-ot-layout.hh',
    harfbuzz .. '/src/hb-ot-map.cc',
    harfbuzz .. '/src/hb-ot-map.hh',
    harfbuzz .. '/src/hb-ot-math-table.hh',
    harfbuzz .. '/src/hb-ot-math.cc',
    harfbuzz .. '/src/hb-ot-maxp-table.hh',
    harfbuzz .. '/src/hb-ot-meta-table.hh',
    harfbuzz .. '/src/hb-ot-meta.cc',
    harfbuzz .. '/src/hb-ot-meta.h',
    harfbuzz .. '/src/hb-ot-metrics.cc',
    harfbuzz .. '/src/hb-ot-metrics.hh',
    harfbuzz .. '/src/hb-ot-name-language-static.hh',
    harfbuzz .. '/src/hb-ot-name-language.hh',
    harfbuzz .. '/src/hb-ot-name-table.hh',
    harfbuzz .. '/src/hb-ot-name.cc',
    harfbuzz .. '/src/hb-ot-name.h',
    harfbuzz .. '/src/hb-ot-os2-table.hh',
    harfbuzz .. '/src/hb-ot-os2-unicode-ranges.hh',
    harfbuzz .. '/src/hb-ot-post-macroman.hh',
    harfbuzz .. '/src/hb-ot-post-table-v2subset.hh',
    harfbuzz .. '/src/hb-ot-post-table.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic-fallback.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic-joining-list.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic-pua.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic-table.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic-win1256.hh',
    harfbuzz .. '/src/hb-ot-shaper-arabic.cc',
    harfbuzz .. '/src/hb-ot-shaper-arabic.hh',
    harfbuzz .. '/src/hb-ot-shaper-default.cc',
    harfbuzz .. '/src/hb-ot-shaper-hangul.cc',
    harfbuzz .. '/src/hb-ot-shaper-hebrew.cc',
    harfbuzz .. '/src/hb-ot-shaper-indic-table.cc',
    harfbuzz .. '/src/hb-ot-shaper-indic.cc',
    harfbuzz .. '/src/hb-ot-shaper-indic.hh',
    harfbuzz .. '/src/hb-ot-shaper-khmer.cc',
    harfbuzz .. '/src/hb-ot-shaper-myanmar.cc',
    harfbuzz .. '/src/hb-ot-shaper-syllabic.cc',
    harfbuzz .. '/src/hb-ot-shaper-syllabic.hh',
    harfbuzz .. '/src/hb-ot-shaper-thai.cc',
    harfbuzz .. '/src/hb-ot-shaper-use-table.hh',
    harfbuzz .. '/src/hb-ot-shaper-use.cc',
    harfbuzz .. '/src/hb-ot-shaper-vowel-constraints.cc',
    harfbuzz .. '/src/hb-ot-shaper-vowel-constraints.hh',
    harfbuzz .. '/src/hb-ot-shaper.hh',
    harfbuzz .. '/src/hb-ot-shaper-indic-machine.hh',
    harfbuzz .. '/src/hb-ot-shaper-khmer-machine.hh',
    harfbuzz .. '/src/hb-ot-shaper-myanmar-machine.hh',
    harfbuzz .. '/src/hb-ot-shaper-use-machine.hh',
    harfbuzz .. '/src/hb-ot-shape-fallback.cc',
    harfbuzz .. '/src/hb-ot-shape-fallback.hh',
    harfbuzz .. '/src/hb-ot-shape-normalize.cc',
    harfbuzz .. '/src/hb-ot-shape-normalize.hh',
    harfbuzz .. '/src/hb-ot-shape.cc',
    harfbuzz .. '/src/hb-ot-shape.hh',
    harfbuzz .. '/src/hb-ot-stat-table.hh',
    harfbuzz .. '/src/hb-ot-tag-table.hh',
    harfbuzz .. '/src/hb-ot-tag.cc',
    harfbuzz .. '/src/hb-ot-var-avar-table.hh',
    harfbuzz .. '/src/hb-ot-var-common.hh',
    harfbuzz .. '/src/hb-ot-var-fvar-table.hh',
    harfbuzz .. '/src/hb-ot-var-gvar-table.hh',
    harfbuzz .. '/src/hb-ot-var-hvar-table.hh',
    harfbuzz .. '/src/hb-ot-var-mvar-table.hh',
    harfbuzz .. '/src/hb-ot-var.cc',
    harfbuzz .. '/src/hb-ot-vorg-table.hh',
    harfbuzz .. '/src/hb-pool.hh',
    harfbuzz .. '/src/hb-priority-queue.hh',
    harfbuzz .. '/src/hb-repacker.hh',
    harfbuzz .. '/src/hb-sanitize.hh',
    harfbuzz .. '/src/hb-serialize.hh',
    harfbuzz .. '/src/hb-set-digest.hh',
    harfbuzz .. '/src/hb-set.cc',
    harfbuzz .. '/src/hb-set.hh',
    harfbuzz .. '/src/hb-shape-plan.cc',
    harfbuzz .. '/src/hb-shape-plan.hh',
    harfbuzz .. '/src/hb-shape.cc',
    harfbuzz .. '/src/hb-shaper-impl.hh',
    harfbuzz .. '/src/hb-shaper-list.hh',
    harfbuzz .. '/src/hb-shaper.cc',
    harfbuzz .. '/src/hb-shaper.hh',
    harfbuzz .. '/src/hb-static.cc',
    harfbuzz .. '/src/hb-string-array.hh',
    harfbuzz .. '/src/hb-subset-cff-common.cc',
    harfbuzz .. '/src/hb-subset-cff-common.hh',
    harfbuzz .. '/src/hb-subset-cff1.cc',
    harfbuzz .. '/src/hb-subset-cff1.hh',
    harfbuzz .. '/src/hb-subset-cff2.cc',
    harfbuzz .. '/src/hb-subset-cff2.hh',
    harfbuzz .. '/src/hb-subset-input.cc',
    harfbuzz .. '/src/hb-subset-input.hh',
    harfbuzz .. '/src/hb-subset-plan.cc',
    harfbuzz .. '/src/hb-subset-plan.hh',
    harfbuzz .. '/src/hb-subset-repacker.cc',
    harfbuzz .. '/src/hb-subset-repacker.h',
    harfbuzz .. '/src/hb-subset.cc',
    harfbuzz .. '/src/hb-subset.hh',
    harfbuzz .. '/src/hb-ucd-table.hh',
    harfbuzz .. '/src/hb-ucd.cc',
    harfbuzz .. '/src/hb-unicode-emoji-table.hh',
    harfbuzz .. '/src/hb-unicode.cc',
    harfbuzz .. '/src/hb-unicode.hh',
    harfbuzz .. '/src/hb-utf.hh',
    harfbuzz .. '/src/hb-vector.hh',
    harfbuzz .. '/src/hb.hh',
    harfbuzz .. '/src/graph/gsubgpos-context.cc',
    harfbuzz .. '/src/hb-paint.cc',
    harfbuzz .. '/src/hb-paint-extents.cc',
    harfbuzz .. '/src/hb-outline.cc',
})

defines({ 'HAVE_OT', 'HB_NO_FALLBACK_SHAPE', 'HB_NO_WIN1256' })
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
    '--no-entry',
})

filter({ 'options:not skia', 'options:not single_file' })
do
    linkoptions({
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/renderer.js',
        '--pre-js ./js/shared.js',
        '-o %{cfg.targetdir}/canvas_advanced.mjs',
    })
end

filter({ 'options:not skia', 'options:single_file' })
do
    linkoptions({
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/renderer.js',
        '--pre-js ./js/shared.js',
        '-o %{cfg.targetdir}/canvas_advanced_single.mjs',
    })
end

filter({ 'options:skia', 'options:single_file' })
do
    linkoptions({ '-o %{cfg.targetdir}/webgl_advanced_single.mjs' })
end

filter({ 'options:skia', 'options:not single_file' })
do
    linkoptions({ '-o %{cfg.targetdir}/webgl_advanced.mjs' })
end

filter('options:skia')
do
    defines({ 'RIVE_SKIA_RENDERER' })
    buildoptions({ '-DSK_GL', '-DSK_SUPPORT_GPU=1' })
    includedirs({
        source .. '/skia/renderer/include',
        source .. '/skia/dependencies/skia_rive_optimized',
        source .. '/skia/dependencies/skia_rive_optimized/include/core',
        source .. '/skia/dependencies/skia_rive_optimized/include/effects',
        source .. '/skia/dependencies/skia_rive_optimized/include/gpu',
        source .. '/skia/dependencies/skia_rive_optimized/include/config',
    })
    files({ source .. '/skia/renderer/src/**.cpp' })
    libdirs({ source .. '/skia/dependencies/skia_rive_optimized/out/wasm/' })
    links({ 'skia', 'GL' })
    linkoptions({
        '-s USE_WEBGL2=1',
        '-s MIN_WEBGL_VERSION=1',
        '-s MAX_WEBGL_VERSION=2',
        '--pre-js ./js/animation_callback_handler.js',
        '--pre-js ./js/max_recent_size.js',
        '--pre-js ./js/skia_renderer.js',
        '--pre-js ./js/shared.js',
    })
end

filter('options:not skia')
do
    includedirs({ './src/skia_imports' })
    files({ './src/skia_imports/**.cpp' })
end

filter('options:single_file')
do
    linkoptions({ '-s SINGLE_FILE=1' })
end

filter('options:not lite')
do
    defines({ 'WITH_RIVE_TEXT', 'WITH_RIVE_AUDIO' })
end

filter('configurations:debug')
do
    files({
        sheenbidi .. '/Source/BidiChain.c',
        sheenbidi .. '/Source/BidiTypeLookup.c',
        sheenbidi .. '/Source/BracketQueue.c',
        sheenbidi .. '/Source/GeneralCategoryLookup.c',
        sheenbidi .. '/Source/IsolatingRun.c',
        sheenbidi .. '/Source/LevelRun.c',
        sheenbidi .. '/Source/PairingLookup.c',
        sheenbidi .. '/Source/RunQueue.c',
        sheenbidi .. '/Source/SBAlgorithm.c',
        sheenbidi .. '/Source/SBBase.c',
        sheenbidi .. '/Source/SBCodepointSequence.c',
        sheenbidi .. '/Source/SBLine.c',
        sheenbidi .. '/Source/SBLog.c',
        sheenbidi .. '/Source/SBMirrorLocator.c',
        sheenbidi .. '/Source/SBParagraph.c',
        sheenbidi .. '/Source/SBScriptLocator.c',
        sheenbidi .. '/Source/ScriptLookup.c',
        sheenbidi .. '/Source/ScriptStack.c',
        sheenbidi .. '/Source/StatusStack.c',
    })
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

filter('configurations:release')
do
    files({ sheenbidi .. '/Source/SheenBidi.c' })
    defines({ 'RELEASE', 'NDEBUG', 'SB_CONFIG_UNITY' })
    optimize('On')
    buildoptions({ '-flto', '-Oz', '-g0' })
    linkoptions({ '-s ASSERTIONS=0', '--closure 1', '-flto', '-Oz', '-g0' })
end

newoption({ trigger = 'skia', description = 'Set when linking with Skia.' })

newoption({
    trigger = 'single_file',
    description = 'Set when the wasm should be packed in with the js code.',
})

newoption({
    trigger = 'lite',
    description = 'Set when building WASM withot major dependencies (i.e. text engine).',
})
