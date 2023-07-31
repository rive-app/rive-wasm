import * as rc from "../src/rive_advanced.mjs.js";
import * as rive from "../src/rive";
import getLongArtboardNameBuffer from "./test-rive-buffers/longArtboardName";
import listenerBuffer from "./test-rive-buffers/listenerFile.js";
import textBuffer from "./test-rive-buffers/textFile.json";

// #region helper functions

/**
 * Convert string to array buffer.
 *
 * @param {Array.<int>} array
 * @returns {ArrayBuffer}
 */
const arrayToArrayBuffer = (array: number[]): ArrayBuffer => {
  const length = array.length;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < length; i++) {
    view[i] = array[i];
  }
  return buffer;
};

const printProperties = (obj: any): void => {
  let propValue;
  for (const propName in obj) {
    propValue = obj[propName];

    console.log(propName, propValue);
  }
};

// #endregion

// #region test data

const corruptRiveFileBytes = [0x43, 0x67, 0xac, 0x00, 0xff, 0x2e];
const corruptRiveFileBuffer = arrayToArrayBuffer(corruptRiveFileBytes);

const pingPongRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8b, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01,
  0x07, 0x00, 0x00, 0xfa, 0x43, 0x08, 0x00, 0x00, 0xfa, 0x43, 0x04, 0x0c, 0x4e,
  0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 0x62, 0x6f, 0x61, 0x72, 0x64, 0x00, 0x03,
  0x05, 0x00, 0x0d, 0x00, 0x00, 0x7a, 0x43, 0x0e, 0x00, 0x00, 0x7a, 0x43, 0x00,
  0x07, 0x05, 0x01, 0x14, 0xea, 0xa3, 0xc7, 0x42, 0x15, 0xea, 0xa3, 0xc7, 0x42,
  0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00,
  0x12, 0x05, 0x05, 0x25, 0x31, 0x31, 0x31, 0xff, 0x00, 0x1f, 0x37, 0x0b, 0x41,
  0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x31, 0x39, 0x0a, 0x3b,
  0x02, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01,
  0x46, 0xe8, 0xa3, 0x47, 0x42, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x83,
  0x0b, 0xe1, 0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x00,
  0x00, 0x7a, 0x43, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7a,
  0x43, 0x00,
];
const pingPongRiveFileBuffer = arrayToArrayBuffer(pingPongRiveFileBytes);

const oneShotRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8b, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01,
  0x07, 0x00, 0x00, 0xfa, 0x43, 0x08, 0x00, 0x00, 0xfa, 0x43, 0x04, 0x0c, 0x4e,
  0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 0x62, 0x6f, 0x61, 0x72, 0x64, 0x00, 0x03,
  0x05, 0x00, 0x0d, 0x00, 0x00, 0x7a, 0x43, 0x0e, 0x00, 0x00, 0x7a, 0x43, 0x00,
  0x07, 0x05, 0x01, 0x14, 0xea, 0xa3, 0xc7, 0x42, 0x15, 0xea, 0xa3, 0xc7, 0x42,
  0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00,
  0x12, 0x05, 0x05, 0x25, 0x31, 0x31, 0x31, 0xff, 0x00, 0x1f, 0x37, 0x0b, 0x41,
  0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x31, 0x39, 0x0a, 0x00,
  0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01, 0x46, 0xe8,
  0xa3, 0x47, 0x42, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x83, 0x0b, 0xe1,
  0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7a,
  0x43, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7a, 0x43, 0x00,
];
const oneShotRiveFileBuffer = arrayToArrayBuffer(oneShotRiveFileBytes);

const loopRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8b, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01,
  0x07, 0x00, 0x00, 0xfa, 0x43, 0x08, 0x00, 0x00, 0xfa, 0x43, 0x04, 0x0c, 0x4e,
  0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 0x62, 0x6f, 0x61, 0x72, 0x64, 0x00, 0x03,
  0x05, 0x00, 0x0d, 0x00, 0x00, 0x7a, 0x43, 0x0e, 0x00, 0x00, 0x7a, 0x43, 0x00,
  0x07, 0x05, 0x01, 0x14, 0xea, 0xa3, 0xc7, 0x42, 0x15, 0xea, 0xa3, 0xc7, 0x42,
  0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00,
  0x12, 0x05, 0x05, 0x25, 0x31, 0x31, 0x31, 0xff, 0x00, 0x1f, 0x37, 0x0b, 0x41,
  0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x31, 0x39, 0x0a, 0x3b,
  0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01,
  0x46, 0xe8, 0xa3, 0x47, 0x42, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x83,
  0x0b, 0xe1, 0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x00,
  0x00, 0x7a, 0x43, 0x00, 0x1e, 0x43, 0x0a, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7a,
  0x43, 0x00,
];
const loopRiveFileBuffer = arrayToArrayBuffer(loopRiveFileBytes);

const stateMachineFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0xe1, 0x20, 0x00, 0x17, 0x00, 0x01, 0x04,
  0x0a, 0x4d, 0x79, 0x41, 0x72, 0x74, 0x62, 0x6f, 0x61, 0x72, 0x64, 0x07, 0x00,
  0x00, 0xfa, 0x43, 0x08, 0x00, 0x00, 0xfa, 0x43, 0x09, 0x00, 0x00, 0xbe, 0xc2,
  0x0a, 0x00, 0x00, 0xd2, 0xc2, 0x00, 0x03, 0x04, 0x0b, 0x4d, 0x79, 0x52, 0x65,
  0x63, 0x74, 0x61, 0x6e, 0x67, 0x6c, 0x65, 0x05, 0x00, 0x0d, 0x78, 0x55, 0x48,
  0x42, 0x0e, 0x78, 0x55, 0x48, 0x42, 0x00, 0x07, 0x04, 0x0f, 0x4d, 0x79, 0x52,
  0x65, 0x63, 0x74, 0x61, 0x6e, 0x67, 0x6c, 0x65, 0x50, 0x61, 0x74, 0x68, 0x05,
  0x01, 0x14, 0x7a, 0x55, 0xc8, 0x42, 0x15, 0x7a, 0x55, 0xc8, 0x42, 0x00, 0x12,
  0x05, 0x05, 0x00, 0x12, 0x05, 0x06, 0x25, 0x31, 0x31, 0x31, 0xff, 0x00, 0x14,
  0x05, 0x01, 0x00, 0x14, 0x04, 0x0a, 0x42, 0x61, 0x63, 0x6b, 0x67, 0x72, 0x6f,
  0x75, 0x6e, 0x64, 0x05, 0x00, 0x00, 0x1f, 0x37, 0x19, 0x57, 0x6f, 0x72, 0x6b,
  0x41, 0x72, 0x65, 0x61, 0x50, 0x69, 0x6e, 0x67, 0x50, 0x6f, 0x6e, 0x67, 0x41,
  0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x3b, 0x02, 0x3c, 0x0f, 0x3d,
  0x2e, 0x3e, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e,
  0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x14, 0x44, 0x01,
  0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51,
  0xf5, 0xe0, 0x43, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0,
  0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a, 0x55, 0x48,
  0x42, 0x00, 0x1e, 0x43, 0x14, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00,
  0x1e, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00, 0x1e, 0x43,
  0x3c, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00, 0x1f, 0x37, 0x18, 0x57,
  0x6f, 0x72, 0x6b, 0x41, 0x72, 0x65, 0x61, 0x4c, 0x6f, 0x6f, 0x70, 0x69, 0x6e,
  0x67, 0x41, 0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x3b, 0x01, 0x3c,
  0x0f, 0x3d, 0x2d, 0x3e, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d,
  0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x14,
  0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x28, 0x44, 0x01,
  0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51,
  0xf5, 0xe0, 0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a,
  0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x14, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0,
  0x43, 0x00, 0x1e, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00,
  0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00, 0x1f, 0x37,
  0x18, 0x57, 0x6f, 0x72, 0x6b, 0x41, 0x72, 0x65, 0x61, 0x4f, 0x6e, 0x65, 0x53,
  0x68, 0x6f, 0x74, 0x41, 0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x3c,
  0x0f, 0x3d, 0x2d, 0x3e, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d,
  0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x14,
  0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x28, 0x44, 0x01,
  0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51,
  0xf5, 0xe0, 0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a,
  0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x14, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0,
  0x43, 0x00, 0x1e, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00,
  0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00, 0x1f, 0x37,
  0x11, 0x50, 0x69, 0x6e, 0x67, 0x50, 0x6f, 0x6e, 0x67, 0x41, 0x6e, 0x69, 0x6d,
  0x61, 0x74, 0x69, 0x6f, 0x6e, 0x3b, 0x02, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a,
  0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e,
  0x43, 0x3c, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00, 0x1a, 0x35, 0x0e,
  0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x3c,
  0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00, 0x1f, 0x37, 0x10, 0x4f, 0x6e,
  0x65, 0x53, 0x68, 0x6f, 0x74, 0x41, 0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f,
  0x6e, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01,
  0x46, 0x7a, 0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51,
  0xf5, 0xe0, 0x43, 0x00, 0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x7a,
  0x55, 0x48, 0x42, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0,
  0x43, 0x00, 0x1f, 0x37, 0x10, 0x4c, 0x6f, 0x6f, 0x70, 0x69, 0x6e, 0x67, 0x41,
  0x6e, 0x69, 0x6d, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x3b, 0x01, 0x00, 0x19, 0x33,
  0x01, 0x00, 0x1a, 0x35, 0x0d, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48,
  0x42, 0x00, 0x1e, 0x43, 0x3c, 0x44, 0x01, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00,
  0x1a, 0x35, 0x0e, 0x00, 0x1e, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00,
  0x1e, 0x43, 0x3c, 0x44, 0x01, 0x45, 0x04, 0x46, 0x51, 0xf5, 0xe0, 0x43, 0x00,
  0x35, 0x37, 0x0c, 0x53, 0x74, 0x61, 0x74, 0x65, 0x4d, 0x61, 0x63, 0x68, 0x69,
  0x6e, 0x65, 0x00, 0x38, 0x8a, 0x01, 0x05, 0x4d, 0x79, 0x4e, 0x75, 0x6d, 0x00,
  0x3b, 0x8a, 0x01, 0x06, 0x4d, 0x79, 0x42, 0x6f, 0x6f, 0x6c, 0x00, 0x3a, 0x8a,
  0x01, 0x06, 0x4d, 0x79, 0x54, 0x72, 0x69, 0x67, 0x00, 0x39, 0x8a, 0x01, 0x07,
  0x4c, 0x61, 0x79, 0x65, 0x72, 0x20, 0x31, 0x00, 0x3e, 0x00, 0x3d, 0x95, 0x01,
  0x05, 0x00, 0x41, 0x97, 0x01, 0x04, 0x00, 0x44, 0x9b, 0x01, 0x02, 0x00, 0x40,
  0x00, 0x3f, 0x00, 0x41, 0x97, 0x01, 0x01, 0x00, 0x3d, 0x95, 0x01, 0x03, 0x00,
  0x41, 0x97, 0x01, 0x02, 0x00, 0x47, 0x9b, 0x01, 0x01, 0x00, 0x01, 0x04, 0x09,
  0x41, 0x72, 0x74, 0x62, 0x6f, 0x61, 0x72, 0x64, 0x32, 0x07, 0x00, 0x80, 0x8c,
  0x43, 0x08, 0x00, 0x80, 0x8c, 0x43, 0x09, 0x00, 0x80, 0xe9, 0xc3, 0x0a, 0x00,
  0x00, 0x5b, 0x43, 0x00, 0x12, 0x05, 0x02, 0x25, 0x31, 0x31, 0x31, 0xff, 0x00,
  0x14, 0x05, 0x00, 0x00, 0x1f, 0x37, 0x0b, 0x41, 0x6e, 0x69, 0x6d, 0x61, 0x74,
  0x69, 0x6f, 0x6e, 0x20, 0x31, 0x00,
];
const stateMachineFileBuffer = arrayToArrayBuffer(stateMachineFileBytes);

