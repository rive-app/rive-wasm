import * as rc from "../src/rive_advanced.mjs";
import * as threads from "../src/rive_threads.mjs";
import * as rive from "../src/rive";
import {
  pingPongRiveFileBuffer,
  corruptRiveFileBuffer,
  loopRiveFileBuffer,
  oneShotRiveFileBuffer,
  stateMachineFileBuffer,
} from "./assets/bytes";
import { loadFile, loadRive, waitForPredicate } from "./helpers";
import { testWith } from "./buildFeatures";

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
}

// #region setup and teardown

beforeEach(() => {
  // needed to prevent logging bad header on the corrupt file loader
  // not sure why mocking in that function does not work
  jest.spyOn(console, "error").mockImplementation(() => {});
  (window as any).ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #endregion

// #region runtime loading

test("Runtime can be loaded using callbacks", async () => {
  let callbacksSucceeded = 0;
  const callback1: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void => {
    expect(runtime).toBeDefined();
    expect(runtime.Fit.none).toBeDefined();
    expect(runtime.Fit.cover).toBeDefined();
    expect(runtime.Fit.none).not.toBe(runtime.Fit.cover);
    callbacksSucceeded += 1;
  };

  const callback2: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void => {
    expect(runtime).toBeDefined();
    callbacksSucceeded += 1;
  };

  const callback3: rive.RuntimeCallback = (runtime: rc.RiveCanvas): void => {
    expect(runtime).toBeDefined();
    callbacksSucceeded += 1;
  };

  rive.RuntimeLoader.getInstance(callback1);
  rive.RuntimeLoader.getInstance(callback2);
  rive.RuntimeLoader.getInstance(callback3);

  // Wait until the runtime has actually loaded and fired all three callbacks,
  // rather than racing a fixed timeout against WASM load time (which made this
  // flaky: on a cold/slow load the callbacks were still queued at assert time).
  await waitForPredicate(() => callbacksSucceeded === 3);
  expect(callbacksSucceeded).toBe(3);
});

test("Runtime can be loaded using promises", async () => {
  const rive1: rc.RiveCanvas = await rive.RuntimeLoader.awaitInstance();
  expect(rive1).toBeDefined();
  expect(rive1.Fit.none).toBeDefined();
  expect(rive1.Fit.cover).toBeDefined();
  expect(rive1.Fit.none).not.toBe(rive1.Fit.cover);

  const rive2 = await rive.RuntimeLoader.awaitInstance();
  expect(rive2).toBe(rive1);

  // A call made after the load has settled gets the same runtime.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const rive3 = await rive.RuntimeLoader.awaitInstance();
  expect(rive3).toBe(rive1);
});

describe("RuntimeLoader WASM fallback URL behavior", () => {
  let savedRuntime: rc.RiveCanvas;
  let savedIsLoading: boolean;
  let savedCallBackQueue: rive.RuntimeCallback[];
  let savedErrorCallbackQueue: ((error: Error) => void)[];
  let savedWasmURL: string;
  let savedWasmFallbackURL: string | null;
  let savedWasmBinary: ArrayBuffer | null;
  let originalRcDefault: (typeof rc)["default"];

  beforeEach(() => {
    savedRuntime = (rive.RuntimeLoader as any).runtime;
    savedIsLoading = (rive.RuntimeLoader as any).isLoading;
    savedCallBackQueue = (rive.RuntimeLoader as any).callBackQueue;
    savedErrorCallbackQueue = (rive.RuntimeLoader as any).errorCallbackQueue;
    savedWasmURL = rive.RuntimeLoader.getWasmUrl();
    savedWasmFallbackURL = rive.RuntimeLoader.getWasmFallbackUrl();
    savedWasmBinary = rive.RuntimeLoader.getWasmBinary();
    originalRcDefault = rc.default;

    // Reset the singleton to an unloaded state so loadRuntime() fires
    (rive.RuntimeLoader as any).runtime = undefined;
    (rive.RuntimeLoader as any).isLoading = false;
    (rive.RuntimeLoader as any).callBackQueue = [];
    (rive.RuntimeLoader as any).errorCallbackQueue = [];
    rive.RuntimeLoader.setWasmUrl("https://primary.example.com/rive.wasm");
    rive.RuntimeLoader.setWasmFallbackUrl(
      "https://fallback.example.com/rive_fallback.wasm",
    );
    rive.RuntimeLoader.setWasmBinary(null);
  });

  afterEach(() => {
    // Restore rc.default before restoring the singleton so any in-flight
    // promise chains that settle during cleanup use the real loader.
    (rc as any).default = originalRcDefault;

    (rive.RuntimeLoader as any).runtime = savedRuntime;
    (rive.RuntimeLoader as any).isLoading = savedIsLoading;
    (rive.RuntimeLoader as any).callBackQueue = savedCallBackQueue;
    (rive.RuntimeLoader as any).errorCallbackQueue = savedErrorCallbackQueue;
    rive.RuntimeLoader.setWasmUrl(savedWasmURL);
    rive.RuntimeLoader.setWasmFallbackUrl(savedWasmFallbackURL);
    rive.RuntimeLoader.setWasmBinary(savedWasmBinary);
    jest.restoreAllMocks();
  });

  test("default fallback URL points to the jsdelivr CDN", () => {
    expect(savedWasmFallbackURL).toMatch(/cdn\.jsdelivr\.net/);
  });

  test("setWasmFallbackUrl / getWasmFallbackUrl round-trip", () => {
    rive.RuntimeLoader.setWasmFallbackUrl(
      "https://my-cdn.com/rive_fallback.wasm",
    );
    expect(rive.RuntimeLoader.getWasmFallbackUrl()).toBe(
      "https://my-cdn.com/rive_fallback.wasm",
    );
  });

  test("setWasmFallbackUrl(null) disables the fallback", () => {
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    expect(rive.RuntimeLoader.getWasmFallbackUrl()).toBeNull();
  });

  test("fallback URL is tried when primary URL fails", async () => {
    const fallbackUrl = "https://fallback.example.com/rive_fallback.wasm";
    rive.RuntimeLoader.setWasmFallbackUrl(fallbackUrl);

    const mockRuntime = {} as rc.RiveCanvas;
    let callCount = 0;

    (rc as any).default = jest.fn((): Promise<rc.RiveCanvas> => {
      callCount++;
      return callCount === 1
        ? Promise.reject(new Error("Primary failed"))
        : Promise.resolve(mockRuntime);
    });

    await new Promise<void>((resolve) => {
      rive.RuntimeLoader.getInstance((runtime) => {
        expect(runtime).toBe(mockRuntime);
        resolve();
      });
    });

    expect(callCount).toBe(2);
    expect(rive.RuntimeLoader.getWasmUrl()).toBe(fallbackUrl);
  });

  test("wasmBinary is cleared when falling back so the fallback URL is actually fetched", async () => {
    const fallbackUrl = "https://fallback.example.com/rive_fallback.wasm";
    rive.RuntimeLoader.setWasmFallbackUrl(fallbackUrl);
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));

    const mockRuntime = {} as rc.RiveCanvas;
    let callCount = 0;

    (rc as any).default = jest.fn((opts: any): Promise<rc.RiveCanvas> => {
      callCount++;
      if (callCount === 1) {
        // First call should have wasmBinary set
        expect(opts.wasmBinary).toBeInstanceOf(ArrayBuffer);
        return Promise.reject(new Error("Primary failed"));
      }
      // Second (fallback) call should NOT have wasmBinary
      expect(opts.wasmBinary).toBeUndefined();
      return Promise.resolve(mockRuntime);
    });

    await new Promise<void>((resolve) => {
      rive.RuntimeLoader.getInstance((runtime) => {
        expect(runtime).toBe(mockRuntime);
        resolve();
      });
    });

    expect(callCount).toBe(2);
    expect(rive.RuntimeLoader.getWasmBinary()).toBeNull();
  });

  test("when fallback is null, no retry occurs", async () => {
    rive.RuntimeLoader.setWasmFallbackUrl(null);

    const rcDefaultMock = jest
      .fn()
      .mockRejectedValue(new Error("Load failed"));
    (rc as any).default = rcDefaultMock;

    rive.RuntimeLoader.getInstance(() => {});

    expect(rcDefaultMock).toHaveBeenCalledTimes(1);
  });

  test("when both primary and fallback fail, error is logged after two attempts", async () => {
    const rcDefaultMock = jest
      .fn()
      .mockRejectedValue(new Error("Load failed"));
    (rc as any).default = rcDefaultMock;

    const errorMock = jest.fn();
    jest.spyOn(console, "error").mockImplementation(errorMock);

    rive.RuntimeLoader.getInstance(() => {});

    await waitForPredicate(() => errorMock.mock.calls.length > 0);

    expect(rcDefaultMock).toHaveBeenCalledTimes(2);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining("Could not load Rive WASM file"),
    );
  });

  test("awaitInstance() rejects when both primary and fallback WASM URLs fail", async () => {
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    (rc as any).default = jest.fn().mockRejectedValue(new Error("Load failed"));
    await expect(rive.RuntimeLoader.awaitInstance()).rejects.toThrow(
      "Load failed",
    );
  });

  test("RuntimeLoader is retryable after WASM load failure", async () => {
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    const mockRuntime = {} as rc.RiveCanvas;

    (rc as any).default = jest
      .fn()
      .mockRejectedValueOnce(new Error("Load failed"))
      .mockResolvedValue(mockRuntime);

    // First attempt fails
    await expect(rive.RuntimeLoader.awaitInstance()).rejects.toBeInstanceOf(
      Error,
    );
    // isLoading should be reset; set a new URL and retry
    rive.RuntimeLoader.setWasmUrl("https://retry.example.com/rive.wasm");
    const runtime = await rive.RuntimeLoader.awaitInstance();
    expect(runtime).toBe(mockRuntime);
  });

  test("Rive onLoadError is called when WASM fails to load", async () => {
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    (rc as any).default = jest.fn().mockRejectedValue(new Error("Load failed"));

    const canvas = document.createElement("canvas");
    const onLoad = jest.fn();
    const onLoadError = jest.fn();
    await expect(
      loadRive({
        canvas,
        buffer: pingPongRiveFileBuffer,
        onLoadError,
        onLoad,
      }),
    ).rejects.toThrow("Load failed");
    expect(onLoadError).toHaveBeenCalledTimes(1);
    expect(onLoadError.mock.calls[0][0].data as string).toContain("Load failed");
    expect(onLoad).not.toHaveBeenCalled();
  });
});

