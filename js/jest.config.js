// Runs the suite on one wasm build, loading its real .wasm file (see
// test/env/wasmFromDisk.js). The default is the SIMD canvas build, the wasm
// most @rive-app/canvas users download; it needs `./build.sh` or
// `./build.sh -r canvas`. Pick another build with RIVE_BUILD:
//   RIVE_BUILD=lite command npx jest
// `npm run test:matrix` runs the other builds, one jest process each. Tests
// read the build from test/buildFeatures.ts.
const BUILDS = {
  canvas: { dir: "canvas_advanced", mjs: "canvas_advanced.mjs", wasm: "rive.wasm" },
  lite: { dir: "canvas_advanced_lite", mjs: "canvas_advanced.mjs", wasm: "rive.wasm" },
  // Non-SIMD fallback of the canvas build. It compiles from the same C++ as
  // the SIMD build, so only the contract test runs: it checks the fallback
  // .wasm matches the .mjs glue it ships with.
  canvas_fallback: {
    dir: "canvas_advanced",
    mjs: "canvas_advanced.mjs",
    wasm: "rive_fallback.wasm",
    testMatch: ["<rootDir>/test/apiContract.test.ts"],
  },
  // jsdom has no WebGL2, so only tests that never make a renderer run here.
  webgl2: {
    dir: "webgl2_advanced",
    mjs: "webgl2_advanced.mjs",
    wasm: "rive.wasm",
    testMatch: ["<rootDir>/test/apiContract.test.ts"],
  },
};

const build = process.env.RIVE_BUILD || "canvas";
const { dir, mjs, wasm, testMatch } = BUILDS[build] ?? {};
if (!dir) throw new Error(`Unknown RIVE_BUILD: ${build}`);

module.exports = {
  // Needed for handling ES6 modules
  "transform": {
    "^.+\\.m?[t|j]sx?$": "babel-jest",
  },
  "moduleNameMapper": {
    "rive_advanced.mjs": "<rootDir>/test/env/wasmFromDisk.js",
    "rive_build_real": `<rootDir>/npm/${dir}/${mjs}`,
    "package.json": `<rootDir>/npm/${dir}/package.json`,
    "rive_threads.mjs": "<rootDir>/test/no_threads.js",
  },
  "globals": {
    "__RIVE_BUILD__": build,
    "__RIVE_WASM_PATH__": `${__dirname}/npm/${dir}/${wasm}`,
  },
  "transformIgnorePatterns": [
    // Needed to handle ES6 rive-canvas module
    "/node_modules/(?!rive-canvas).+\\.m?js$",
  ],
  "testEnvironment": "jsdom",
  // Needs its own build, see jest.scripting.config.js.
  "testPathIgnorePatterns": ["/node_modules/", "<rootDir>/test/scripting/"],
  ...(testMatch && { testMatch }),
  // Fails early with a build hint when the build's .wasm is missing.
  globalSetup: "./test/env/checkBuild.js",
  setupFiles: ["jest-canvas-mock", "./test/setup.ts"],
};
