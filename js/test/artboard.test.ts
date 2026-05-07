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

test("onLoadError invoked with artboard name that cannot be found", (done) => {
  const canvas = document.createElement("canvas");
  new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "BadArtboard",
    onLoad: () => {
      done(new Error("onLoad should not be called when artboard name cannot be found"));
    },
    onLoadError: () => {
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