describe("RuntimeLoader threads", () => {
  const threadsUrl = "https://threads.example.com/rive_threads.wasm";
  const threadedRuntime = {} as rc.RiveCanvas;
  const unthreadedRuntime = {} as rc.RiveCanvas;
  let saved: Record<string, unknown>;
  let warn: jest.SpyInstance;

  const isolate = (isolated: boolean) =>
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      value: isolated,
      configurable: true,
    });

  beforeEach(() => {
    const loader = rive.RuntimeLoader as any;
    saved = {
      runtime: loader.runtime,
      isLoading: loader.isLoading,
      callBackQueue: loader.callBackQueue,
      errorCallbackQueue: loader.errorCallbackQueue,
      triedThreads: loader.triedThreads,
      threadsOutcome: loader.threadsOutcome,
      threadsUrl: rive.RuntimeLoader.getWasmThreadsUrl(),
      binary: rive.RuntimeLoader.getWasmBinary(),
      rcDefault: rc.default,
      threadsDefault: threads.default,
      messageChannel: globalThis.MessageChannel,
    };
    loader.runtime = undefined;
    loader.isLoading = false;
    loader.callBackQueue = [];
    loader.errorCallbackQueue = [];
    loader.triedThreads = false;
    loader.threadsOutcome = undefined;
    rive.RuntimeLoader.setWasmThreadsUrl(threadsUrl);
    rive.RuntimeLoader.setWasmBinary(null);
    (rc as any).default = jest.fn().mockResolvedValue(unthreadedRuntime);
    (threads as any).default = jest.fn().mockResolvedValue(threadedRuntime);
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    isolate(true);
    // jsdom has none; the loader only checks that a post succeeds.
    (globalThis as any).MessageChannel = class {
      port1 = { postMessage: () => {} };
    };
  });

  afterEach(() => {
    const loader = rive.RuntimeLoader as any;
    (rc as any).default = saved.rcDefault;
    (threads as any).default = saved.threadsDefault;
    loader.runtime = saved.runtime;
    loader.isLoading = saved.isLoading;
    loader.callBackQueue = saved.callBackQueue;
    loader.errorCallbackQueue = saved.errorCallbackQueue;
    loader.triedThreads = saved.triedThreads;
    loader.threadsOutcome = saved.threadsOutcome;
    rive.RuntimeLoader.setWasmThreadsUrl(saved.threadsUrl as string | null);
    rive.RuntimeLoader.setWasmBinary(saved.binary as ArrayBuffer | null);
    delete (globalThis as any).crossOriginIsolated;
    (globalThis as any).MessageChannel = saved.messageChannel;
    jest.restoreAllMocks();
  });

  test("packages without a threaded build have no threads url", () => {
    expect(saved.threadsUrl).toBeNull();
  });

  test("an isolated page loads the threaded build from its url", async () => {
    const runtime = await rive.RuntimeLoader.awaitInstance();
    expect(runtime).toBe(threadedRuntime);
    expect(rc.default).not.toHaveBeenCalled();
    const options = (threads.default as jest.Mock).mock.calls[0][0];
    expect(options.locateFile()).toBe(threadsUrl);
    expect(warn).not.toHaveBeenCalled();
  });

  test("a page that is not isolated loads without threads and says why once", async () => {
    isolate(false);
    const runtime = await rive.RuntimeLoader.awaitInstance();
    expect(runtime).toBe(unthreadedRuntime);
    expect(threads.default).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("not cross origin isolated");
  });

  test("a threaded build that fails to load falls back to the one without threads", async () => {
    (threads as any).default = jest
      .fn()
      .mockRejectedValue(new Error("no workers"));
    const runtime = await rive.RuntimeLoader.awaitInstance();
    expect(runtime).toBe(unthreadedRuntime);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("no workers");
  });

  test("a host's own binary skips threads", async () => {
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));
    await rive.RuntimeLoader.awaitInstance();
    expect(threads.default).not.toHaveBeenCalled();
    expect(rc.default).toHaveBeenCalledTimes(1);
  });

  test("the empty module other packages bundle skips threads", async () => {
    (threads as any).default = {};
    const runtime = await rive.RuntimeLoader.awaitInstance();
    expect(runtime).toBe(unthreadedRuntime);
    expect(warn).not.toHaveBeenCalled();
  });

  test("a null threads url skips threads", async () => {
    rive.RuntimeLoader.setWasmThreadsUrl(null);
    await rive.RuntimeLoader.awaitInstance();
    expect(threads.default).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  test("parallel parts reach the scripts of the runtime that loads", async () => {
    const scripting: { parallelParts?: number | null } = {};
    (threads as any).default = jest
      .fn()
      .mockResolvedValue({ riveScripting: scripting });
    rive.RuntimeLoader.setParallelParts(4);
    await rive.RuntimeLoader.awaitInstance();
    expect(scripting.parallelParts).toBe(4);
    rive.RuntimeLoader.setParallelParts(null);
    expect(scripting.parallelParts).toBeNull();
  });

  const refusal = () => rive.RuntimeLoader.threadsRefusal();
  const refuseSharedMemory = () =>
    ((globalThis as any).MessageChannel = class {
      port1 = {
        postMessage: () => {
          throw new Error("DataCloneError");
        },
      };
    });
  const refuseWasmThreads = () =>
    jest.spyOn(WebAssembly, "validate").mockReturnValue(false);

  test("threadsRefusal is null where the threaded build can run", () => {
    expect(refusal()).toBeNull();
  });

  test("threadsRefusal names each reason the page can't run threads", () => {
    isolate(false);
    expect(refusal()).toBe("notIsolated");
    delete (globalThis as any).crossOriginIsolated;
    expect(refusal()).toBe("isolationUnsupported");
    isolate(true);
    refuseSharedMemory();
    expect(refusal()).toBe("noSharedMemory");
    delete (globalThis as any).MessageChannel;
    expect(refusal()).toBe("noSharedMemory");
    (globalThis as any).MessageChannel = class {
      port1 = { postMessage: () => {} };
    };
    refuseWasmThreads();
    expect(refusal()).toBe("noWasmThreads");
  });

  test("threadsRefusal doesn't throw on a page without WebAssembly", () => {
    const wasm = globalThis.WebAssembly;
    delete (globalThis as any).WebAssembly;
    try {
      expect(refusal()).toBe("noWasmThreads");
    } finally {
      (globalThis as any).WebAssembly = wasm;
    }
  });

  test("asking doesn't load the runtime or log", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    for (let i = 0; i < 3; i++) {
      refusal();
    }
    isolate(false);
    refusal();
    expect(rc.default).not.toHaveBeenCalled();
    expect(threads.default).not.toHaveBeenCalled();
    expect((rive.RuntimeLoader as any).isLoading).toBe(false);
    expect(warn).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test.each([
    [
      "notIsolated",
      () => isolate(false),
      "the page is not cross origin isolated",
    ],
    [
      "isolationUnsupported",
      () => delete (globalThis as any).crossOriginIsolated,
      "the page is not cross origin isolated",
    ],
    [
      "noSharedMemory",
      refuseSharedMemory,
      "the page cannot share memory with workers",
    ],
    [
      "noWasmThreads",
      refuseWasmThreads,
      "the browser cannot run wasm threads with SIMD",
    ],
  ])(
    "the loader's warning for %s keeps its words",
    async (code, refuse, words) => {
      refuse();
      expect(refusal()).toBe(code);
      await rive.RuntimeLoader.awaitInstance();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(
        `Rive is running without threads: ${words}.`,
      );
      expect(refusal()).toBe(code);
    },
  );

  test("threadsRefusal names the loader's own reasons to skip threads", () => {
    (threads as any).default = undefined;
    expect(refusal()).toBe("noThreadedBuild");
    (threads as any).default = {};
    expect(refusal()).toBe("noThreadedBuild");
    (threads as any).default = jest.fn();
    rive.RuntimeLoader.setWasmThreadsUrl(null);
    expect(refusal()).toBe("threadsOff");
    rive.RuntimeLoader.setWasmThreadsUrl(threadsUrl);
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));
    expect(refusal()).toBe("wasmBinary");
  });

  test("a threaded build that fails to load is the answer after load", async () => {
    (threads as any).default = jest
      .fn()
      .mockRejectedValue(new Error("no workers"));
    expect(refusal()).toBeNull();
    await rive.RuntimeLoader.awaitInstance();
    expect(warn.mock.calls[0][0]).toBe(
      "Rive is running without threads: the threaded build failed to load (no workers).",
    );
    expect(refusal()).toBe("loadFailed");
  });

  test("after load the answer is what the loader did, not later settings", async () => {
    await rive.RuntimeLoader.awaitInstance();
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));
    isolate(false);
    expect(refusal()).toBeNull();
  });

  test("after an unthreaded load the answer stays its reason", async () => {
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));
    await rive.RuntimeLoader.awaitInstance();
    rive.RuntimeLoader.setWasmBinary(null);
    expect(refusal()).toBe("wasmBinary");
  });

  test("a host's binary that fails to load leaves threads for the retry", async () => {
    const fallback = rive.RuntimeLoader.getWasmFallbackUrl();
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "debug").mockImplementation(() => {});
    (rc as any).default = jest.fn().mockRejectedValue(new Error("bad binary"));
    rive.RuntimeLoader.setWasmBinary(new ArrayBuffer(8));
    try {
      await expect(rive.RuntimeLoader.awaitInstance()).rejects.toThrow();
      expect(refusal()).toBe("wasmBinary");
      rive.RuntimeLoader.setWasmBinary(null);
      expect(refusal()).toBeNull();
      expect(await rive.RuntimeLoader.awaitInstance()).toBe(threadedRuntime);
      expect(refusal()).toBeNull();
    } finally {
      rive.RuntimeLoader.setWasmFallbackUrl(fallback);
    }
  });

  test("a failed load on a page without WebAssembly rejects", async () => {
    const wasm = globalThis.WebAssembly;
    const fallback = rive.RuntimeLoader.getWasmFallbackUrl();
    rive.RuntimeLoader.setWasmFallbackUrl(null);
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "debug").mockImplementation(() => {});
    (rc as any).default = jest.fn().mockRejectedValue(new Error("no wasm"));
    delete (globalThis as any).WebAssembly;
    try {
      await expect(rive.RuntimeLoader.awaitInstance()).rejects.toThrow();
    } finally {
      (globalThis as any).WebAssembly = wasm;
      rive.RuntimeLoader.setWasmFallbackUrl(fallback);
    }
  });
});

