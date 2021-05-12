import { RiveCanvas } from 'rive-canvas';
import * as rive from './rive';

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
}

const printProperties = (obj: any): void => {
  let propValue;
  for (let propName in obj) {
    propValue = obj[propName]

    console.log(propName, propValue);
  }
}

// #endregion

// #region test data

const corruptRiveFileBytes = [0x43, 0x67, 0xAC, 0x00, 0xFF, 0x2E];
const corruptRiveFileBuffer = arrayToArrayBuffer(corruptRiveFileBytes);

const pingPongRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00,
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74,
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00,
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7,
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05,
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74,
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x3B, 0x02, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35,
  0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01,
  0x46, 0x83, 0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00,
  0x7A, 0x43, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const pingPongRiveFileBuffer = arrayToArrayBuffer(pingPongRiveFileBytes);

const oneShotRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00,
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74,
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00,
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7,
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05,
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74,
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 0x0D, 0x00,
  0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x83,
  0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43,
  0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const oneShotRiveFileBuffer = arrayToArrayBuffer(oneShotRiveFileBytes);

const loopRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00,
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74,
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00,
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7,
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05,
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74,
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x3B, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35,
  0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01,
  0x46, 0x83, 0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00,
  0x7A, 0x43, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const loopRiveFileBuffer = arrayToArrayBuffer(loopRiveFileBytes);

const stateMachineFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0xE1, 0x20, 0x00, 0x17, 0x00, 0x01, 0x04, 0x0A, 0x4D, 0x79, 
  0x41, 0x72, 0x74, 0x62, 0x6F, 0x61, 0x72, 0x64, 0x07, 0x00, 0x00, 0xFA, 0x43, 0x08, 0x00, 0x00, 
  0xFA, 0x43, 0x09, 0x00, 0x00, 0xBE, 0xC2, 0x0A, 0x00, 0x00, 0xD2, 0xC2, 0x00, 0x03, 0x04, 0x0B, 
  0x4D, 0x79, 0x52, 0x65, 0x63, 0x74, 0x61, 0x6E, 0x67, 0x6C, 0x65, 0x05, 0x00, 0x0D, 0x78, 0x55, 
  0x48, 0x42, 0x0E, 0x78, 0x55, 0x48, 0x42, 0x00, 0x07, 0x04, 0x0F, 0x4D, 0x79, 0x52, 0x65, 0x63, 
  0x74, 0x61, 0x6E, 0x67, 0x6C, 0x65, 0x50, 0x61, 0x74, 0x68, 0x05, 0x01, 0x14, 0x7A, 0x55, 0xC8, 
  0x42, 0x15, 0x7A, 0x55, 0xC8, 0x42, 0x00, 0x12, 0x05, 0x05, 0x00, 0x12, 0x05, 0x06, 0x25, 0x31, 
  0x31, 0x31, 0xFF, 0x00, 0x14, 0x05, 0x01, 0x00, 0x14, 0x04, 0x0A, 0x42, 0x61, 0x63, 0x6B, 0x67, 
  0x72, 0x6F, 0x75, 0x6E, 0x64, 0x05, 0x00, 0x00, 0x1F, 0x37, 0x19, 0x57, 0x6F, 0x72, 0x6B, 0x41, 
  0x72, 0x65, 0x61, 0x50, 0x69, 0x6E, 0x67, 0x50, 0x6F, 0x6E, 0x67, 0x41, 0x6E, 0x69, 0x6D, 0x61, 
  0x74, 0x69, 0x6F, 0x6E, 0x3B, 0x02, 0x3C, 0x0F, 0x3D, 0x2E, 0x3E, 0x01, 0x00, 0x19, 0x33, 0x01, 
  0x00, 0x1A, 0x35, 0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 
  0x14, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 
  0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1A, 
  0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x14, 0x44, 
  0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 
  0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00, 0x1F, 0x37, 0x18, 
  0x57, 0x6F, 0x72, 0x6B, 0x41, 0x72, 0x65, 0x61, 0x4C, 0x6F, 0x6F, 0x70, 0x69, 0x6E, 0x67, 0x41, 
  0x6E, 0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 0x6E, 0x3B, 0x01, 0x3C, 0x0F, 0x3D, 0x2D, 0x3E, 0x01, 
  0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 
  0x42, 0x00, 0x1E, 0x43, 0x14, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x28, 
  0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x51, 0xF5, 
  0xE0, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 
  0x1E, 0x43, 0x14, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x28, 0x44, 0x01, 
  0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 
  0x00, 0x1F, 0x37, 0x18, 0x57, 0x6F, 0x72, 0x6B, 0x41, 0x72, 0x65, 0x61, 0x4F, 0x6E, 0x65, 0x53, 
  0x68, 0x6F, 0x74, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 0x6E, 0x3C, 0x0F, 0x3D, 0x2D, 
  0x3E, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 
  0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x14, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 
  0x43, 0x28, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 
  0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 
  0x42, 0x00, 0x1E, 0x43, 0x14, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x28, 
  0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x78, 0x55, 
  0x48, 0x42, 0x00, 0x1F, 0x37, 0x11, 0x50, 0x69, 0x6E, 0x67, 0x50, 0x6F, 0x6E, 0x67, 0x41, 0x6E, 
  0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 0x6E, 0x3B, 0x02, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 
  0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 
  0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 
  0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1F, 0x37, 
  0x10, 0x4F, 0x6E, 0x65, 0x53, 0x68, 0x6F, 0x74, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 
  0x6E, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 
  0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1A, 0x35, 
  0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x7A, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 
  0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1F, 0x37, 0x10, 0x4C, 0x6F, 0x6F, 0x70, 0x69, 0x6E, 0x67, 
  0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 0x6E, 0x3B, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 
  0x1A, 0x35, 0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x78, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 
  0x44, 0x01, 0x46, 0x51, 0xF5, 0xE0, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 
  0x78, 0x55, 0x48, 0x42, 0x00, 0x1E, 0x43, 0x3C, 0x44, 0x01, 0x45, 0x04, 0x46, 0x51, 0xF5, 0xE0, 
  0x43, 0x00, 0x35, 0x37, 0x0C, 0x53, 0x74, 0x61, 0x74, 0x65, 0x4D, 0x61, 0x63, 0x68, 0x69, 0x6E, 
  0x65, 0x00, 0x38, 0x8A, 0x01, 0x05, 0x4D, 0x79, 0x4E, 0x75, 0x6D, 0x00, 0x3B, 0x8A, 0x01, 0x06, 
  0x4D, 0x79, 0x42, 0x6F, 0x6F, 0x6C, 0x00, 0x3A, 0x8A, 0x01, 0x06, 0x4D, 0x79, 0x54, 0x72, 0x69, 
  0x67, 0x00, 0x39, 0x8A, 0x01, 0x07, 0x4C, 0x61, 0x79, 0x65, 0x72, 0x20, 0x31, 0x00, 0x3E, 0x00, 
  0x3D, 0x95, 0x01, 0x05, 0x00, 0x41, 0x97, 0x01, 0x04, 0x00, 0x44, 0x9B, 0x01, 0x02, 0x00, 0x40, 
  0x00, 0x3F, 0x00, 0x41, 0x97, 0x01, 0x01, 0x00, 0x3D, 0x95, 0x01, 0x03, 0x00, 0x41, 0x97, 0x01, 
  0x02, 0x00, 0x47, 0x9B, 0x01, 0x01, 0x00, 0x01, 0x04, 0x09, 0x41, 0x72, 0x74, 0x62, 0x6F, 0x61, 
  0x72, 0x64, 0x32, 0x07, 0x00, 0x80, 0x8C, 0x43, 0x08, 0x00, 0x80, 0x8C, 0x43, 0x09, 0x00, 0x80, 
  0xE9, 0xC3, 0x0A, 0x00, 0x00, 0x5B, 0x43, 0x00, 0x12, 0x05, 0x02, 0x25, 0x31, 0x31, 0x31, 0xFF, 
  0x00, 0x14, 0x05, 0x00, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 0x69, 0x6F, 
  0x6E, 0x20, 0x31, 0x00
];
const stateMachineFileBuffer = arrayToArrayBuffer(stateMachineFileBytes);

