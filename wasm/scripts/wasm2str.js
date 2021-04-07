const fs = require('fs');

/**
 * Converts an ArrayBuffer to a hex string
 * @param {ArrayBuffer} buffer 
 * @returns 
 */
const bufferToHex = (buffer) => 
  Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');

/**
 * Creates js code wrapping a string
 * @param {string} hexStr the hex string to embed into js code
 * @returns {string} js code wrapping the hex string
 */
const hexToJs = (hexStr) =>
  `const wasm = '${hexStr}';`;

// Get the args
if (process.argv.length !== 4) {
  console.warn('Expected wasm file and output file as args');
  process.exit(1);
}
const [wasmFilePath, outputFilePath] = process.argv.slice(2);
// console.log(`Reading Wasm ${wasmFilePath} and outputing js to ${outputFilePath}`);

const data = fs.readFileSync(wasmFilePath);
const hexStr = bufferToHex(data.buffer);
fs.writeFileSync(outputFilePath, hexToJs(hexStr));


