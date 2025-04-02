// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";

import { loadFile } from "./helpers";

test("Autobinds correctly to the right view model instance", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: true,
    onLoad: () => {
      const viewModelInstance = r.viewModelInstance;
      expect(viewModelInstance).not.toBe(null);
      expect(viewModelInstance?.properties.length).toBe(2);
      expect(viewModelInstance?.properties[0].name).toBe("vm2");
      expect(viewModelInstance?.properties[0].type).toBe("viewModel");
      expect(viewModelInstance?.properties[1].name).toBe("outer");
      expect(viewModelInstance?.properties[1].type).toBe("string");

      done();
    },
  });
});

test("Binds the default view model instance correctly", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      const viewModel = r.viewModelByName("vm1");
      expect(viewModel).not.toBe(null);
      const viewModelInstance = viewModel!.defaultInstance();
      expect(viewModelInstance).not.toBe(null);
      r.bindViewModelInstance(viewModelInstance!);
      expect(r.viewModelInstance).not.toBe(null);
      const outerStringProp = viewModelInstance?.string("outer");
      expect(outerStringProp?.value).toBe("outer-start");
      const innerStringProp = viewModelInstance?.string("vm2/vm3/inner");
      expect(innerStringProp?.value).toBe("inner-start");

      done();
    },
  });
});

test("Binds an empty view model instance correctly", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      const viewModel = r.viewModelByName("vm1");
      expect(viewModel).not.toBe(null);
      const viewModelInstance = viewModel!.instance();
      expect(viewModelInstance).not.toBe(null);
      r.bindViewModelInstance(viewModelInstance!);
      expect(r.viewModelInstance).not.toBe(null);
      const outerStringProp = viewModelInstance?.string("outer");
      expect(outerStringProp?.value).toBe("");
      const innerStringProp = viewModelInstance?.string("vm2/vm3/inner");
      expect(innerStringProp?.value).toBe("");

      done();
    },
  });
});

test("Handles property callbacks correctly", (done) => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let currentAdvance = 0;
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: true,
    onLoad: () => {
      expect(r.viewModelInstance).not.toBe(null);
    },
    onAdvance: () => {
      if (currentAdvance === 0) {
        const viewModelInstance = r.viewModelInstance;
        const outerStringProp = viewModelInstance?.string("outer");
        expect(outerStringProp).not.toBe(null);
        expect(outerStringProp?.value).toBe("outer-start");
        outerStringProp?.on(mockCallback);
        outerStringProp!.value = "outer-update";
      } else if (currentAdvance === 1) {
        const viewModelInstance = r.viewModelInstance;
        const outerStringProp = viewModelInstance?.string("outer");
        expect(outerStringProp?.value).toBe("outer-update");
        expect(mockCallback).toBeCalledTimes(1);
        done();
      }
      currentAdvance++;
    },
  });
});

test("Replaces view model instance with a new value from another tree", (done) => {
  const mockCallback = jest.fn();
  const canvas = document.createElement("canvas");
  let loadCount = 0;
  function onLoad() {
    loadCount++;
    if (loadCount === 2) {
      const file1Vmi = file1.viewModelInstance;
      expect(file1Vmi).not.toBe(null);
      const file2Vmi = file2.viewModelInstance;
      expect(file2Vmi).not.toBe(null);
      const file1Vm3 = file1Vmi?.viewModel("vm2/vm3");
      expect(file1Vm3).not.toBe(null);
      const replaced = file2Vmi?.replaceViewModel("vm2/vm3", file1Vm3!);
      expect(replaced).toBe(true);
      const str = file1Vm3?.string("inner");
      expect(str).not.toBe(null);
      expect(str.value).toBe("inner-start");
      str.value = "inner-update";
      // Retrieve the same string property from the other tree and ensure it's been updated as well
      const strFromFile2 = file2Vmi?.string("vm2/vm3/inner");
      expect(strFromFile2.value).toBe("inner-update");
      done();
    }
  }
  const file1 = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: true,
    onLoad: onLoad,
  });
  const file2 = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: true,
    onLoad: onLoad,
  });
});

test("Replacing the wrong view model instance type gets rejected", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    autoplay: true,
    autoBind: false,
    onLoad: () => {
      const viewModel = r.viewModelByName("vm1");
      expect(viewModel).not.toBe(null);
      const viewModelInstance = viewModel!.defaultInstance();
      expect(viewModelInstance).not.toBe(null);
      const viewModel2 = r.viewModelByName("vm2");
      const viewModelInstance2 = viewModel2!.defaultInstance();
      const replaced = viewModelInstance?.replaceViewModel("vm2/vm3", viewModelInstance2!);
      expect(replaced).toBe(false);

      done();
    },
  });
});