// #endregion

// #region setup and teardown

beforeEach(() => {
  // Suppress console.warn and console.error
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  rive.RuntimeLoader.setTestMode(true);
});

afterEach(() => { });

// #endregion

// #region layout

test('Layouts can be created with different fits and alignments', (): void => {
  let layout = new rive.Layout({
    fit: rive.Fit.Contain, alignment: rive.Alignment.TopRight,
    minX: 1, minY: 2, maxX: 100, maxY: 101
  });
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test('Layouts can be created with named parameters', (): void => {
  let layout = new rive.Layout({
    minX: 1, alignment: rive.Alignment.TopRight,
    minY: 2, fit: rive.Fit.Contain, maxX: 100, maxY: 101
  });
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test('Layouts have sensible defaults', (): void => {
  let layout = new rive.Layout();
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.Center);
  expect(layout.minX).toBe(0);
  expect(layout.minY).toBe(0);
  expect(layout.maxX).toBe(0);
  expect(layout.maxY).toBe(0);
});

test('Layouts provide runtime fit and alignment values', async () => {
  const runtime: RiveCanvas = await rive.RuntimeLoader.awaitInstance();
  let layout = new rive.Layout({ fit: rive.Fit.FitWidth, alignment: rive.Alignment.BottomLeft });
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fitWidth);
  expect(layout.runtimeAlignment(runtime).x).toBe(-1);
  expect(layout.runtimeAlignment(runtime).y).toBe(1);

  layout = new rive.Layout({ fit: rive.Fit.Fill, alignment: rive.Alignment.TopRight });
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fill);
  expect(layout.runtimeAlignment(runtime).x).toBe(1);
  expect(layout.runtimeAlignment(runtime).y).toBe(-1);
});

test('Layouts can be copied with overridden values', (): void => {
  let layout = new rive.Layout({
    fit: rive.Fit.ScaleDown,
    alignment: rive.Alignment.BottomRight,
    minX: 10,
    minY: 20,
    maxX: 30,
    maxY: 40
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

test('Runtime can be loaded using callbacks', async done => {

  let callback1: rive.RuntimeCallback = (runtime: RiveCanvas): void => {
    expect(runtime).toBeDefined();
    expect(runtime.Fit.none).toBeDefined();
    expect(runtime.Fit.cover).toBeDefined();
    expect(runtime.Fit.none).not.toBe(runtime.Fit.cover);
  };

  let callback2: rive.RuntimeCallback = (runtime: RiveCanvas): void =>
    expect(runtime).toBeDefined();

  let callback3: rive.RuntimeCallback = (runtime: RiveCanvas): void => {
    expect(runtime).toBeDefined();
    done();
  };

  rive.RuntimeLoader.getInstance(callback1);
  rive.RuntimeLoader.getInstance(callback2);
  // Delay 1 second to let library load
  setTimeout(() => rive.RuntimeLoader.getInstance(callback3), 500);
});

test('Runtime can be loaded using promises', async done => {
  let rive1: RiveCanvas = await rive.RuntimeLoader.awaitInstance();
  expect(rive1).toBeDefined();
  expect(rive1.Fit.none).toBeDefined();
  expect(rive1.Fit.cover).toBeDefined();
  expect(rive1.Fit.none).not.toBe(rive1.Fit.cover);

  let rive2 = await rive.RuntimeLoader.awaitInstance();
  expect(rive2).toBeDefined;
  expect(rive2).toBe(rive1);

  setTimeout(async () => {
    let rive3 = await rive.RuntimeLoader.awaitInstance();
    expect(rive3).toBeDefined;
    expect(rive3).toBe(rive2);
    done();
  }, 500);
});

// #endregion 

// #region event

test('Events can be subscribed and unsubscribed to and fired', () => {
  const manager = new rive.Testing.EventManager();
  expect(manager).toBeDefined();

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Load,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Load);
      expect(e.data).toBe('fired');
      mockFired();
    }
  };

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: 'fired' });
  expect(mockFired).toBeCalledTimes(1);

  manager.remove(listener);
  manager.fire({ type: rive.EventType.Load, data: 'fired' });
  expect(mockFired).toBeCalledTimes(1);

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: 'fired' });
  expect(mockFired).toBeCalledTimes(2);
});

