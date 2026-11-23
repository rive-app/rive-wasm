// Wraps a build with an external .wasm file so it loads under jsdom, which
// can't fetch it. jest.config.js maps "rive_advanced.mjs" here and
// "rive_build_real" to the build's .mjs. The wasm bytes come from disk via
// emscripten's wasmBinary option.
import Real from "rive_build_real";

const fs = require("fs");

export default function RiveFromDisk(moduleArg = {}) {
  return Real({
    ...moduleArg,
    wasmBinary:
      moduleArg.wasmBinary ?? fs.readFileSync(globalThis.__RIVE_WASM_PATH__),
  });
}
