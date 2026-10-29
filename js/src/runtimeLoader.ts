import * as rc from "./rive_advanced.mjs";
import * as threads from "./rive_threads.mjs";
import packageData from "package.json";

// Callback type when looking for a runtime instance
export type RuntimeCallback = (rive: rc.RiveCanvas) => void;

// A module with a shared memory, an atomic load and a SIMD constant.
const threadsProbe = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x09, 0x02, 0x60, 0x00,
  0x01, 0x7f, 0x60, 0x00, 0x01, 0x7b, 0x03, 0x03, 0x02, 0x00, 0x01, 0x05, 0x04,
  0x01, 0x03, 0x01, 0x01, 0x0a, 0x1f, 0x02, 0x08, 0x00, 0x41, 0x00, 0xfe, 0x10,
  0x02, 0x00, 0x0b, 0x14, 0x00, 0xfd, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0b,
]);

// Null when this page can run the threaded build, else why not. A page that
// is not isolated gets no shared memory, and the threaded build never loads.
function threadsRefusal(): string | null {
  if (globalThis.crossOriginIsolated !== true) {
    return "the page is not cross origin isolated";
  }
  try {
    new MessageChannel().port1.postMessage(new SharedArrayBuffer(1));
  } catch {
    return "the page cannot share memory with workers";
  }
  if (!WebAssembly.validate(threadsProbe)) {
    return "the browser cannot run wasm threads with SIMD";
  }
  return null;
}

// Runtime singleton; use getInstance to provide a callback that returns the
// Rive runtime
export class RuntimeLoader {
  // Singleton helpers
  private static runtime: rc.RiveCanvas;
  // Flag to indicate that loading has started/completed
  private static isLoading = false;
  // List of callbacks for the runtime that come in while loading
  private static callBackQueue: RuntimeCallback[] = [];
  // Instance of the Rive runtime
  private static rive: rc.RiveCanvas;
  // Path to the Wasm file; default path works for testing only;
  // if embedded wasm is used then this is never used.
  private static wasmURL = `https://unpkg.com/${packageData.name}@${packageData.version}/rive.wasm`;

  // Fallback WASM URL tried when the primary URL fails. Set to null to disable
  // the fallback entirely. Defaults to pulling from the jsdelivr CDN.
  private static wasmFallbackURL: string | null = `https://cdn.jsdelivr.net/npm/${packageData.name}@${packageData.version}/rive_fallback.wasm`;

  private static wasmBinary: ArrayBuffer | null = null;

  // The threaded build's wasm, tried first on a page that can run it. Null
  // in packages without one, or to stay on the build without threads.
  private static wasmThreadsURL: string | null =
    typeof threads.default === "function"
      ? `https://unpkg.com/${packageData.name}@${packageData.version}/rive_threads.wasm`
      : null;

  private static triedThreads = false;

  // The parts a script's parallel call gets on the threaded build, or null
  // for the runtime's default.
  private static parallelParts: number | null = null;
  // Whether a threaded runtime replays deferred frames on a worker.
  private static replayWorker = true;

  // Error callbacks enqueued from .getInstance()
  private static errorCallbackQueue: ((error: Error) => void)[] = [];

  // Class is never instantiated
  private constructor() {}

  /**
   * When true, performance.mark / performance.measure entries are emitted for
   * WASM initialization.
   */
  public static enablePerfMarks: boolean = false;

  // Rejects all pending awaitInstance() promises and resets loading state so
  // the next call to getInstance() / awaitInstance() can retry with a new URL.
  private static notifyError(error: Error): void {
    RuntimeLoader.isLoading = false;
    while (RuntimeLoader.errorCallbackQueue.length > 0) {
      RuntimeLoader.errorCallbackQueue.shift()?.(error);
    }
    RuntimeLoader.callBackQueue = [];
  }

  private static loaded(rive: rc.RiveCanvas): void {
    if (RuntimeLoader.enablePerfMarks) {
      performance.mark('rive:wasm-init:end');
      performance.measure('rive:wasm-init', 'rive:wasm-init:start', 'rive:wasm-init:end');
    }
    RuntimeLoader.runtime = rive;
    RuntimeLoader.applyParallelParts();
    RuntimeLoader.errorCallbackQueue = [];
    // Before any callback can import a file, so its images reach the worker.
    if (RuntimeLoader.replayWorker) {
      rive.enableReplayWorker?.();
    }
    // Fire all the callbacks
    while (RuntimeLoader.callBackQueue.length > 0) {
      RuntimeLoader.callBackQueue.shift()?.(RuntimeLoader.runtime);
    }
  }

