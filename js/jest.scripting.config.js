// Runs test/scripting against the wasm scripting tools build, which only
// exists in the monorepo:
//   cd ../wasm && OUT_DIR=build/canvas_scripting_single/bin/release \
//       ./build_wasm.sh -s -w -t release
const base = require("./jest.config.js");

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "rive_advanced.mjs":
      "<rootDir>/../wasm/build/canvas_scripting_single/bin/release/canvas_advanced_single.mjs",
  },
  testMatch: ["<rootDir>/test/scripting/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: [...base.setupFiles, "./test/scripting/setup.ts"],
};
