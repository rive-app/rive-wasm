import fs from "fs";
import path from "path";
import * as rive from "../src/rive";

// The runtime sits beside us in our monorepo and in a submodule in rive-wasm.
const runtimeDir = [
  path.join(__dirname, "../../../runtime"),
  path.join(__dirname, "../../wasm/submodules/rive-runtime"),
].find((dir) => fs.existsSync(dir))!;

export const readFixture = (file: string): ArrayBuffer => {
  const bytes = fs.readFileSync(file);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
};

/** Reads a file from the C++ runtime's checkout, by path from its root. */
export const runtimeFixture = (relativePath: string): ArrayBuffer =>
  readFixture(path.join(runtimeDir, relativePath));

export const webScriptingFixture = (name: string): ArrayBuffer =>
  readFixture(path.join(runtimeDir, "tests/web_scripting/fixture", name));

/**
 * Convert string to array buffer.
 *
 * @param {Array.<int>} array
 * @returns {ArrayBuffer}
 */
export const arrayToArrayBuffer = (array: number[]): ArrayBuffer => {
    const length = array.length;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < length; i++) {
      view[i] = array[i];
    }
    return buffer;
  };
  
  export const printProperties = (obj: any): void => {
    let propValue;
    for (const propName in obj) {
      propValue = obj[propName];
  
      console.log(propName, propValue);
    }
  };

export const loadFile = (filePath: string): ArrayBuffer => {
  return fs.readFileSync(path.join(__dirname, filePath));
}

/**
 * Polls until the predicate returns a truthy value and resolves with it.
 * Rejects after the timeout, so a test fails instead of hanging.
 */
export async function waitForPredicate<T>(
  predicate: () => T | null | undefined | false,
  timeoutMs = 4000,
  intervalMs = 25,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Timed out waiting for condition");
}

/** Resolves after `count` animation frames. */
export const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      if (--remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

/**
 * Creates a Rive instance and resolves once it has loaded, so tests can
 * assert in the test body. Event callbacks run inside the render loop, where a
 * failed expect doesn't fail the test.
 */
export const loadRive = (params: rive.RiveParameters): Promise<rive.Rive> =>
  new Promise((resolve, reject) => {
    const r: rive.Rive = new rive.Rive({
      ...params,
      onLoad: (event) => {
        params.onLoad?.(event);
        resolve(r);
      },
      onLoadError: (event) => {
        params.onLoadError?.(event);
        reject(new Error(`Rive failed to load: ${event.data}`));
      },
    });
  });
  