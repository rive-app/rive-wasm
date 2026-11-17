import { stateMachineFileBuffer } from "./assets/bytes";

let deliver: (entries: Partial<ResizeObserverEntry>[]) => void;
const unobserve = jest.fn();

class CapturingResizeObserver {
  constructor(callback: (entries: Partial<ResizeObserverEntry>[]) => void) {
    deliver = callback;
  }
  observe() {}
  unobserve = unobserve;
  disconnect() {}
}

test("a resize entry delivered after cleanup() is ignored", async () => {
  // The shared observer is created when the module loads.
  (globalThis as any).ResizeObserver = CapturingResizeObserver;
  let rive: typeof import("../src/rive");
  jest.isolateModules(() => {
    rive = require("../src/rive");
  });

  const canvas = document.createElement("canvas");
  await new Promise<void>((resolve) => {
    const r = new rive.Rive({
      canvas,
      buffer: stateMachineFileBuffer,
      onLoad: () => {
        r.cleanup();
        resolve();
      },
    });
  });

  // The browser queued this entry before cleanup() removed the canvas.
  expect(() => deliver([{ target: canvas }])).not.toThrow();
  expect(unobserve).toHaveBeenCalledWith(canvas);
});