// #endregion

// #region setup and teardown

beforeEach(() => {
  // Suppress console.warn and console.error
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {});

// #endregion

// #region layout

test("Layouts can be created with different fits and alignments", (): void => {
  const layout = new rive.Layout({
    fit: rive.Fit.Contain,
    alignment: rive.Alignment.TopRight,
    minX: 1,
    minY: 2,
    maxX: 100,
    maxY: 101,
  });
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test("Layouts can be created with named parameters", (): void => {
  const layout = new rive.Layout({
    minX: 1,
    alignment: rive.Alignment.TopRight,
    minY: 2,
    fit: rive.Fit.Contain,
    maxX: 100,
    maxY: 101,
  });
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test("Layouts have sensible defaults", (): void => {
  const layout = new rive.Layout();
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.Center);
  expect(layout.minX).toBe(0);
  expect(layout.minY).toBe(0);
  expect(layout.maxX).toBe(0);
  expect(layout.maxY).toBe(0);
});

test("Layouts provide runtime fit and alignment values", async () => {
  const runtime: rc.RiveCanvas = await rive.RuntimeLoader.awaitInstance();
  let layout = new rive.Layout({
    fit: rive.Fit.FitWidth,
    alignment: rive.Alignment.BottomLeft,
  });
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fitWidth);
  // Now we use JSAlignment, tests not longer required
  // expect(layout.runtimeAlignment(runtime).x).toBe(-1);
  // expect(layout.runtimeAlignment(runtime).y).toBe(1);

  layout = new rive.Layout({
    fit: rive.Fit.Fill,
    alignment: rive.Alignment.TopRight,
  });
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fill);
  // expect(layout.runtimeAlignment(runtime).x).toBe(1);
  // expect(layout.runtimeAlignment(runtime).y).toBe(-1);
});

test("Layouts can be copied with overridden values", (): void => {
  let layout = new rive.Layout({
    fit: rive.Fit.ScaleDown,
    alignment: rive.Alignment.BottomRight,
    minX: 10,
    minY: 20,
    maxX: 30,
    maxY: 40,
  });

  layout = layout.copyWith({
    alignment: rive.Alignment.CenterLeft,
    minY: 15,
    maxX: 60,
  });

  expect(layout.fit).toBe(rive.Fit.ScaleDown);
  expect(layout.alignment).toBe(rive.Alignment.CenterLeft);
  expect(layout.minX).toBe(10);
  expect(layout.minY).toBe(15);
  expect(layout.maxX).toBe(60);
  expect(layout.maxY).toBe(40);
});

// #endregion

// #region runtime loading

test("Runtime can be loaded using callbacks", async (done) => {
  const callback1: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void => {
    expect(runtime).toBeDefined();
    expect(runtime.Fit.none).toBeDefined();
    expect(runtime.Fit.cover).toBeDefined();
    expect(runtime.Fit.none).not.toBe(runtime.Fit.cover);
  };

  const callback2: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void =>
    expect(runtime).toBeDefined();

  const callback3: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void => {
    expect(runtime).toBeDefined();
    done();
  };

  rive.RuntimeLoader.getInstance(callback1);
  rive.RuntimeLoader.getInstance(callback2);
  // Delay 1 second to let library load
  setTimeout(() => rive.RuntimeLoader.getInstance(callback3), 500);
});

test("Runtime can be loaded using promises", async (done) => {
  const rive1: rc.RiveCanvas = await rive.RuntimeLoader.awaitInstance();
  expect(rive1).toBeDefined();
  expect(rive1.Fit.none).toBeDefined();
  expect(rive1.Fit.cover).toBeDefined();
  expect(rive1.Fit.none).not.toBe(rive1.Fit.cover);

  const rive2 = await rive.RuntimeLoader.awaitInstance();
  expect(rive2).toBeDefined;
  expect(rive2).toBe(rive1);

  setTimeout(async () => {
    const rive3 = await rive.RuntimeLoader.awaitInstance();
    expect(rive3).toBeDefined;
    expect(rive3).toBe(rive2);
    done();
  }, 500);
});

// #endregion

// #region event

test("Events can be subscribed and unsubscribed to and fired", () => {
  const manager = new rive.Testing.EventManager();
  expect(manager).toBeDefined();

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Load,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Load);
      expect(e.data).toBe("fired");
      mockFired();
    },
  };

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(1);

  manager.remove(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(1);

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(2);
});