// #endregion

// #region creating Rive objects

test("Rive objects require a src url or byte buffer", () => {
  const canvas = document.createElement("canvas");
  const badConstructor = () => {
    new rive.Rive({ canvas: canvas });
  };
  expect(badConstructor).toThrow(Error);
});

test("Rive objects initialize correctly", async () => {
  const canvas = document.createElement("canvas");
  const onLoadError = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onLoadError,
  });
  expect(r).toBeDefined();
  expect(onLoadError).not.toHaveBeenCalled();
  r.cleanup();
});

test("Corrupt riv file invokes onLoadError", async () => {
  const canvas = document.createElement("canvas");
  const onLoad = jest.fn();
  const onLoadError = jest.fn();

  await expect(
    loadRive({
      canvas: canvas,
      buffer: corruptRiveFileBuffer,
      onLoadError,
      onLoad,
    }),
  ).rejects.toThrow("Rive failed to load");
  expect(onLoadError).toHaveBeenCalledTimes(1);
  expect(onLoad).not.toHaveBeenCalled();
});

// The file's list and labels need layout and text.
testWith("layout", "text")("Rive creates a semantic tree and accessibility overlay for semantic files", async () => {
  const semanticDataBindingListsBuffer = loadFile(
    "assets/data_binding_lists.riv",
  );
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  document.body.appendChild(canvas);

  const onAdvance = jest.fn();
  try {
    const r = await loadRive({
      canvas,
      buffer: semanticDataBindingListsBuffer,
      semanticsMode: rive.SemanticMode.Enabled,
      stateMachines: "State Machine 1",
      autoplay: true,
      autoBind: true,
      onAdvance,
    });
    await waitForPredicate(() => onAdvance.mock.calls.length > 0);

    const tree = r.semanticTree;
    expect(tree?.nodeCount).toBeGreaterThan(0);
    expect(
      tree.flattened().some(({ node }) => node.label?.length > 0),
    ).toBe(true);

    const overlay = document.querySelector<HTMLElement>('[id^="rive-a11y-"]');
    expect(overlay).not.toBeNull();
    expect(overlay!.getAttribute("role")).toBe("region");
    expect(overlay!.querySelector('[id*="-sem-"]')).not.toBeNull();
    r.cleanup();
  } finally {
    canvas.remove();
  }
});