test('Creating loop event accepts enum and string values', (): void => {
  let loopEvent: rive.LoopEvent = { animation: 'test animation', type: rive.LoopType.PingPong };
  expect(loopEvent.type).toBe('pingpong');

  loopEvent = { animation: 'test animation', type: rive.LoopType.OneShot };
  expect(loopEvent.type).toBe('oneshot');
});

// #endregion

// #region task queue

test('Tasks are queued and run when processed', () => {
  const eventManager = new rive.Testing.EventManager();
  const taskManager = new rive.Testing.TaskQueueManager(eventManager);

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Play,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Play);
      expect(e.data).toBe('play');
      mockFired();
    }
  };
  eventManager.add(listener);
  const event: rive.Event = { type: rive.EventType.Play, data: 'play' };

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

test('Rive objects require a src url or byte buffer', () => {
  const canvas = document.createElement('canvas');
  const badConstructor = () => {
    new rive.Rive({ canvas: canvas });
  };
  expect(badConstructor).toThrow(Error);
});

test('Rive objects initialize correctly', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onload: () => {
      expect(r).toBeDefined();
      done();
    },
    onloaderror: () => expect(false).toBeTruthy(),
  });
});

test('Corrupt Rive file cause explosions', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: corruptRiveFileBuffer,
    onloaderror: () => done(),
    onload: () => expect(false).toBeTruthy()
  });
});

// #endregion

// #region artboards

test('Artboards can be fetched by name', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: 'Artboard2',
    onload: () => {
      expect(r).toBeDefined();
      done();
    },
    onloaderror: () => expect(false).toBeTruthy(),
  });
});

test('Rive explodes when given an invalid artboard name', done => {
  const canvas = document.createElement('canvas');
  new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: 'BadArtboard',
    onload: () => expect(false).toBeTruthy(),
    onloaderror: () => {
      // We should get here
      done();
    },
  });
});

test('Artboard bounds can be retrieved from a loaded Rive file', done =>{
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    artboard: 'MyArtboard',
    buffer: stateMachineFileBuffer,
    onload: () => {
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

test('Playback state for new Rive objects is pause', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onload: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      expect(r.isPlaying).toBeFalsy();
      done();
    }
  });
});

test('Playback state for auto-playing new Rive objects is play', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onload: () => {
      // We expect things to be stopped right after loading
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      done();
    }
  });
});

// #endregion

// #region Firing events

test('Playing a ping-pong animation will fire a loop event', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.PingPong);
      done();
    },
  });
});

test('Playing a loop animation will fire a loop event', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.Loop);
      done();
    },
  });
});

test('Playing a one-shot animation will fire a stop event', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onstop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test('Stop events are received', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onstop: () => {
      // We expect to receive a stop event when the animation's done
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();done();
    },
  });
});

test('Events can be unsubscribed from', done => {
  const canvas = document.createElement('canvas');

  const stopCallback = (event: rive.Event) =>
    // We should never reach this
    expect(false).toBeTruthy();
  

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onstop: stopCallback,
    onplay: (event: rive.Event) => {
      // Deregister stop subscription
      r.unsubscribe(rive.EventType.Stop, stopCallback);
    },
  });
  // Time out after 200 ms
  setTimeout(() => done(), 200);
});

