// Jest globalSetup: names the build to run when the selected build's .wasm
// is missing, instead of every test file failing to resolve it.
const fs = require("fs");
const path = require("path");

module.exports = (_globalConfig, projectConfig) => {
  const wasmPath = projectConfig.globals.__RIVE_WASM_PATH__;
  if (!fs.existsSync(wasmPath)) {
    throw new Error(
      `${path.relative(projectConfig.rootDir, wasmPath)} is missing. Run ` +
        `./build.sh, or ./build.sh -r canvas for the default build.`,
    );
  }
};