// #endregion

// #region loading files

test("Multiple files can be loaded and played", async () => {
  const canvas = document.createElement("canvas");
  type Snapshot = { isStopped: boolean; isPaused: boolean; isPlaying: boolean };
  const snapshot = (): Snapshot => ({
    isStopped: r.isStopped,
    isPaused: r.isPaused,
    isPlaying: r.isPlaying,
  });
  const loads: Snapshot[] = [];
  const plays: Snapshot[] = [];
  const loops: { loopOccurredBefore: boolean; snapshot: Snapshot }[] = [];
  const stops: { loopOccurred: boolean; snapshot: Snapshot }[] = [];
  let loopOccurred = false;

  const r: rive.Rive = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      loads.push(snapshot());
    },
    onPlay: () => {
      plays.push(snapshot());
    },
    onLoop: () => {
      loops.push({ loopOccurredBefore: loopOccurred, snapshot: snapshot() });
      loopOccurred = true;
      // After the first loop, load a new file
      if (loops.length === 1) {
        r.load({ buffer: oneShotRiveFileBuffer, autoplay: true });
      }
    },
    onStop: () => {
      stops.push({ loopOccurred, snapshot: snapshot() });
    },
  });

  await waitForPredicate(() => loads.length >= 2);

  // Each callback ran, so the checks below can't pass on empty lists.
  expect(plays.length).toBeGreaterThan(0);
  expect(loops.length).toBeGreaterThan(0);
  expect(stops.length).toBeGreaterThan(0);
  // Both loads left the instance playing
  for (const l of loads) {
    expect(l.isStopped).toBeFalsy();
    expect(l.isPlaying).toBeTruthy();
  }
  // We expect things to start playing shortly after load
  for (const pl of plays) {
    expect(pl.isStopped).toBeFalsy();
    expect(pl.isPaused).toBeFalsy();
    expect(pl.isPlaying).toBeTruthy();
  }
  expect(loops[0].loopOccurredBefore).toBeFalsy();
  expect(loops[0].snapshot.isPlaying).toBeTruthy();
  for (const st of stops) {
    expect(st.snapshot.isStopped).toBeTruthy();
    expect(st.snapshot.isPlaying).toBeFalsy();
    expect(st.loopOccurred).toBeTruthy();
  }
  r.cleanup();
});

