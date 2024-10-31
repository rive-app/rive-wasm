// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

// #region responsive layout

const canvasInitialWidth = 400;
const canvasInitialHeight = 200;
const artboardInitialWidth = 500;
const artboardInitialHeight = 500;

let mockGetBoundingClientRect: jest.SpyInstance;

beforeEach(() => {
  mockGetBoundingClientRect = jest.spyOn(
    HTMLElement.prototype,
    'getBoundingClientRect'
  ).mockImplementation(() => ({
    width: canvasInitialWidth,
    height: canvasInitialHeight,
    top: 0,
    left: 0,
    right: canvasInitialWidth,
    bottom: canvasInitialHeight,
    x: 0,
    y: 0,
  }));
});

afterEach(() => {
  mockGetBoundingClientRect.mockRestore();
});

test("Layout of type Fit.Layout adjusts artboard and canvas size", (done) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasInitialWidth;
  canvas.height = canvasInitialHeight;
  document.body.appendChild(canvas);

  const r = new rive.Rive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
    layout: new rive.Layout({
      fit: rive.Fit.Layout,
    }),
    onLoad: () => {

      // Validate initial sizes
      expect(r.artboardWidth).toBe(artboardInitialWidth);
      expect(r.artboardHeight).toBe(artboardInitialHeight);
      expect(canvas.width).toBe(canvasInitialWidth);
      expect(canvas.height).toBe(canvasInitialHeight);

      // Set new artboard size should change artboard size
      // but not canvas size
      r.artboardWidth = artboardInitialWidth * 2;
      r.artboardHeight = artboardInitialHeight * 3;
      expect(r.artboardWidth).toBe(artboardInitialWidth * 2);
      expect(r.artboardHeight).toBe(artboardInitialHeight * 3);
      expect(canvas.width).toBe(canvasInitialWidth);
      expect(canvas.height).toBe(canvasInitialHeight);

      // Reset artboard size to initial values
      r.resetArtboardSize();
      expect(r.artboardWidth).toBe(artboardInitialWidth);
      expect(r.artboardHeight).toBe(artboardInitialHeight);
      expect(canvas.width).toBe(canvasInitialWidth);
      expect(canvas.height).toBe(canvasInitialHeight);

      var devicePixelRatio = 1;
      // Resize canvas to match device pixel ratio
      // This should not change the canvas size with a dpr of 1
      // This should set the artboard size to the canvas size if
      // layout type is Fit.Layout
      r.resizeDrawingSurfaceToCanvas(devicePixelRatio);
      expect(canvas.width).toBe(canvasInitialWidth);
      expect(canvas.height).toBe(canvasInitialHeight);
      expect(r.artboardWidth).toBe(canvas.width);
      expect(r.artboardHeight).toBe(canvas.height);

      devicePixelRatio = 2;
      // Resize canvas to match device pixel ratio
      // This should multiply the canvas size by the dpr
      // This should set the artboard size to the original
      // `getBoundingClientRect` size, or half the canvas size if
      // layout type is Fit.Layout
      r.resizeDrawingSurfaceToCanvas(devicePixelRatio);
      expect(canvas.width).toBe(canvasInitialWidth * devicePixelRatio);
      expect(canvas.height).toBe(canvasInitialHeight * devicePixelRatio);
      expect(r.artboardWidth).toBe(canvasInitialWidth);
      expect(r.artboardWidth).toBe(canvas.width / devicePixelRatio);
      expect(r.artboardHeight).toBe(canvasInitialHeight);
      expect(r.artboardHeight).toBe(canvas.height / devicePixelRatio);


      // Change layout scale factor to 2
      var layoutScaleFactor = 2;
      r.layout = new rive.Layout({
        fit: rive.Fit.Layout,
        layoutScaleFactor: 2,
      });

      // Resize canvas to match device pixel ratio
      // This should multiply the canvas size by the dpr
      // This should set the artboard size to the original
      // `getBoundingClientRect` size (or half the canvas size)
      // divided by the layout scale factor
      r.resizeDrawingSurfaceToCanvas(layoutScaleFactor);
      expect(canvas.width).toBe(canvasInitialWidth * devicePixelRatio);
      expect(canvas.height).toBe(canvasInitialHeight * devicePixelRatio);
      expect(r.artboardWidth).toBe(canvasInitialWidth / layoutScaleFactor);
      expect(r.artboardHeight).toBe(canvasInitialHeight / layoutScaleFactor);

      // Change layout type to default, anything but (Fit.Layout)
      // This should not change the artboard size when the canvas is resized
      // in resizeDrawingSurfaceToCanvas regardless of layoutScaleFactor or devicePixelRatio
      layoutScaleFactor = 3;
      devicePixelRatio = 2;
      r.resetArtboardSize();
      r.layout = new rive.Layout({
        // fit: rive.Fit.Contain, // Do not set to Fit.Layout, use default or any other value
        layoutScaleFactor: layoutScaleFactor,
      });
      r.resizeDrawingSurfaceToCanvas(devicePixelRatio);
      expect(canvas.width).toBe(canvasInitialWidth * devicePixelRatio);
      expect(canvas.height).toBe(canvasInitialHeight * devicePixelRatio);
      expect(r.artboardWidth).toBe(artboardInitialWidth);
      expect(r.artboardHeight).toBe(artboardInitialHeight);

      done();
    },
  });
});

test("Artboard size can be set before onLoad", (done) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasInitialWidth;
  canvas.height = canvasInitialHeight;
  document.body.appendChild(canvas);

  const r = new rive.Rive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
    layout: new rive.Layout({
      fit: rive.Fit.Layout,
    }),
    onLoad: () => {
      // Artboard width and height should be set to the values set before onLoad
      expect(r.artboardWidth).toBe(100);
      expect(r.artboardHeight).toBe(200);

      done();
    },

  });
  // Artboard width should be undefined before onLoad
  expect(r.artboardWidth).toBe(undefined);
  // Artboard height should be undefined before onLoad
  expect(r.artboardHeight).toBe(undefined);

  // Set artboard width and height before onLoad
  r.artboardWidth = 100;
  r.artboardHeight = 200;
  expect(r.artboardWidth).toBe(100);
  expect(r.artboardHeight).toBe(200);

});

test("devicePixelRatioUsed can be get/set", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    artboard: "MyArtboard",
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      expect(r.devicePixelRatioUsed).toBe(1);
      r.resizeDrawingSurfaceToCanvas(2);
      expect(r.devicePixelRatioUsed).toBe(2);
      r.devicePixelRatioUsed = 3;
      expect(r.devicePixelRatioUsed).toBe(3);
      r.devicePixelRatioUsed = 4;
      r.resizeDrawingSurfaceToCanvas(5); // This should override the devicePixelRatioUsed above
      expect(r.devicePixelRatioUsed).toBe(5);
      done();
    },
  });
});

// #endregion
