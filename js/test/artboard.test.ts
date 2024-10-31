// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import getLongArtboardNameBuffer from "./test-rive-buffers/longArtboardName";
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";
import { arrayToArrayBuffer } from "./helpers";

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

test("Rive explodes when given an invalid artboard name", async (done) => {
  const warningMock = jest.fn();
  const errorMock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(warningMock);
  jest.spyOn(console, "error").mockImplementation(errorMock);
  const canvas = document.createElement("canvas");
  await new Promise<void>(
    (resolve) =>
      new rive.Rive({
        canvas: canvas,
        buffer: stateMachineFileBuffer,
        artboard: "BadArtboard",
        onLoad: () => { expect(false).toBeTruthy()},
        onLoadError: () => {
          // We should get here
          resolve();
        },
      }),
  );
  expect(warningMock).toBeCalledWith("Invalid artboard name or no default artboard")
  // racy should we add "waitFor"
  await new Promise((r) => setTimeout(r, 50));
  // called with expect(false).toBeTruthy()
  expect(errorMock).toBeCalledTimes(1)
  done();
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

test("Artboard width and height can be get/set from a loaded Rive file", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
    onLoad: () => {
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
      done();
    },
  });
});

// #endregion
