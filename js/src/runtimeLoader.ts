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

  // Class is never instantiated
  private constructor() {}

  /**
   * When true, performance.mark / performance.measure entries are emitted for
   * WASM initialization.
   */
  public static enablePerfMarks: boolean = false;

  // Loads the runtime
  private static loadRuntime(): void {
    if (RuntimeLoader.enablePerfMarks) performance.mark('rive:wasm-init:start');
    rc.default({
      // Loads Wasm bundle
      locateFile: () => RuntimeLoader.wasmURL,
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

        // In case unpkg fails, or the wasm was not supported, we try to load the fallback module from jsdelivr.
        // This `rive_fallback.wasm` is compiled to support older architecture.
        // TODO: (Gordon): preemptively test browser support and load the correct wasm file. Then use jsdelvr only if unpkg fails.
        const backupJsdelivrUrl = `https://cdn.jsdelivr.net/npm/${packageData.name}@${packageData.version}/rive_fallback.wasm`;
        if (RuntimeLoader.wasmURL.toLowerCase() !== backupJsdelivrUrl) {
          console.warn(
            `Failed to load WASM from ${RuntimeLoader.wasmURL} (${errorDetails.message}), trying jsdelivr as a backup`,
          );
          RuntimeLoader.setWasmUrl(backupJsdelivrUrl);
          RuntimeLoader.loadRuntime();
        } else {
          const errorMessage = [
            `Could not load Rive WASM file from ${RuntimeLoader.wasmURL} or ${backupJsdelivrUrl}.`,
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
}
