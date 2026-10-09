import fs from "fs";
import path from "path";

// The runtime sits beside us in our monorepo and in a submodule in rive-wasm.
const runtimeDir = [
  path.join(__dirname, "../../../runtime"),
  path.join(__dirname, "../../wasm/submodules/rive-runtime"),
].find((dir) => fs.existsSync(dir))!;

export const webScriptingFixture = (name: string): ArrayBuffer => {
  const bytes = fs.readFileSync(
    path.join(runtimeDir, "tests/web_scripting/fixture", name),
  );
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
};

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
  