import { loadWasm, rive } from '../src/rive-ts';

test('Wasm loads', async () => {
  expect(rive).toBeUndefined();
  await loadWasm();
  expect(rive).toBeDefined();
});