test("Creating loop event accepts enum and string values", (): void => {
  let loopEvent: rive.LoopEvent = {
    animation: "test animation",
    type: rive.LoopType.PingPong,
  };
  expect(loopEvent.type).toBe("pingpong");

  loopEvent = { animation: "test animation", type: rive.LoopType.OneShot };
  expect(loopEvent.type).toBe("oneshot");
});

// #endregion

// #region task queue

test("Tasks are queued and run when processed", () => {
  const eventManager = new rive.Testing.EventManager();
  const taskManager = new rive.Testing.TaskQueueManager(eventManager);

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Play,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Play);
      expect(e.data).toBe("play");
      mockFired();
    },
  };
  eventManager.add(listener);
  const event: rive.Event = { type: rive.EventType.Play, data: "play" };

  const mockAction: rive.VoidCallback = jest.fn();
  const task: rive.Task = { event: event, action: mockAction };
  taskManager.add(task);

  taskManager.process();
  expect(mockAction).toBeCalledTimes(1);
  expect(mockFired).toBeCalledTimes(1);

  taskManager.add(task);
  taskManager.add(task);
  taskManager.process();
  expect(mockAction).toBeCalledTimes(3);
  expect(mockFired).toBeCalledTimes(3);
});

// #endregion

// #region creating Rive objects

