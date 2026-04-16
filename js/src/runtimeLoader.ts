import * as rc from "./rive_advanced.mjs";
import packageData from "package.json";

// Callback type when looking for a runtime instance
export type RuntimeCallback = (rive: rc.RiveCanvas) => void;

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

  // Class is never instantiated
  private constructor() {}

  /**
   * When true, performance.mark / performance.measure entries are emitted for
   * WASM initialization.
   */
  public static enablePerfMarks: boolean = false;

  // Loads the runtime
  private static loadRuntime(): void {
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
      .then((rive: rc.RiveCanvas) => {
        if (RuntimeLoader.enablePerfMarks) {
          performance.mark('rive:wasm-init:end');
          performance.measure('rive:wasm-init', 'rive:wasm-init:start', 'rive:wasm-init:end');
        }
        RuntimeLoader.runtime = rive;
        // Fire all the callbacks
        while (RuntimeLoader.callBackQueue.length > 0) {
          RuntimeLoader.callBackQueue.shift()?.(RuntimeLoader.runtime);
        }
      })
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
          RuntimeLoader.loadRuntime();
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
            "3. Call RuntimeLoader.loadRuntime() again",
          ].join("\n");

          console.error(errorMessage);
        }
      });
  }

  // Provides a runtime instance via a callback
  public static getInstance(callback: RuntimeCallback): void {
    // If it's not loading, start loading runtime
    if (!RuntimeLoader.isLoading) {
      RuntimeLoader.isLoading = true;
      RuntimeLoader.loadRuntime();
    }
    if (!RuntimeLoader.runtime) {
      RuntimeLoader.callBackQueue.push(callback);
    } else {
      callback(RuntimeLoader.runtime);
    }
  }

  // Provides a runtime instance via a promise
  public static awaitInstance(): Promise<rc.RiveCanvas> {
    return new Promise<rc.RiveCanvas>((resolve) =>
      RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => resolve(rive)),
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