  // Loads the runtime, threaded once per page where it can be, and otherwise
  // without threads.
  private static loadRuntime(): void {
    // Other packages bundle an empty module here, which webpack's interop
    // hands over as an object rather than undefined.
    const threaded = threads.default;
    const threadsUrl = RuntimeLoader.wasmThreadsURL;
    // A host's own binary is a build without threads.
    if (
      typeof threaded !== "function" ||
      threadsUrl === null ||
      RuntimeLoader.wasmBinary !== null ||
      RuntimeLoader.triedThreads
    ) {
      RuntimeLoader.loadUnthreaded();
      return;
    }
    RuntimeLoader.triedThreads = true;
    const refusal = threadsRefusal();
    if (refusal !== null) {
      console.warn(`Rive is running without threads: ${refusal}.`);
      RuntimeLoader.loadUnthreaded();
      return;
    }
    if (RuntimeLoader.enablePerfMarks) performance.mark('rive:wasm-init:start');
    // Not a catch, which would also take a throw from a callback.
    threaded({ locateFile: () => threadsUrl }).then(
      RuntimeLoader.loaded,
      (error) => {
        console.warn(
          `Rive is running without threads: the threaded build failed to load (${error?.message ?? error}).`,
        );
        RuntimeLoader.loadUnthreaded();
      },
    );
  }

  private static loadUnthreaded(): void {
    // Capture the URL at call time so the catch closure always refers to the
    // URL this particular attempt used, even if wasmURL is mutated for a retry.
    const attemptedUrl = RuntimeLoader.wasmURL;
    const wasmBinary = RuntimeLoader.wasmBinary;
    if (RuntimeLoader.enablePerfMarks) performance.mark('rive:wasm-init:start');
    rc.default({
      // Loads Wasm bundle
      locateFile: () => attemptedUrl,
      ...(wasmBinary ? { wasmBinary } : {})
    })
      .then(RuntimeLoader.loaded)
      .catch((error) => {
        // Capture specific error details
        const errorDetails = {
          message: error?.message || "Unknown error",
          type: error?.name || "Error",
          // Some browsers may provide additional WebAssembly-specific details
          wasmError:
            error instanceof WebAssembly.CompileError ||
            error instanceof WebAssembly.RuntimeError,
          originalError: error,
        };

        // Log detailed error for debugging
        console.debug("Rive WASM load error details:", errorDetails);

        // In case the primary URL fails, or the wasm was not supported, try the
        // fallback URL (a rive_fallback.wasm compiled for older architectures).
        // The fallback can be customised or disabled via setWasmFallbackUrl().
        // TODO: (Gordon): preemptively test browser support and load the correct wasm file. Then use the fallback only if the primary fails.
        const fallbackUrl = RuntimeLoader.wasmFallbackURL;
        const alreadyOnFallback =
          fallbackUrl !== null &&
          attemptedUrl.toLowerCase() === fallbackUrl.toLowerCase();

        if (fallbackUrl !== null && !alreadyOnFallback) {
          console.warn(
            `Failed to load WASM from ${attemptedUrl} (${errorDetails.message}), trying fallback URL: ${fallbackUrl}`,
          );
          // Clear wasmBinary so the retry actually fetches via locateFile
          // instead of re-using the same (failing) in-memory binary.
          RuntimeLoader.wasmBinary = null;
          RuntimeLoader.setWasmUrl(fallbackUrl);
          RuntimeLoader.loadUnthreaded();
        } else {
          // When alreadyOnFallback is true, wasmURL has already been overwritten
          // with the fallback URL, so we can no longer recover the original
          // primary URL here. The primary URL was logged in the earlier warning.
          const triedUrls = alreadyOnFallback
            ? `the configured WASM URL or its fallback (${fallbackUrl})`
            : attemptedUrl;
          const errorMessage = [
            `Could not load Rive WASM file from ${triedUrls}.`,
            "Possible reasons:",
            "- Network connection is down",
            "- WebAssembly is not supported in this environment",
            "- The WASM file is corrupted or incompatible",
            "\nError details:",
            `- Type: ${errorDetails.type}`,
            `- Message: ${errorDetails.message}`,
            `- WebAssembly-specific error: ${errorDetails.wasmError}`,
            "\nTo resolve, you may need to:",
            "1. Check your network connection",
            "2. Set a new WASM source via RuntimeLoader.setWasmUrl()",
            "3. Call RuntimeLoader.awaitInstance() again",
          ].join("\n");

          console.error(errorMessage);
          RuntimeLoader.notifyError(new Error(errorMessage));
        }
      });
  }