test('Events of a single type can be mass unsubscribed', done => {
  const canvas = document.createElement('canvas');

  const loopCallback1 = (event: rive.Event) =>
    expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) =>
    expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) =>
    expect(false).toBeTruthy();


  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onloop: loopCallback1,
    onplay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      // Deregisters all loop subscriptions
      r.unsubscribeAll(rive.EventType.Loop);
    },
    onstop: (event: rive.Event) => {
      // This should not hgave been removed
      done();
    }
  });

  setTimeout(() => r.stop(), 200);
});

test('All events can be mass unsubscribed', done => {
  const canvas = document.createElement('canvas');

  const loopCallback1 = (event: rive.Event) =>
    expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) =>
    expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) =>
    expect(false).toBeTruthy();
    const stopCallback1 = (event: rive.Event) =>
    expect(false).toBeTruthy();
  const stopCallback2 = (event: rive.Event) =>
    expect(false).toBeTruthy();


  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onloop: loopCallback1,
    onplay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      r.on(rive.EventType.Stop, stopCallback2);
      // Deregisters all loop subscriptions
      r.unsubscribeAll();
    },
    onstop:stopCallback1,
  });

  setTimeout(() => {
    r.stop();
    done();
  }, 200);
});

// #endregion

// #region playback control

test('Playing animations can be manually started and stopped', done => {
  const canvas = document.createElement('canvas');

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onload: () => {
      // Initial animation should be ready and paused on load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onplay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      // Once it's looped, attempt to stop
      r.stop();
    },
    onstop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test('Playing animations can be manually started, paused, and restarted', done => {
  const canvas = document.createElement('canvas');
  let hasLooped = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onload: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onplay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      hasLooped ? r.stop() : r.pause();
      hasLooped = true;
    },
    onpause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      r.play();
    },
    onstop: (event: rive.Event) => {
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

test('Multiple files can be loaded and played', done => {
  const canvas = document.createElement('canvas');
  let loopOccurred = false;
  let firstLoadOccurred = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onload: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      if (firstLoadOccurred) {
        done();
      } else {
        firstLoadOccurred = true;
      }
    },
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(loopOccurred).toBeFalsy();
      loopOccurred = true;
      // After the first loop, load a new file
      r.load({ buffer: oneShotRiveFileBuffer, autoplay: true });
    },
    onstop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPlaying).toBeFalsy();
      expect(loopOccurred).toBeTruthy();
    },
  });
});

test('Layout is set to canvas dimensions if not specified', done => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onload: () => {
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

test('Rive file contents can be read', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onload: () => {
      const contents = r.contents;
      expect(contents).toBeDefined();
      expect(contents.artboards).toBeDefined();
      expect(contents.artboards).toHaveLength(2);
      expect(contents.artboards[0].name).toBe('MyArtboard');
      expect(contents.artboards[1].name).toBe('Artboard2');
      expect(contents.artboards[0].animations).toBeDefined();
      expect(contents.artboards[0].animations).toHaveLength(6);
      expect(contents.artboards[0].animations[0]).toBe('WorkAreaPingPongAnimation');
      expect(contents.artboards[0].stateMachines).toBeDefined();
      expect(contents.artboards[0].stateMachines).toHaveLength(1);
      expect(contents.artboards[0].stateMachines[0].name).toBe('StateMachine');
      expect(contents.artboards[0].stateMachines[0].inputs).toHaveLength(3);
      expect(contents.artboards[0].stateMachines[0].inputs[0].name).toBe('MyNum');
      expect(contents.artboards[0].stateMachines[0].inputs[0].type).toBe(rive.StateMachineInputType.Number);
      expect(contents.artboards[0].stateMachines[0].inputs[1].name).toBe('MyBool');
      expect(contents.artboards[0].stateMachines[0].inputs[1].type).toBe(rive.StateMachineInputType.Boolean);
      expect(contents.artboards[0].stateMachines[0].inputs[2].name).toBe('MyTrig');
      expect(contents.artboards[0].stateMachines[0].inputs[2].type).toBe(rive.StateMachineInputType.Trigger);
      done();
    }
  });
});

