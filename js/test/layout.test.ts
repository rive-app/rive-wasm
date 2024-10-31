// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rc from "../src/rive_advanced.mjs";
import * as rive from "../src/rive";

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