test("Layout is set to canvas dimensions if not specified", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;

  const r = await loadRive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
  });
  expect(r.layout.minX).toBe(0);
  expect(r.layout.minY).toBe(0);
  expect(r.layout.maxX).toBe(400);
  expect(r.layout.maxY).toBe(300);
  r.cleanup();
});

test("enableInkbleed loads normally and reports inkbleed off on a renderer without inkbleed", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    enableInkbleed: true,
  });
  expect(r.inkbleed).toBe(false);
  r.inkbleed = true;
  // The canvas build doesn't support inkbleed, so it stays false.
  expect(r.inkbleed).toBe(false);
  r.cleanup();
});

// #endregion

// #region Rive properties

test("Rive file contents can be read", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
  });
  const contents = r.contents;
  expect(contents).toBeDefined();
  expect(contents.artboards).toBeDefined();
  expect(contents.artboards).toHaveLength(2);
  expect(contents.artboards[0].name).toBe("MyArtboard");
  expect(contents.artboards[1].name).toBe("Artboard2");
  expect(contents.artboards[0].animations).toBeDefined();
  expect(contents.artboards[0].animations).toHaveLength(6);
  expect(contents.artboards[0].animations[0]).toBe(
    "WorkAreaPingPongAnimation",
  );
  expect(contents.artboards[0].stateMachines).toBeDefined();
  expect(contents.artboards[0].stateMachines).toHaveLength(1);
  expect(contents.artboards[0].stateMachines[0].name).toBe("StateMachine");
  expect(contents.artboards[0].stateMachines[0].inputs).toHaveLength(3);
  expect(contents.artboards[0].stateMachines[0].inputs[0].name).toBe(
    "MyNum",
  );
  expect(contents.artboards[0].stateMachines[0].inputs[0].type).toBe(
    rive.StateMachineInputType.Number,
  );
  expect(contents.artboards[0].stateMachines[0].inputs[1].name).toBe(
    "MyBool",
  );
  expect(contents.artboards[0].stateMachines[0].inputs[1].type).toBe(
    rive.StateMachineInputType.Boolean,
  );
  expect(contents.artboards[0].stateMachines[0].inputs[2].name).toBe(
    "MyTrig",
  );
  expect(contents.artboards[0].stateMachines[0].inputs[2].type).toBe(
    rive.StateMachineInputType.Trigger,
  );
  r.cleanup();
});

