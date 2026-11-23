import * as rive from "../src/rive";

import { loadFile, loadRive } from "./helpers";

const testTextRunValue = (
  r: rive.Rive,
  runName: string,
  path: string,
  expectedValue: string,
) => {
  const text = r.getTextRunValueAtPath(runName, path);
  expect(text).toBe(expectedValue);

  var newValue = "New Value";
  r.setTextRunValueAtPath(runName, newValue, path);
  const text2 = r.getTextRunValueAtPath(runName, path);
  expect(text2).toBe(newValue);
};

// #region nested text
test("Rive updates nested text runs", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  testTextRunValue(r, "ArtboardBRun", "ArtboardB-1", "Artboard B Run");
  testTextRunValue(r, "ArtboardBRun", "ArtboardB-2", "Artboard B Run");
  testTextRunValue(
    r,
    "ArtboardCRun",
    "ArtboardB-1/ArtboardC-1",
    "Artboard C Run",
  );
  testTextRunValue(
    r,
    "ArtboardCRun",
    "ArtboardB-1/ArtboardC-2",
    "Artboard C Run",
  );
  testTextRunValue(
    r,
    "ArtboardCRun",
    "ArtboardB-2/ArtboardC-1",
    "Artboard C Run",
  );
  testTextRunValue(
    r,
    "ArtboardCRun",
    "ArtboardB-2/ArtboardC-2",
    "Artboard C Run",
  );
  r.cleanup();
});

test("Rive returns undefined if not provided the correct name of a nested text run", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const textName = "WrongRun";
  const path = "ArtboardB-1/ArtboardC-1";
  const text = r.getTextRunValueAtPath(textName, path);
  expect(text).toBeUndefined();
  expect(mock).toBeCalledWith(
    `Could not get text with name: '${textName}', at path:'${path}'`,
  );
  r.cleanup();
});

test("Rive returns undefined if not provided the correct path of a nested text run", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const textName = "ArtboardCRun";
  const path = "ArtboardB-1/ArtboardC-Wrong";
  const text = r.getTextRunValueAtPath(textName, path);
  expect(text).toBeUndefined();
  expect(mock).toBeCalledWith(
    `Could not get text with name: '${textName}', at path:'${path}'`,
  );
  r.cleanup();
});

test("Rive logs a warning if the nested text run is not found for the correct run name", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const textName = "WrongRun";
  const path = "ArtboardB-1/ArtboardC-1";
  r.setTextRunValueAtPath(textName, "New Value", path);
  expect(mock).toBeCalledWith(
    `Could not set text with name: '${textName}', at path:'${path}'`,
  );
  r.cleanup();
});

test("Rive logs a warning if the nested text run is not found for the correct path", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const textName = "ArtboardCRun";
  const path = "ArtboardB-1/ArtboardC-Wrong";
  r.setTextRunValueAtPath(textName, "New Value", path);
  expect(mock).toBeCalledWith(
    `Could not set text with name: '${textName}', at path:'${path}'`,
  );
  r.cleanup();
});

test("Rive logs a warning if an undefined text name is provided when getting a nested text run value", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const path = "ArtboardB-1/ArtboardC-Wrong";
  r.getTextRunValueAtPath("", path);
  expect(mock).toBeCalledWith(`No text name provided for path '${path}'`);
  r.cleanup();
});

test("Rive logs a warning if an undefined text name is provided when setting a nested text run value", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const path = "ArtboardB-1/ArtboardC-Wrong";
  r.setTextRunValueAtPath("", "New Value", path);
  expect(mock).toBeCalledWith(`No text name provided for path '${path}'`);
  r.cleanup();
});

test("Rive logs a warning if an undefined path is provided when getting a nested text run value", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const name = "ArtboardBRun";
  r.getTextRunValueAtPath(name, "");
  expect(mock).toBeCalledWith(`No path provided for text '${name}'`);
  r.cleanup();
});

test("Rive logs a warning if an undefined path is provided when setting a nested text run value", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    autoplay: true,
  });
  const name = "ArtboardBRun";
  r.setTextRunValueAtPath(name, "New Value", "");
  expect(mock).toBeCalledWith(`No path provided for text '${name}'`);
  r.cleanup();
});
// #endregion