test("Rive objects require a src url or byte buffer", () => {
  const canvas = document.createElement("canvas");
  const badConstructor = () => {
    new rive.Rive({ canvas: canvas });
  };
  expect(badConstructor).toThrow(Error);
});

test("Rive objects initialize correctly", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onLoad: () => {
      expect(r).toBeDefined();
      done();
    },
    onLoadError: () => expect(false).toBeTruthy(),
  });
});

test("Corrupt Rive file cause explosions", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: corruptRiveFileBuffer,
    onLoadError: () => done(),
    onLoad: () => expect(false).toBeTruthy(),
  });
});

// #endregion

// #region artboards

test("Artboards can be fetched by name", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "Artboard2",
    onLoad: () => {
      expect(r).toBeDefined();
      done();
    },
    onLoadError: () => expect(false).toBeTruthy(),
  });
});

test("Artboards can be fetched with a long name", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(getLongArtboardNameBuffer()),
    artboard: "Really Long  Artboard Name with Double Spaces",
    onLoad: () => {
      expect(r).toBeDefined();
      done();
    },
  });
});

test("Rive explodes when given an invalid artboard name", (done) => {
  const canvas = document.createElement("canvas");
  new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "BadArtboard",
    onLoad: () => expect(false).toBeTruthy(),
    onLoadError: () => {
      // We should get here
      done();
    },
  });
});

test("Artboard bounds can be retrieved from a loaded Rive file", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const bounds = r.bounds;
      expect(bounds).toBeDefined();
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxX).toBe(500);
      expect(bounds.maxY).toBe(500);
      done();
    },
  });
});

// #endregion

// #region playbackstates

test("Playback state for new Rive objects is pause", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onLoad: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

test("Playback state for auto-playing new Rive objects is play", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      // We expect things to be stopped right after loading
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      done();
    },
  });
});

// #endregion

// #region Firing events

test("Playing a ping-pong animation will fire a loop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.PingPong);
      done();
    },
  });
});

test("Playing a loop animation will fire a loop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.Loop);
      done();
    },
  });
});

test("Playing a one-shot animation will fire a stop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onStop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test("Stop events are received", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onStop: () => {
      // We expect to receive a stop event when the animation's done
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

test("Advance events are received", (done) => {
  const canvas = document.createElement("canvas");
  let hasAdvancedOnce = false;
  new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onAdvance: (event) => {
      expect(event.type).toBe(rive.EventType.Advance);
      if (hasAdvancedOnce) {
        expect(event.data).toBeGreaterThan(0);
        done();
      }
      if (!hasAdvancedOnce) {
        hasAdvancedOnce = true;
      }
    },
  });
});

test("Events can be unsubscribed from", (done) => {
  const canvas = document.createElement("canvas");

  const stopCallback = (event: rive.Event) =>
    // We should never reach this
    expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onStop: stopCallback,
    onPlay: (event: rive.Event) => {
      // Deregister stop subscription
      r.off(rive.EventType.Stop, stopCallback);
    },
  });
  // Time out after 200 ms
  setTimeout(() => done(), 200);
});