// #endregion

// #region resetting

test("Artboards can be reset back to their starting state", async () => {
  const canvas = document.createElement("canvas");

  // Track the nr of loops
  let loopCount = 0;
  const loads: { artboard: string; loopCount: number }[] = [];

  // Start up a looping animation
  const r: rive.Rive = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      loads.push({ artboard: r.activeArtboard, loopCount });
    },
    onLoop: () => {
      if (loopCount == 0) {
        // Reset the animation; animation should continue to play
        r.reset({ autoplay: true });
      }
      loopCount++;
    },
  });

  await waitForPredicate(() => loopCount >= 2, 4000);

  expect(loads.length).toBeGreaterThan(0);
  // Default artboard should be selected
  expect(loads[0].artboard).toBe("New Artboard");
  // Loading only happens before the first loop, reset included
  loads.forEach((load) => expect(load.loopCount).toBe(0));
  r.cleanup();
});

// #endregion

// #region cleanup

test("Rive deletes instances on the cleanup", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.activeArtboard).toBe("MyArtboard");
  r.cleanup();
  expect(r.activeArtboard).toBe("");
  expect(r["renderer"]).toBeNull();
});

test("Rive doesn't error out when cleaning up if the file is not set yet", () => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  r.cleanup();
});

test("Rive renderer is deleted on deleteRiveRenderer", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.activeArtboard).toBe("MyArtboard");
  r.cleanup();
  r.deleteRiveRenderer();
  expect(r["renderer"]).toBe(null);
});

