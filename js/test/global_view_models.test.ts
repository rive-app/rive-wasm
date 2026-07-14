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
