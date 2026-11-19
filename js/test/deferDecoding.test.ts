// Note: This uses the canvas-advanced-single module, which has WASM embedded in
// JS which means there is no loading an external WASM file for tests.
//
// deferDecoding imports a file without decoding its animations, artboards
// (other than the default one) and file level view model instances, which
// decode the first time they're used. Everything read through the API has to
// match an eager import.
import * as rive from "../src/rive";

import { loadFile } from "./helpers";

const fixtures = [
  "assets/data_bind_runtime_test.riv",
  "assets/data_binding_lists.riv",
  "assets/global_view_models_test.riv",
  "assets/list_add_instance_at_test.riv",
  "assets/runtime_nested_text_runs.riv",
  "assets/layout_scroll_vertical.riv",
  "assets/focus.riv",
];

const originalErrorLog = console.error;
const errorLogMock = jest.fn();

beforeEach(() => {
  errorLogMock.mockClear();
  console.error = errorLogMock;
});

afterEach(() => {
  console.error = originalErrorLog;
  jest.restoreAllMocks();
});

const loadRive = (
  params: Omit<rive.RiveParameters, "canvas"> & { canvas?: HTMLCanvasElement },
): Promise<rive.Rive> =>
  new Promise((resolve, reject) => {
    const r: rive.Rive = new rive.Rive({
      canvas: document.createElement("canvas"),
      ...params,
      onLoad: () => resolve(r),
      onLoadError: (event) => reject(event),
    });
  });

const loadRiveFile = async (
  params: rive.RiveFileParameters,
): Promise<rive.RiveFile> => {
  const file = new rive.RiveFile(params);
  await file.init();
  return file;
};

const summarizeInstance = (
  instance: rive.ViewModelInstance | null,
  depth: number,
): unknown => {
  if (instance === null) {
    return null;
  }
  return instance.properties.map((property) => {
    const { name, type } = property;
    switch (type) {
      case rive.DataType.number:
        return [name, type, instance.number(name)?.value];
      case rive.DataType.string:
        return [name, type, instance.string(name)?.value];
      case rive.DataType.boolean:
        return [name, type, instance.boolean(name)?.value];
      case rive.DataType.color:
        return [name, type, instance.color(name)?.value];
      case rive.DataType.enumType:
        return [name, type, instance.enum(name)?.value];
      case rive.DataType.list:
        return [name, type, instance.list(name)?.length];
      case rive.DataType.viewModel:
        return [
          name,
          type,
          depth < 4
            ? summarizeInstance(instance.viewModel(name), depth + 1)
            : null,
        ];
      default:
        return [name, type];
    }
  });
};

// What a player reads from a file. View model names and counts come first:
// reading them doesn't decode any instance.
const summarize = (r: rive.Rive) => {
  const viewModels = [];
  for (let i = 0; i < r.viewModelCount; i++) {
    const viewModel = r.viewModelByIndex(i)!;
    viewModels.push({
      name: viewModel.name,
      instanceCount: viewModel.instanceCount,
      instanceNames: viewModel.instanceNames,
      properties: viewModel.properties.map((p) => [p.name, p.type]),
    });
  }
  const instances = [];
  for (let i = 0; i < r.viewModelCount; i++) {
    const viewModel = r.viewModelByIndex(i)!;
    for (let j = 0; j < viewModel.instanceCount; j++) {
      instances.push(summarizeInstance(viewModel.instanceByIndex(j), 0));
    }
    instances.push(summarizeInstance(viewModel.defaultInstance(), 0));
  }
  return {
    activeArtboard: r.activeArtboard,
    globalViewModelNames: r.globalViewModelNames(),
    viewModels,
    instances,
    // Last: listing the contents decodes every artboard.
    contents: r.contents,
  };
};

const errorsLogged = (): string[] =>
  errorLogMock.mock.calls.map((call) => String(call[0]));

// Reads everything back, with what it logged along the way (autoBind reports
// artboards without a view model, whichever way the file was imported).
const read = async (fixture: string, deferDecoding: boolean) => {
  errorLogMock.mockClear();
  const r = await loadRive({
    buffer: loadFile(fixture),
    autoBind: true,
    deferDecoding,
  });
  const summary = summarize(r);
  r.cleanup();
  return { summary, errors: errorsLogged() };
};

