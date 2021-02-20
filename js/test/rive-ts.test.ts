import { hasUncaughtExceptionCaptureCallback } from 'process';
import { testables } from '../src/rive-ts';

beforeEach(() => {
});

afterEach(() => {
  testables.unloadWasm();
});

test('Wasm loads', async () => {
  expect(testables.isWasmLoaded()).toBe(false);
  await testables.loadWasm();
  expect(testables.isWasmLoaded()).toBe(true);
});

test('Callbacks fired when Wasm loads', done => {
  const cb = runtime => {
    expect(testables.isWasmLoaded()).toBe(true);
    expect(runtime).toBeDefined();
    done();
  };
  expect(testables.isWasmLoaded()).toBe(false);
  testables.onWasmLoaded(cb);
});