test("Events of a single type can be mass unsubscribed", (done) => {
  const canvas = document.createElement("canvas");

  const loopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) => expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onLoop: loopCallback1,
    onPlay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      // Deregisters all loop subscriptions
      r.removeAllRiveEventListeners(rive.EventType.Loop);
    },
    onStop: (event: rive.Event) => {
      // This should not hgave been removed
      done();
    },
  });

  setTimeout(() => r.stop(), 200);
});

test("All events can be mass unsubscribed", (done) => {
  const canvas = document.createElement("canvas");

  const loopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) => expect(false).toBeTruthy();
  const stopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const stopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onLoop: loopCallback1,
    onPlay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      r.on(rive.EventType.Stop, stopCallback2);
      // Deregisters all loop subscriptions
      r.removeAllRiveEventListeners();
    },
    onStop: stopCallback1,
  });

  setTimeout(() => {
    r.stop();
    done();
  }, 200);
});

// #endregion

// #region playback control

test("Playing animations can be manually started and stopped", (done) => {
  const canvas = document.createElement("canvas");

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => {
      // Initial animation should be ready and paused on load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      // Once it's looped, attempt to stop
      r.stop();
    },
    onStop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test("Playing animations can be manually started, paused, and restarted", (done) => {
  const canvas = document.createElement("canvas");
  let hasLooped = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      hasLooped ? r.stop() : r.pause();
      hasLooped = true;
    },
    onPause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      r.play();
    },
    onStop: (event: rive.Event) => {
      expect(hasLooped).toBeTruthy();
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

// #endregion

// #region loading files

test("Multiple files can be loaded and played", (done) => {
  const canvas = document.createElement("canvas");
  let loopOccurred = false;
  let firstLoadOccurred = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      if (firstLoadOccurred) {
        done();
      } else {
        firstLoadOccurred = true;
      }
    },
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(loopOccurred).toBeFalsy();
      loopOccurred = true;
      // After the first loop, load a new file
      r.load({ buffer: oneShotRiveFileBuffer, autoplay: true });
    },
    onStop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPlaying).toBeFalsy();
      expect(loopOccurred).toBeTruthy();
    },
  });
});

test("Layout is set to canvas dimensions if not specified", (done) => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => {
      expect(r.layout.minX).toBe(0);
      expect(r.layout.minY).toBe(0);
      expect(r.layout.maxX).toBe(400);
      expect(r.layout.maxY).toBe(300);
      done();
    },
  });
});

// #endregion

// #region Rive properties

test("Rive file contents can be read", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const contents = r.contents;
      expect(contents).toBeDefined();
      expect(contents.artboards).toBeDefined();
      expect(contents.artboards).toHaveLength(2);
      expect(contents.artboards[0].name).toBe("MyArtboard");
      expect(contents.artboards[1].name).toBe("Artboard2");
      expect(contents.artboards[0].animations).toBeDefined();
      expect(contents.artboards[0].animations).toHaveLength(6);
      expect(contents.artboards[0].animations[0]).toBe(
        "WorkAreaPingPongAnimation"
      );
      expect(contents.artboards[0].stateMachines).toBeDefined();
      expect(contents.artboards[0].stateMachines).toHaveLength(1);
      expect(contents.artboards[0].stateMachines[0].name).toBe("StateMachine");
      expect(contents.artboards[0].stateMachines[0].inputs).toHaveLength(3);
      expect(contents.artboards[0].stateMachines[0].inputs[0].name).toBe(
        "MyNum"
      );
      expect(contents.artboards[0].stateMachines[0].inputs[0].type).toBe(
        rive.StateMachineInputType.Number
      );
      expect(contents.artboards[0].stateMachines[0].inputs[1].name).toBe(
        "MyBool"
      );
      expect(contents.artboards[0].stateMachines[0].inputs[1].type).toBe(
        rive.StateMachineInputType.Boolean
      );
      expect(contents.artboards[0].stateMachines[0].inputs[2].name).toBe(
        "MyTrig"
      );
      expect(contents.artboards[0].stateMachines[0].inputs[2].type).toBe(
        rive.StateMachineInputType.Trigger
      );
      done();
    },
  });
});

// #endregion

// #region state machine