test.each(fixtures)("%s reads the same deferred as eager", async (fixture) => {
  const expected = await read(fixture, false);
  expect(expected.summary.contents.artboards.length).toBeGreaterThan(0);
  expect(await read(fixture, true)).toEqual(expected);
});

/** Lets the render loop run, so queued canvas draws reach the 2d context. */
const nextFrames = (count = 3): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

// Opens an artboard on its first state machine, paused so the frame doesn't
// depend on time, and records what it drew.
const firstFrame = async (
  fixture: string,
  artboard: { name: string; stateMachines: { name: string }[] },
  deferDecoding: boolean,
) => {
  errorLogMock.mockClear();
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas,
    buffer: loadFile(fixture),
    artboard: artboard.name,
    stateMachine: artboard.stateMachines[0]?.name,
    autoBind: true,
    deferDecoding,
  });
  await nextFrames();
  const ctx = canvas.getContext("2d") as any;
  const result = {
    activeArtboard: r.activeArtboard,
    animationNames: r.animationNames,
    stateMachineNames: r.stateMachineNames,
    inputs: r
      .stateMachineInputs(artboard.stateMachines[0]?.name ?? "")
      ?.map((input) => [input.name, input.type, input.value]),
    // Through JSON: the mock gives each gradient a function of its own.
    events: JSON.parse(JSON.stringify(ctx.__getEvents())),
    errors: errorsLogged(),
  };
  r.cleanup();
  return result;
};

test.each(fixtures)(
  "%s draws every artboard the same deferred as eager",
  async (fixture) => {
    const { summary } = await read(fixture, false);
    // The default artboard decodes at import; the others decode as they're
    // instanced here, and their animations as their state machines apply them.
    for (const artboard of summary.contents.artboards) {
      const expected = await firstFrame(fixture, artboard, false);
      expect(expected.activeArtboard).toBe(artboard.name);
      expect(expected.events.length).toBeGreaterThan(0);
      expect(await firstFrame(fixture, artboard, true)).toEqual(expected);
    }
  },
  // Every artboard loads and draws twice, so files with many artboards can run
  // past the default 5s on slow runners.
  10_000,
);

test("RiveFile hands deferDecoding to the runtime's load", async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
  const load = jest.spyOn(runtime, "load");

  const eager = await loadRiveFile({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
  });
  expect(load).toHaveBeenLastCalledWith(
    expect.anything(),
    undefined,
    true,
    null,
    false,
  );

  const deferred = await loadRiveFile({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    deferDecoding: true,
  });
  expect(load).toHaveBeenLastCalledWith(
    expect.anything(),
    undefined,
    true,
    null,
    true,
  );

  // A re-import (another instance's mode) keeps the file's flag.
  const copy = await deferred.reimport(false);
  expect(load).toHaveBeenLastCalledWith(
    expect.anything(),
    undefined,
    true,
    null,
    true,
  );

  eager.cleanup();
  deferred.cleanup();
  copy.cleanup();
});

test("Rive forwards deferDecoding to the file it imports", async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
  const load = jest.spyOn(runtime, "load");

  const r = await loadRive({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    deferDecoding: true,
  });
  expect(load).toHaveBeenLastCalledWith(
    expect.anything(),
    undefined,
    true,
    null,
    true,
  );

  // Reloading keeps the constructor's flag.
  await new Promise<void>((resolve) => {
    r.on(rive.EventType.Load, () => resolve());
    r.load({ buffer: loadFile("assets/data_binding_lists.riv") });
  });
  expect(load).toHaveBeenLastCalledWith(
    expect.anything(),
    undefined,
    true,
    null,
    true,
  );
  r.cleanup();
});

test("a supplied riveFile keeps its own flag", async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
  const riveFile = await loadRiveFile({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
  });
  const load = jest.spyOn(runtime, "load");
  const r = await loadRive({ riveFile, deferDecoding: true });
  expect(load).not.toHaveBeenCalled();
  r.cleanup();
  riveFile.cleanup();
});
