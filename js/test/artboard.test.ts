import getLongArtboardNameBuffer from "./test-rive-buffers/longArtboardName";
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";
import { arrayToArrayBuffer, loadRive } from "./helpers";

// #region artboards

test("Artboards can be fetched by name", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "Artboard2",
  });
  expect(r).toBeDefined();
  r.cleanup();
});

test("Artboards can be fetched with a long name", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(getLongArtboardNameBuffer()),
    artboard: "Really Long  Artboard Name with Double Spaces",
  });
  expect(r).toBeDefined();
  r.cleanup();
});

test("onLoadError invoked with artboard name that cannot be found", async () => {
  const canvas = document.createElement("canvas");
  const onLoad = jest.fn();
  const onLoadError = jest.fn();
  await expect(
    loadRive({
      canvas: canvas,
      buffer: stateMachineFileBuffer,
      artboard: "BadArtboard",
      onLoad,
      onLoadError,
    }),
  ).rejects.toThrow("Rive failed to load");
  expect(onLoadError).toHaveBeenCalledTimes(1);
  // onLoad must not be called when the artboard name cannot be found
  expect(onLoad).not.toHaveBeenCalled();
});

test("Artboard bounds can be retrieved from a loaded Rive file", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
  });
  const bounds = r.bounds;
  expect(bounds).toBeDefined();
  expect(bounds.minX).toBe(0);
  expect(bounds.minY).toBe(0);
  expect(bounds.maxX).toBe(500);
  expect(bounds.maxY).toBe(500);
  r.cleanup();
});

test("Artboard width and height can be get/set from a loaded Rive file", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
  });
  const initialWidth = r.artboardWidth;
  const initialHeight = r.artboardHeight;

  expect(initialWidth).toBe(500);
  expect(initialHeight).toBe(500);

  r.artboardWidth = 1000;
  r.artboardHeight = 1000;

  expect(r.artboardWidth).toBe(1000);
  expect(r.artboardHeight).toBe(1000);

  r.resetArtboardSize();

  expect(r.artboardWidth).toBe(initialWidth);
  expect(r.artboardHeight).toBe(initialHeight);
  r.cleanup();
});

// #endregion


