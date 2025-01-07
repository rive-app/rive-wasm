// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import textBuffer from "./test-rive-buffers/textFile.json";

import {
  pingPongRiveFileBuffer,
  corruptRiveFileBuffer,
  stateMachineFileBuffer,
  loopRiveFileBuffer,
  oneShotRiveFileBuffer,
} from "./assets/bytes";
import { arrayToArrayBuffer } from "./helpers";

// #region text
test("Rive returns undefined if not provided the name of a text run", async () => {
  const mock = jest.fn();
  jest.spyOn(console, "warn").mockImplementation(mock);
  const canvas = document.createElement("canvas");

  await new Promise<void>((resolve) => {
    const r = new rive.Rive({
      canvas: canvas,
      buffer: stateMachineFileBuffer,
      autoplay: true,
      artboard: "MyArtboard",
      onLoad: () => {
        const run = r.getTextRunValue("");
        expect(run).toBeUndefined();
        resolve();
      },
    });
  });

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
  await new Promise<void>((resolve) => {
    const r = new rive.Rive({
      canvas: canvas,
      buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
      autoplay: true,
      onLoad: () => {
        const run = r.getTextRunValue("foofoo");
        expect(run).toBeUndefined();
        resolve();
      },
    });
  });
  expect(mock).toBeCalledWith(
    "Could not access a text run with name 'foofoo' in the 'New Artboard' Artboard. Note that you must rename a text run node in the Rive editor to make it queryable at runtime.",
  );
});

test("Rive returns a text run", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
    onLoad: () => {
      const textValue = r.getTextRunValue("MyRun");
      expect(textValue).toBe("text");
      done();
    },
  });
});

test("Rive sets a text run value", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(JSON.parse(JSON.stringify(textBuffer))),
    autoplay: true,
    onLoad: () => {
      r.setTextRunValue("MyRun", "test-text");
      expect(r.getTextRunValue("MyRun")).toBe("test-text");
      done();
    },
  });
});

// #endregion