// #endregion

// #region state machine

test('State machine names can be retrieved', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onload: () => {
      const stateMachineNames = r.stateMachineNames;
      expect(stateMachineNames).toHaveLength(1);
      expect(stateMachineNames[0]).toBe('StateMachine');
      done();
    }
  });
});

test('State machines can be instanced', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: 'StateMachine',
    onpause: () => {
      expect(r.pausedStateMachineNames).toHaveLength(1);
      done();
    }
  });
});

test('Instanced state machine inputs can be retrieved', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: 'StateMachine',
    onpause: () => {
      let stateMachineInputs = r.stateMachineInputs('BadName');
      expect(stateMachineInputs).toBeUndefined();
      stateMachineInputs = r.stateMachineInputs('StateMachine');
      expect(stateMachineInputs).toHaveLength(3);

      expect(stateMachineInputs[0].type).toBe(rive.StateMachineInputType.Number);
      expect(stateMachineInputs[0].name).toBe('MyNum');
      expect(stateMachineInputs[0].value).toBe(0);
      stateMachineInputs[0].value = 12;
      expect(stateMachineInputs[0].value).toBe(12);

      expect(stateMachineInputs[1].type).toBe(rive.StateMachineInputType.Boolean);
      expect(stateMachineInputs[1].name).toBe('MyBool');
      expect(stateMachineInputs[1].value).toBe(false);
      stateMachineInputs[1].value = true;
      expect(stateMachineInputs[1].value).toBe(true);

      expect(stateMachineInputs[2].type).toBe(rive.StateMachineInputType.Trigger);
      expect(stateMachineInputs[2].name).toBe('MyTrig');
      expect(stateMachineInputs[2].value).toBeUndefined();
      expect(stateMachineInputs[2].fire()).toBeUndefined();

      done();
    }
  });
});

test('Playing state machines can be manually started, paused, and restarted', done => {
  const canvas = document.createElement('canvas');
  let hasPaused = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: 'StateMachine',
    onload: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      // Start playback
      r.play();
    },
    onplay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      hasPaused ? done() : r.pause();
    },
    onpause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      hasPaused = true;
      r.play();
    }
  });
});

test('Playing state machines report when states have changed', done => {
  const canvas = document.createElement('canvas');
  let state = 0;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: 'MyArtboard',
    stateMachines: 'StateMachine',
    autoplay: true,
    onplay: () => {
      // Expect the correct animation to be playing
      expect(r.playingStateMachineNames).toHaveLength(1);
      expect(r.playingStateMachineNames[0]).toBe('StateMachine');
      // Check the inputs are correct
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);
      expect(inputs).toHaveLength(3);
      expect(inputs[1].name).toBe('MyBool');
      expect(inputs[2].name).toBe('MyTrig');
    },
    onstatechange: ({type: type, data: stateNames}) => {
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);

      if (state === 0) {
        // console.log(`State: ${(stateNames as string[])[0]}`);
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe('LoopingAnimation');
        
        state++;
        inputs[2].fire();
      } else if (state === 1) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe('PingPongAnimation');

        state++;
        inputs[1].value = true;
      } else if (state === 2) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe('exit');

        done();
      }
    },
  });
});

// #endregion

// #region scrubbing

test('An animation can be played and scrubbed without altering playback state', done => {
  const canvas = document.createElement('canvas');
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onload: () => {
      const firstAnimation = r.animationNames[0];
      r.play(firstAnimation);
    },
    onplay: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.5);
      expect(r.isPlaying).toBeTruthy();
      r.pause(firstAnimation)
    },
    onpause: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.8);
      expect(r.isPlaying).toBeFalsy();
      done();
    }
  });
});

// #endregion