  // Provides a runtime instance via a callback
  public static getInstance(callback: RuntimeCallback, onError?: (error: Error) => void): void {
    // If it's not loading, start loading runtime
    if (!RuntimeLoader.isLoading) {
      RuntimeLoader.isLoading = true;
      RuntimeLoader.loadRuntime();
    }
    if (!RuntimeLoader.runtime) {
      RuntimeLoader.callBackQueue.push(callback);
      if (onError) {
        RuntimeLoader.errorCallbackQueue.push(onError);
      }
    } else {
      callback(RuntimeLoader.runtime);
    }
  }

  // Provides a runtime instance via a promise; rejects if WASM fails to load.
  public static awaitInstance(): Promise<rc.RiveCanvas> {
    return new Promise<rc.RiveCanvas>((resolve, reject) =>
      RuntimeLoader.getInstance(resolve, reject),
    );
  }

  // Manually sets the wasm url
  public static setWasmUrl(url: string): void {
    RuntimeLoader.wasmURL = url;
  }

  // Gets the current wasm url
  public static getWasmUrl(): string {
    return RuntimeLoader.wasmURL;
  }

  /**
   * Sets the URL used as a fallback when the primary WASM URL fails to load.
   * Pass `null` to disable the fallback entirely.
   *
   * Defaults to pulling from the jsdelivr CDN.
   */
  public static setWasmFallbackUrl(url: string | null): void {
    RuntimeLoader.wasmFallbackURL = url;
  }

  // Gets the current fallback wasm url (null means fallback is disabled)
  public static getWasmFallbackUrl(): string | null {
    return RuntimeLoader.wasmFallbackURL;
  }

  /**
   * Sets the URL of the threaded build's wasm, which
   * `@rive-app/webgl2-threads` loads on a cross origin isolated page. Pass
   * `null` to always load the build without threads. Other packages have no
   * threaded build and ignore it.
   *
   * Defaults to pulling from the unpkg CDN.
   */
  public static setWasmThreadsUrl(url: string | null): void {
    RuntimeLoader.wasmThreadsURL = url;
  }

  // Gets the threaded build's wasm url (null means threads are off)
  public static getWasmThreadsUrl(): string | null {
    return RuntimeLoader.wasmThreadsURL;
  }

  /**
   * Sets how many parts a script's parallel call gets on a page that runs
   * the threaded build, the page's thread and one worker thread for each
   * other part. 1 turns parallel calls off, and null leaves the runtime's
   * default of one part per core, up to 8. Set it before the first file
   * loads.
   */
  public static setParallelParts(parts: number | null): void {
    RuntimeLoader.parallelParts = parts;
    RuntimeLoader.applyParallelParts();
  }

  // Gets the parts set with setParallelParts (null means the default)
  public static getParallelParts(): number | null {
    return RuntimeLoader.parallelParts;
  }

  private static applyParallelParts(): void {
    const scripting = (
      RuntimeLoader.runtime as unknown as
        | { riveScripting?: { parallelParts?: number | null } }
        | undefined
    )?.riveScripting;
    if (scripting) {
      scripting.parallelParts = RuntimeLoader.parallelParts;
    }
  }

  /**
   * @experimental When the threaded build loads, instances with
   * `enableGPUCanvas` hand their canvas to one worker that replays every
   * instance's frames while the page records the next ones. Pass `false`
   * before the runtime loads to keep replay on the page's thread; a single
   * instance can opt out with `useReplayWorker: false`. Pages where the
   * browser cannot draw WebGL2 on a transferred canvas stay on the page's
   * thread regardless.
   *
   * True by default.
   */
  public static setReplayWorker(enabled: boolean): void {
    RuntimeLoader.replayWorker = enabled;
  }

  // Gets whether a threaded runtime may replay on a worker
  public static getReplayWorker(): boolean {
    return RuntimeLoader.replayWorker;
  }

  // Manually sets the wasm binary or clears it with null
  public static setWasmBinary(value: ArrayBuffer | null): void {
    if ((value instanceof ArrayBuffer) || value === null) {
      RuntimeLoader.wasmBinary = value;
      return;
    }
    console.error("setWasmBinary expects an ArrayBuffer or null");
  }

  // Gets the current wasm build as ArrayBuffer or null
  public static getWasmBinary(): ArrayBuffer | null {
    return RuntimeLoader.wasmBinary;
  }
}