test("State machine names can be retrieved", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const stateMachineNames = r.stateMachineNames;
      expect(stateMachineNames).toHaveLength(1);
      expect(stateMachineNames[0]).toBe("StateMachine");
      done();
    },
  });
});

test("State machines can be instanced", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause: () => {
      expect(r.pausedStateMachineNames).toHaveLength(1);
      done();
    },
  });
});

test("Instanced state machine inputs can be retrieved", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause: () => {
      let stateMachineInputs = r.stateMachineInputs("BadName");
      expect(stateMachineInputs).toBeUndefined();
      stateMachineInputs = r.stateMachineInputs("StateMachine");
      expect(stateMachineInputs).toHaveLength(3);

      expect(stateMachineInputs[0].type).toBe(
        rive.StateMachineInputType.Number
      );
      expect(stateMachineInputs[0].name).toBe("MyNum");
      expect(stateMachineInputs[0].value).toBe(0);
      stateMachineInputs[0].value = 12;
      expect(stateMachineInputs[0].value).toBe(12);

      expect(stateMachineInputs[1].type).toBe(
        rive.StateMachineInputType.Boolean
      );
      expect(stateMachineInputs[1].name).toBe("MyBool");
      expect(stateMachineInputs[1].value).toBe(false);
      stateMachineInputs[1].value = true;
      expect(stateMachineInputs[1].value).toBe(true);

      expect(stateMachineInputs[2].type).toBe(
        rive.StateMachineInputType.Trigger
      );
      expect(stateMachineInputs[2].name).toBe("MyTrig");
      expect(stateMachineInputs[2].value).toBeUndefined();
      expect(stateMachineInputs[2].fire()).toBeUndefined();

      done();
    },
  });
});

test("Playing state machines can be manually started, paused, and restarted", (done) => {
  const canvas = document.createElement("canvas");
  let hasPaused = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      hasPaused ? done() : r.pause();
    },
    onPause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      hasPaused = true;
      r.play();
    },
  });
});

test("Playing state machines report when states have changed", (done) => {
  const canvas = document.createElement("canvas");
  let state = 0;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay: () => {
      // Expect the correct animation to be playing
      expect(r.playingStateMachineNames).toHaveLength(1);
      expect(r.playingStateMachineNames[0]).toBe("StateMachine");
      // Check the inputs are correct
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);
      expect(inputs).toHaveLength(3);
      expect(inputs[1].name).toBe("MyBool");
      expect(inputs[2].name).toBe("MyTrig");
    },
    onStateChange: ({ type: type, data: stateNames }) => {
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);

      if (state === 0) {
        // console.log(`State: ${(stateNames as string[])[0]}`);
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("LoopingAnimation");

        state++;
        inputs[2].fire();
      } else if (state === 1) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("PingPongAnimation");

        state++;
        inputs[1].value = true;
      } else if (state === 2) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("exit");

        done();
      }
    },
  });
});

test("Advance event is not triggered when state machine is paused", (done) => {
  const canvas = document.createElement("canvas");
  const hasAdvancedMock = jest.fn();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay: () => {
      setTimeout(() => {
        r.pause();
      }, 100);
    },
    onPause: () => {
      const advancedCallbackCount = hasAdvancedMock.mock.calls.length;
      setTimeout(() => {
        // Rive draws one more frame before pausing at the end of a render loop
        expect(hasAdvancedMock.mock.calls.length).toBe(
          advancedCallbackCount + 1
        );
        done();
      }, 50);
    },
    onAdvance: hasAdvancedMock,
  });
});

// #endregion

// #region scrubbing

test("An animation can be played and scrubbed without altering playback state", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const firstAnimation = r.animationNames[0];
      r.play(firstAnimation);
    },
    onPlay: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.5);
      expect(r.isPlaying).toBeTruthy();
      r.pause(firstAnimation);
    },
    onPause: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.8);
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

// #endregion

// #region reseting

test("Artboards can be reset back to their starting state", (done) => {
  const canvas = document.createElement("canvas");

  // Track the nr of loops
  let loopCount = 0;

  // Start up a looping animation
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      // Default artboard should be selected
      expect(r.activeArtboard).toBe("New Artboard");
      // This should only ever happen once
      expect(loopCount).toBe(0);
    },
    onLoop: (event: rive.Event) => {
      if (loopCount == 0) {
        // Reset the animation; animation should continue to play
        r.reset({ autoplay: true });
      } else {
        done();
      }
      loopCount++;
    },
  });
});

