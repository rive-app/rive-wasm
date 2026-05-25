// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rc from "../src/rive_advanced.mjs";
import * as rive from "../src/rive";
import { pingPongRiveFileBuffer } from "./assets/bytes";

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

test("New Layout with Fit.Layout works as expected", (): void => {
  let layout = new rive.Layout({
    fit: rive.Fit.Layout,
    layoutScaleFactor: 2,
  });

  expect(layout.fit).toBe(rive.Fit.Layout);
  expect(layout.layoutScaleFactor).toBe(2);
});

test("layoutScaleFactor can be copied with overridden values", (): void => {
  let layout = new rive.Layout({
    fit: rive.Fit.Layout,
    layoutScaleFactor: 2,
  });

  expect(layout.fit).toBe(rive.Fit.Layout);
  expect(layout.layoutScaleFactor).toBe(2);

  layout = layout.copyWith({
    layoutScaleFactor: 3,
  });

  expect(layout.fit).toBe(rive.Fit.Layout);
  expect(layout.layoutScaleFactor).toBe(3);
});

// #endregion

// #region Fit.Layout responsiveness regressions

// Test helper installed by test/setup.ts — fires a synthetic ResizeObserver
// entry through the same code path the browser would use.
declare const __fireResizeObserver: (
  target: Element,
  width: number,
  height: number,
) => void;

// Drives the public ResizeObserver integration: when the canvas dimensions
// change, Rive should re-fit its drawing surface.
test("Rive re-fits the drawing surface on every non-zero canvas dimension change", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: false,
    layout: new rive.Layout({ fit: rive.Fit.Layout }),
    onLoad: () => {
      const resizeSpy = jest
        .spyOn(r, "resizeDrawingSurfaceToCanvas")
        .mockImplementation(() => {});

      // Initial mount: canvas hidden → no re-fit.
      __fireResizeObserver(canvas, 0, 0);
      expect(resizeSpy).not.toHaveBeenCalled();

      // Reveal at 466×70 → re-fit (zero → non-zero toggle).
      __fireResizeObserver(canvas, 466, 70);
      expect(resizeSpy).toHaveBeenCalledTimes(1);

      // Reflow to 451×70 → re-fit (the regression this patch addresses;
      // previously dropped because hasZeroSize stayed false).
      __fireResizeObserver(canvas, 451, 70);
      expect(resizeSpy).toHaveBeenCalledTimes(2);

      // Observer re-fires at identical dims → no re-fit.
      __fireResizeObserver(canvas, 451, 70);
      expect(resizeSpy).toHaveBeenCalledTimes(2);

      resizeSpy.mockRestore();
      r.cleanup();
      done();
    },
  });
});

// Verifies that resizeDrawingSurfaceToCanvas is safe to call when the canvas
// reports 0×0 (display:none-on-mount scenario): it must not overwrite the
// artboard's existing width/height with zeros. Previously the Fit.Layout
// branch blindly wrote 0/scaleFactor into the artboard, corrupting the
// responsive layout state for the rest of the session.
test("resizeDrawingSurfaceToCanvas preserves artboard dimensions when canvas is 0×0", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: false,
    layout: new rive.Layout({ fit: rive.Fit.Layout }),
    onLoad: () => {
      // Seed plausible artboard dimensions via the public setters,
      // mimicking the design-time or previously-correct measurement.
      r.artboardWidth = 376;
      r.artboardHeight = 70;

      jest.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      } as DOMRect);

      r.resizeDrawingSurfaceToCanvas();

      expect(r.artboardWidth).toBe(376);
      expect(r.artboardHeight).toBe(70);

      r.cleanup();
      done();
    },
  });
});

// #endregion