test("Two Rive renderers can be deleted in reverse order", async () => {
  const canvas1 = document.createElement("canvas");
  const canvas2 = document.createElement("canvas");
  let r1: rive.Rive,
    r2: rive.Rive,
    r1DrawCountWithR2Stopped = 0,
    r2DrawCount = 0,
    cleanedUp = false;
  r1 = new rive.Rive({
    canvas: canvas1,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
    onAdvance: (event: rive.Event) => {
      if (cleanedUp) return;
      // Draw until r2 has stopped for a while (make sure we have the final draw).
      if (r2 && r2.isStopped) ++r1DrawCountWithR2Stopped;
      if (r1DrawCountWithR2Stopped >= 3) {
        // Cleanup in reverse order.
        cleanedUp = true;
        r2.cleanup();
        r2.deleteRiveRenderer();
        r1.cleanup();
        r1.deleteRiveRenderer();
      }
    },
  });
  r2 = new rive.Rive({
    canvas: canvas2,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onAdvance: (event: rive.Event) => {
      ++r2DrawCount;
      if (r2DrawCount >= 3) r2.stop();
    },
  });

  await waitForPredicate(() => cleanedUp);
  expect(r2["renderer"]).toBe(null);
  expect(r1["renderer"]).toBe(null);
});

test("Rive deletes rive file instance on the cleanup", async () => {
  const canvas = document.createElement("canvas");
  const riveFile = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
  });
  await riveFile.init();

  const r = await loadRive({
    canvas: canvas,
    riveFile: riveFile,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(r.activeArtboard).toBe("MyArtboard");
  expect(riveFile.referenceCount).toBe(1);
  r.cleanup();
  expect(riveFile.referenceCount).toBe(0);
});

test("one RiveFile with immediate renderer drives five instances", async () => {
  // The one-file/one-session/one-renderer rule is deferred-only: an immediate
  // file has no session, so initData skips the resolver entirely and every
  // instance just takes a reference.
  const riveFile = new rive.RiveFile({ buffer: stateMachineFileBuffer });
  await riveFile.init();

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  const instances: rive.Rive[] = [];
  try {
    for (let i = 0; i < 5; i++) {
      instances.push(
        await new Promise<rive.Rive>((resolve, reject) => {
          const inst = new rive.Rive({
            canvas: document.createElement("canvas"),
            riveFile: riveFile,
            artboard: "MyArtboard",
            autoplay: true,
            onLoad: () => resolve(inst),
            onLoadError: (e: rive.Event) =>
              reject(new Error(String(e?.data ?? "load error"))),
          });
        }),
      );
    }

    expect(instances).toHaveLength(5);
    instances.forEach((r) => expect(r.activeArtboard).toBe("MyArtboard"));
    expect(riveFile.referenceCount).toBe(5);
    // No session, so no deferred fallback and nothing to warn about.
    instances.forEach((r) => expect(r.deferredRendererActive).toBe(false));
    expect(
      warnSpy.mock.calls
        .map((c) => String(c[0]))
        .filter((m) => m.startsWith("Rive:")),
    ).toEqual([]);

    // Each instance hands its reference back independently.
    instances[0].cleanup();
    expect(riveFile.referenceCount).toBe(4);
  } finally {
    warnSpy.mockRestore();
    instances.forEach((r) => {
      try {
        r.cleanup();
      } catch {
        /* already cleaned up */
      }
    });
  }
});

// #region reload (rive.load)

/** Resolves once the instance reports a completed load. */
const loadInto = (r: rive.Rive, params: any): Promise<void> =>
  new Promise((resolve, reject) => {
    const onLoad = () => {
      r.off(rive.EventType.Load, onLoad);
      resolve();
    };
    r.on(rive.EventType.Load, onLoad);
    r.on(rive.EventType.LoadError, (e: rive.Event) =>
      reject(new Error(String(e?.data ?? "load error"))),
    );
    r.load(params);
  });

test("load() keeps a caller-supplied RiveFile usable", async () => {
  // load() gives back the reference this instance took, but must not destroy a
  // file the caller still holds: a RiveFile carries no reference for its
  // creator, so releasing here would take the last one.
  const riveFile = new rive.RiveFile({ buffer: stateMachineFileBuffer });
  await riveFile.init();

  const r = await new Promise<rive.Rive>((resolve) => {
    const inst = new rive.Rive({
      canvas: document.createElement("canvas"),
      riveFile: riveFile,
      artboard: "MyArtboard",
      autoplay: true,
      onLoad: () => resolve(inst),
    });
  });
  expect(riveFile.referenceCount).toBe(1);

  await loadInto(r, {
    buffer: loopRiveFileBuffer,
    autoplay: true,
  });

  // The instance moved on, and the caller's file survived it.
  expect((riveFile as any).destroyed).toBe(false);

  // Known cost of that: reload does not hand back the reference getInstance()
  // took, because doing so would drop a caller-supplied file to zero and
  // destroy it. The count stays inflated until the caller cleans up
  expect(riveFile.referenceCount).toBe(1);

  // Still usable: a fresh instance can load it again.
  const second = await new Promise<rive.Rive>((resolve, reject) => {
    const inst = new rive.Rive({
      canvas: document.createElement("canvas"),
      riveFile: riveFile,
      artboard: "MyArtboard",
      autoplay: true,
      onLoad: () => resolve(inst),
      onLoadError: (e: rive.Event) =>
        reject(new Error(String(e?.data ?? "load error"))),
    });
  });
  expect(second.activeArtboard).toBe("MyArtboard");

  r.cleanup();
  second.cleanup();
});