// #endregion

// #region remove mouse events

test("Mouse events are removed from canvas when reset", (done) => {
  const canvas = document.createElement("canvas");
  let resetMe = true;

  // Start up a looping animation
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    onStateChange: () => {
      // lets make sure we're moving so we got things registered
      if (resetMe) {
        resetMe = false;
        r.reset({
          artboard: "MyArtboard",
          stateMachines: "StateMachine",
          autoplay: true,
        });
      }
      if (!resetMe) {
        try {
          // This will fake a mouse event, and trigger their event handlers
          // If those are illegal, we'll crash
          canvas.dispatchEvent(new Event("mousedown"));
        } catch (err) {
          done(err);
        }
        done();
      }
    },
  });
});

test("Canvas has listener events attached on a Rive file with Rive Listeners", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    onStateChange: () => {
      expect(listenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas does not have listener events if shouldDisableRiveListeners is true", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    shouldDisableRiveListeners: true,
    onStateChange: () => {
      expect(listenerSpy).not.toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas has listeners attached once play() is invoked with a state machine", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const stateMachineName = "State Machine 1";
  const r = new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onLoad: () => {
      // onLoad called first
      expect(listenerSpy).not.toHaveBeenCalled();
      r.play(stateMachineName);
    },
    onStateChange: () => {
      // onStateChange invoked after play() is called
      expect(listenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas has listeners detache once stop() is invoked with a state machine", (done) => {
  const canvasEl = document.createElement("canvas");
  const addEventListenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const removeEventListenerSpy = jest.spyOn(canvasEl, "removeEventListener");
  const stateMachineName = "State Machine 1";
  const r = new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onLoad: () => {
      // onLoad called first
      expect(addEventListenerSpy).not.toHaveBeenCalled();
      expect(removeEventListenerSpy).not.toHaveBeenCalled();
      r.play(stateMachineName);
    },
    onStateChange: () => {
      // onStateChange invoked after play() is called
      expect(addEventListenerSpy).toHaveBeenCalled();
      r.stop(stateMachineName);
      expect(removeEventListenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

// #endregion

test("Statemachines have pointer events", (done) => {
  rive.RuntimeLoader.awaitInstance().then(async (runtime) => {
    const file = await runtime.load(new Uint8Array(stateMachineFileBuffer));
    const ab = file.artboardByIndex(0);
    const sm = ab.stateMachineByIndex(0);
    const smi = new runtime.StateMachineInstance(sm, ab);

    smi.pointerDown(0, 0);
    smi.pointerMove(0, 0);
    smi.pointerUp(0, 0);

    smi.delete();
    ab.delete();
    //  file.delete();  // todo: need to expose delete() on file
    done();
  });
});

// #region cleanup

test("Rive deletes instances on the cleanup", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
    onLoad: () => {
      expect(r.activeArtboard).toBe("MyArtboard");
      r.cleanup();
      expect(r.activeArtboard).toBe("");
      done();
    },
  });
});

test("Rive doesn't error out when cleaning up if the file is not set yet", () => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  r.cleanup();
});

// #endregion

// #region text
test("Rive returns undefined if not provided the name of a text run", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
    onLoad: () => {
      const run = r.getTextRunValue("");
      expect(run).toBeUndefined();
      done();
    },
  });
});

test("Rive returns undefined if Artboard isn't set up yet", () => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.getTextRunValue("Foo")).toBeUndefined();
});

test("Rive returns undefined if Artboard does not have specified text run", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
    onLoad: () => {
      const run = r.getTextRunValue("foofoo");
      expect(run).toBeUndefined();
      done();
    },
  });
});

test("Rive returns a text run", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
    onLoad: () => {
      const textValue = r.getTextRunValue("MyRun");
      expect(textValue).toBe("text");
      done();
    },
  });
});

test("Rive sets a text run value", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
    onLoad: () => {
      r.setTextRunValue("MyRun", "test-text");
      expect(r.getTextRunValue("MyRun")).toBe("test-text");
      done();
    },
  });
});

// #endregion
