import * as rive from "../src/rive";
import textBuffer from "./test-rive-buffers/textFile.json";

import {
  pingPongRiveFileBuffer,
  corruptRiveFileBuffer,
  stateMachineFileBuffer,
  loopRiveFileBuffer,
  oneShotRiveFileBuffer,
} from "./assets/bytes";
import { arrayToArrayBuffer, loadRive } from "./helpers";

// #region text
test("Rive returns undefined if not provided the name of a text run", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);
  const canvas = document.createElement("canvas");

  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.getTextRunValue("")).toBeUndefined();
  r.cleanup();

  expect(mock).toBeCalledWith("No text run name provided");
});

test("Rive returns undefined if Artboard isn't set up yet", () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.getTextRunValue("Foo")).toBeUndefined();
  expect(mock).toBeCalledWith(
    "Tried to access text run, but the Artboard is null",
  );
  jest.clearAllMocks();
});

test("Rive returns undefined if Artboard does not have specified text run", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);

  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
  });
  expect(r.getTextRunValue("foofoo")).toBeUndefined();
  r.cleanup();
  expect(mock).toBeCalledWith(
    "Could not access a text run with name 'foofoo' in the 'New Artboard' Artboard. Note that you must rename a text run node in the Rive editor to make it queryable at runtime.",
  );
});

test("Rive returns a text run", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
  });
  const textValue = r.getTextRunValue("MyRun");
  expect(textValue).toBe("text");
  r.cleanup();
});

test("Rive sets a text run value", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
  });
  r.setTextRunValue("MyRun", "test-text");
  expect(r.getTextRunValue("MyRun")).toBe("test-text");
  r.cleanup();
});

// #endregion
