// Note: This uses the canvas-advanced-single module, which has WASM embedded in
// JS which means there is no loading an external WASM file for tests.
//
// These tests exercise the global view model instance API
// (`globalViewModelNames` / `setGlobalViewModelInstance` / `globalViewModelInstance`)
// and the decoupled `setViewModelInstance` + `bind`. They require the WASM
// module to be rebuilt so the new bindings are present.
//
// The fixture `global_view_models_test.riv` has a main view model named "Main"
// and global view models named (in file order) "Sizes", "Colors", "Labels".
import * as rive from "../src/rive";

import { loadFile } from "./helpers";

const originalErrorLog = console.error;
const errorLogMock = jest.fn();

beforeEach(() => {
  errorLogMock.mockClear();
  console.error = errorLogMock;
});

afterEach(() => {
  console.error = originalErrorLog;
});

test("lists the global view model names in file order", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      expect(r.globalViewModelNames()).toEqual(["Sizes", "Colors", "Labels"]);
      done();
    },
  });
});

test("globals are null until created (no autoBind)", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      // Nothing set and autoBind off ⇒ the runtime has no global instance.
      expect(r.globalViewModelInstance("Colors")).toBe(null);
      done();
    },
  });
});

test("autoBind creates a default instance for each global", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
    onLoad: () => {
      for (const name of r.globalViewModelNames()) {
        expect(r.globalViewModelInstance(name)).not.toBe(null);
      }
      done();
    },
  });
});

test("set then bind: batch several sets, apply once", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      const main = r.viewModelByName("Main")!.defaultInstance()!;
      const colors = r.viewModelByName("Colors")!.defaultInstance()!;

      r.setViewModelInstance(main);
      expect(r.setGlobalViewModelInstance("Colors", colors)).toBe(true);
      // Sets are reflected by the getters before bind().
      expect(r.globalViewModelInstance("Colors")).toBe(colors);
      expect(r.viewModelInstance).toBe(main);

      r.bind();
      expect(r.globalViewModelInstance("Colors")).toBe(colors);
      done();
    },
  });
});

test("fires .on() callbacks when an auto-bound global's property changes", (done) => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let currentAdvance = 0;
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
    onAdvance: () => {
      if (currentAdvance === 0) {
        const sizes = r.globalViewModelInstance("Sizes");
        expect(sizes).not.toBe(null);
        const gaps = sizes!.number("gaps");
        expect(gaps).not.toBe(null);
        expect(gaps!.value).toBe(16);
        gaps!.on(mockCallback);
        gaps!.value = 24;
      } else if (currentAdvance === 1) {
        const gaps = r.globalViewModelInstance("Sizes")!.number("gaps");
        expect(gaps!.value).toBe(24);
        expect(mockCallback).toBeCalledTimes(1);
        expect(mockCallback).toBeCalledWith(24);
        done();
      }
      currentAdvance++;
    },
  });
});

test("a replaced global instance stops firing callbacks", (done) => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let currentAdvance = 0;
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
    onAdvance: () => {
      if (currentAdvance === 0) {
        const gaps = r.globalViewModelInstance("Sizes")!.number("gaps");
        gaps!.on(mockCallback);
        // Swap in a fresh instance for the same global; the old instance is
        // cleaned up and its callbacks must not fire again.
        const replacement = r.viewModelByName("Sizes")!.defaultInstance()!;
        expect(r.setGlobalViewModelInstance("Sizes", replacement)).toBe(true);
        r.bind();
        r.globalViewModelInstance("Sizes")!.number("gaps")!.value = 42;
      } else if (currentAdvance === 1) {
        expect(r.globalViewModelInstance("Sizes")!.number("gaps")!.value).toBe(
          42,
        );
        expect(mockCallback).not.toBeCalled();
        done();
      }
      currentAdvance++;
    },
  });
});

test("setting an unknown or non-global name returns false", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      const mainInstance = r.viewModelByName("Main")!.defaultInstance()!;
      expect(r.setGlobalViewModelInstance("DoesNotExist", mainInstance)).toBe(
        false,
      );
      expect(r.setGlobalViewModelInstance("Main", mainInstance)).toBe(false);
      done();
    },
  });
});