test("load() with no source throws before stopping playback", async () => {
  const r = await new Promise<rive.Rive>((resolve) => {
    const inst = new rive.Rive({
      canvas: document.createElement("canvas"),
      buffer: stateMachineFileBuffer,
      artboard: "MyArtboard",
      autoplay: true,
      onLoad: () => resolve(inst),
    });
  });
  expect(r.isPlaying).toBe(true);

  expect(() => r.load({})).toThrow();

  // The bad call must leave the running instance untouched.
  expect(r.isPlaying).toBe(true);
  expect(r.activeArtboard).toBe("MyArtboard");

  r.cleanup();
});

// #endregion

test("Cleaning up file before load does not reduce reference count", async () => {
  const canvas = document.createElement("canvas");
  const riveFile = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
  });
  await riveFile.init();
  const r = new rive.Rive({
    canvas: canvas,
    riveFile: riveFile,
    autoplay: true,
    artboard: "MyArtboard",
  });
  expect(riveFile.referenceCount).toBe(0);
  r.cleanup();
  expect(riveFile.referenceCount).toBe(0);
});

// #endregion

// #region sizing the canvas

describe("resizeDrawingSurfaceToCanvas", () => {
  const savedDevicePixelRatio = window.devicePixelRatio;

  // jest.restoreAllMocks() in the top-level afterEach restores the spy.
  const mockCanvasRect500AtDpr3 = () => {
    jest
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 500, height: 500 } as DOMRect);
    window.devicePixelRatio = 3;
  };

  afterEach(() => {
    window.devicePixelRatio = savedDevicePixelRatio;
  });

  test("resizeDrawingSurfaceToCanvas scales canvas with devicePixelRatio by default", async () => {
    mockCanvasRect500AtDpr3();
    const canvas = document.createElement("canvas");
    canvas.style.width = "500px";
    canvas.style.height = "500px";
    canvas.width = 500;
    canvas.height = 500;
    const r = await loadRive({
      canvas: canvas,
      buffer: pingPongRiveFileBuffer,
    });
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
    r.resizeDrawingSurfaceToCanvas();
    console.log(canvas.getBoundingClientRect());
    expect(canvas.width).toBe(1500);
    expect(canvas.height).toBe(1500);
    r.cleanup();
  });

  test("resizeDrawingSurfaceToCanvas scales canvas with passed in ratio if present", async () => {
    mockCanvasRect500AtDpr3();
    const canvas = document.createElement("canvas");
    canvas.style.width = "500px";
    canvas.style.height = "500px";
    canvas.width = 500;
    canvas.height = 500;
    const r = await loadRive({
      canvas: canvas,
      buffer: pingPongRiveFileBuffer,
    });
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
    r.resizeDrawingSurfaceToCanvas(1);
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
    r.cleanup();
  });
});

// #endregion

// #region renderer creation errors

describe("makeRenderer checks", () => {
  let runtime: rc.RiveCanvas;

  beforeEach(async () => {
    runtime = await rive.RuntimeLoader.awaitInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("onLoadError is called when makeRenderer returns null", async () => {
    jest.spyOn(runtime, "makeRenderer").mockReturnValue(null);

    const canvas = document.createElement("canvas");
    const onLoad = jest.fn();
    const onLoadError = jest.fn();
    await expect(
      loadRive({ canvas, buffer: pingPongRiveFileBuffer, onLoadError, onLoad }),
    ).rejects.toThrow("Rive failed to load");
    expect(onLoadError.mock.calls[0][0].data as string).not.toBeNull();
    // onLoad should not be called when makeRenderer returns null
    expect(onLoad).not.toHaveBeenCalled();
  });

  test("onLoadError is called when makeRenderer throws", async () => {
    jest.spyOn(runtime, "makeRenderer").mockImplementation(() => {
      throw new Error("WebGL context creation failed");
    });

    const canvas = document.createElement("canvas");
    const onLoad = jest.fn();
    const onLoadError = jest.fn();
    await expect(
      loadRive({ canvas, buffer: pingPongRiveFileBuffer, onLoadError, onLoad }),
    ).rejects.toThrow("Rive failed to load");
    expect(onLoadError.mock.calls[0][0].data as string).not.toBeNull();
    // onLoad should not be called when makeRenderer throws
    expect(onLoad).not.toHaveBeenCalled();
  });
});

// #endregion
