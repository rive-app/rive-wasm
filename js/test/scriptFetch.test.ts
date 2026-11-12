// The canvas build has no script networking, so setScriptFetch only warns.
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

const scriptFetchWarnings = (warn: jest.SpyInstance): unknown[][] =>
  warn.mock.calls.filter((args) =>
    String(args[0]).startsWith("[Rive] Script fetch"),
  );

describe("RuntimeLoader.setScriptFetch without script networking", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    (window as any).ResizeObserver = MockResizeObserver;
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    rive.RuntimeLoader.setScriptFetch(false);
  });

  test("is disabled by default", () => {
    expect(rive.RuntimeLoader.getScriptFetch()).toBeNull();
  });

  test("disabling never warns", async () => {
    await rive.RuntimeLoader.awaitInstance();
    rive.RuntimeLoader.setScriptFetch(false);
    expect(scriptFetchWarnings(warn)).toEqual([]);
  });

  test("enabling warns once and leaves instances working", async () => {
    rive.RuntimeLoader.setScriptFetch({
      allowedHosts: ["api.example.com"],
      maxResponseBytes: 1024,
    });
    expect(rive.RuntimeLoader.getScriptFetch()).toEqual({
      allowedHosts: ["api.example.com"],
      maxResponseBytes: 1024,
    });
    const r = await new Promise<rive.Rive>((resolve, reject) => {
      const instance: rive.Rive = new rive.Rive({
        canvas: document.createElement("canvas"),
        buffer: stateMachineFileBuffer,
        onLoad: () => resolve(instance),
        onLoadError: (event: rive.Event) =>
          reject(new Error(String(event?.data ?? "load error"))),
      });
    });
    expect(scriptFetchWarnings(warn).length).toBe(1);

    rive.RuntimeLoader.setScriptFetch(true);
    rive.RuntimeLoader.setScriptFetch({ proxyUrl: "https://proxy.example" });
    expect(scriptFetchWarnings(warn).length).toBe(1);
    expect(rive.RuntimeLoader.getScriptFetch()).toEqual({
      proxyUrl: "https://proxy.example",
    });
    r.cleanup();
  });

  test("getScriptFetch returns a copy", () => {
    const hosts = ["a.example.com"];
    rive.RuntimeLoader.setScriptFetch({ allowedHosts: hosts });
    hosts.push("b.example.com");
    rive.RuntimeLoader.getScriptFetch()!.allowedHosts!.push("c.example.com");
    expect(rive.RuntimeLoader.getScriptFetch()!.allowedHosts).toEqual([
      "a.example.com",
    ]);
  });
});
