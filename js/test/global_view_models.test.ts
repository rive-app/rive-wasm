//
// These tests exercise the global view model instance API
// (`globalViewModelNames` / `setGlobalViewModelInstance` / `globalViewModelInstance`)
// and the decoupled `setViewModelInstance` + `bind`. They require the WASM
// module to be rebuilt so the new bindings are present.
//
// The fixture `global_view_models_test.riv` has a main view model named "Main"
// and global view models named (in file order) "Sizes", "Colors", "Labels".
import * as rive from "../src/rive";

import { loadFile, loadRive, waitForPredicate } from "./helpers";

const originalErrorLog = console.error;
const errorLogMock = jest.fn();

beforeEach(() => {
  errorLogMock.mockClear();
  console.error = errorLogMock;
});

afterEach(() => {
  console.error = originalErrorLog;
});

test("lists the global view model names in file order", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
  });
  expect(r.globalViewModelNames()).toEqual(["Sizes", "Colors", "Labels"]);
  r.cleanup();
});

test("globals are null until created (no autoBind)", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
  });
  // Nothing set and autoBind off ⇒ the runtime has no global instance.
  expect(r.globalViewModelInstance("Colors")).toBe(null);
  r.cleanup();
});

test("autoBind creates a default instance for each global", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
  });
  for (const name of r.globalViewModelNames()) {
    expect(r.globalViewModelInstance(name)).not.toBe(null);
  }
  r.cleanup();
});

test("set then bind: batch several sets, apply once", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
  });
  const main = r.viewModelByName("Main")!.defaultInstance()!;
  const colors = r.viewModelByName("Colors")!.defaultInstance()!;

  r.setViewModelInstance(main);
  expect(r.setGlobalViewModelInstance("Colors", colors)).toBe(true);
  // Sets are reflected by the getters before bind().
  expect(r.globalViewModelInstance("Colors")).toBe(colors);
  expect(r.viewModelInstance).toBe(main);

  r.bind();
  expect(r.globalViewModelInstance("Colors")).toBe(colors);
  r.cleanup();
});

test("fires .on() callbacks when an auto-bound global's property changes", async () => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let advanceCount = 0;
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
    onAdvance: () => {
      advanceCount++;
    },
  });
  await waitForPredicate(() => advanceCount >= 1);
  const sizes = r.globalViewModelInstance("Sizes");
  expect(sizes).not.toBe(null);
  const gaps = sizes!.number("gaps");
  expect(gaps).not.toBe(null);
  expect(gaps!.value).toBe(16);
  gaps!.on(mockCallback);
  gaps!.value = 24;
  const advancesAtUpdate = advanceCount;
  await waitForPredicate(() => advanceCount > advancesAtUpdate);
  const gapsAfter = r.globalViewModelInstance("Sizes")!.number("gaps");
  expect(gapsAfter!.value).toBe(24);
  expect(mockCallback).toBeCalledTimes(1);
  expect(mockCallback).toBeCalledWith(24);
  r.cleanup();
});

test("a replaced global instance stops firing callbacks", async () => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let advanceCount = 0;
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: true,
    onAdvance: () => {
      advanceCount++;
    },
  });
  await waitForPredicate(() => advanceCount >= 1);
  const gaps = r.globalViewModelInstance("Sizes")!.number("gaps");
  gaps!.on(mockCallback);
  // Swap in a fresh instance for the same global; the old instance is
  // cleaned up and its callbacks must not fire again.
  const replacement = r.viewModelByName("Sizes")!.defaultInstance()!;
  expect(r.setGlobalViewModelInstance("Sizes", replacement)).toBe(true);
  r.bind();
  r.globalViewModelInstance("Sizes")!.number("gaps")!.value = 42;
  const advancesAtUpdate = advanceCount;
  // Positive control: an advance happens and the new instance holds the value.
  await waitForPredicate(() => advanceCount > advancesAtUpdate);
  expect(r.globalViewModelInstance("Sizes")!.number("gaps")!.value).toBe(42);
  expect(mockCallback).not.toBeCalled();
  r.cleanup();
});

test("setting an unknown or non-global name returns false", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile("assets/global_view_models_test.riv"),
    autoplay: true,
    autoBind: false,
  });
  const mainInstance = r.viewModelByName("Main")!.defaultInstance()!;
  expect(r.setGlobalViewModelInstance("DoesNotExist", mainInstance)).toBe(
    false,
  );
  expect(r.setGlobalViewModelInstance("Main", mainInstance)).toBe(false);
  r.cleanup();
});
