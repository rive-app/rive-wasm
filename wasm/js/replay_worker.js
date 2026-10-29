// Threads build only. A page whose canvases can move to a worker records each
// frame on its own thread while one replay worker, shared by every instance,
// draws the previous one.
if (ENVIRONMENT_IS_PTHREAD) {
  // Runs once on the replay worker, before it takes any canvas or image.
  Module["riveReplayWorkerListen"] = function () {
    // Each transferred canvas, by the surface that draws it until the page
    // lets go of the canvas.
    const canvases = new Map();
    let enableMSAA = null;

    // Mirrors the page's probe, which the worker can no longer ask.
    function canvasAntialiasPreferred() {
      if (enableMSAA === null) {
        const gl = new OffscreenCanvas(1, 1).getContext(
          "webgl2",
          riveContextAttributes(true, false),
        );
        enableMSAA = !!gl && riveCanvasAntialiasPreferred(gl);
        const loseContext = gl && gl.getExtension("WEBGL_lose_context");
        loseContext && loseContext.loseContext();
      }
      return enableMSAA;
    }

    function attach(message) {
      const canvas = message["canvas"];
      const surface = message["surface"];
      const width = message["width"];
      const height = message["height"];
      const inkbleed = message["inkbleed"];
      canvases.set(surface, canvas);
      canvas.addEventListener("webglcontextlost", (event) => {
        // Lets the browser restore it.
        event.preventDefault();
        // A retired surface's address may belong to a newer one.
        canvases.get(surface) === canvas &&
          Module["_riveReplayWorkerContextLost"](surface);
      });
      canvas.addEventListener("webglcontextrestored", () => {
        canvases.get(surface) === canvas &&
          Module["_riveReplayWorkerContextRestored"](surface);
      });
      canvas.width = width;
      canvas.height = height;
      const attributes = riveContextAttributes(
        canvasAntialiasPreferred(),
        inkbleed,
      );
      const gl = canvas.getContext("webgl2", attributes);
      const handle = gl ? GL.registerContext(gl, attributes) : 0;
      if (handle) {
        GL.makeContextCurrent(handle);
      }
      Module["_riveReplayWorkerAttach"](
        surface,
        handle,
        width,
        height,
        inkbleed,
      );
    }

    // Premultiplied here, since the browser ignores
    // UNPACK_PREMULTIPLY_ALPHA_WEBGL for an ImageBitmap.
    function decodeImage(message) {
      createImageBitmap(message["blob"], {
        "premultiplyAlpha": "premultiply",
      }).then(
        (bitmap) => {
          let images = Module["images"];
          if (!images) {
            images = new Map();
            Module["images"] = images;
          }
          images.set(message["riveImage"], bitmap);
          Module["_riveReplayWorkerImageArrived"](
            message["image"],
            bitmap.width,
            bitmap.height,
          );
        },
        (error) => console.error("Rive: could not decode an image.", error),
      );
    }

    self.addEventListener("message", (event) => {
      const message = event.data;
      if (!message) {
        return;
      }
      if (message["riveCanvas"]) {
        attach(message);
      } else if (message["riveImage"]) {
        decodeImage(message);
      }
    });

    Module["riveReplayWorkerResize"] = function (surface, width, height) {
      const canvas = canvases.get(surface);
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    Module["riveReplayWorkerForget"] = function (surface) {
      canvases.delete(surface);
    };
  };
} else {
  const replayOnRuntimeInitialized = Module["onRuntimeInitialized"];
  Module["onRuntimeInitialized"] = function () {
    replayOnRuntimeInitialized && replayOnRuntimeInitialized();

    // The worker hears nothing until its listener is installed.
    const pending = [];
    let retry = 0;
    function postToWorker(message, transfer) {
      pending.push([message, transfer]);
      flushToWorker();
    }
    function flushToWorker() {
      if (!Module["_riveReplayWorkerListening"]()) {
        retry =
          retry ||
          setTimeout(() => {
            retry = 0;
            flushToWorker();
          }, 1);
        return;
      }
      const thread = PThread.pthreads[Module["_riveReplayWorkerThread"]()];
      const worker = thread && thread.worker ? thread.worker : thread;
      for (const [message, transfer] of pending) {
        worker.postMessage(message, transfer);
      }
      pending.length = 0;
    }

    let enabled = false;
    // Needs WebGL2 on an OffscreenCanvas, which the page probes for the
    // worker.
    function workerCanDraw() {
      if (
        typeof OffscreenCanvas === "undefined" ||
        typeof WeakRef === "undefined" ||
        typeof HTMLCanvasElement === "undefined" ||
        !("transferControlToOffscreen" in HTMLCanvasElement.prototype)
      ) {
        return false;
      }
      try {
        const gl = new OffscreenCanvas(1, 1).getContext("webgl2");
        const loseContext = gl && gl.getExtension("WEBGL_lose_context");
        loseContext && loseContext.loseContext();
        return !!gl;
      } catch (e) {
        return false;
      }
    }
    // Before any file imports, so its images reach the worker too.
    Module["enableReplayWorker"] = function () {
      if (!enabled && workerCanDraw()) {
        enabled = true;
        Module["_riveReplayWorkerEnable"]();
      }
      return enabled;
    };

    Module["riveReplayWorkerDecodeImage"] = function (image, imageID, blob) {
      postToWorker({ "riveImage": imageID, "image": image, "blob": blob }, []);
    };

    // A transferred canvas can never draw from the page again. Its record
    // keeps the worker's surface, and with it the GL context, for the
    // renderers that take the canvas in turn.
    const transferred = new WeakMap();
    const surfaces = new Map();
    const releaseCanvas =
      typeof FinalizationRegistry !== "undefined"
        ? new FinalizationRegistry((record) => {
            const surface = record["surface"];
            if (surface) {
              surfaces.delete(surface);
              Module["_riveReplaySurfaceRelease"](surface);
            }
          })
        : null;

    // Keyed weakly, since the callback holds the instance and its canvas.
    const restoredCallbacks = new WeakMap();
    Module["riveReplaySurfaceRestored"] = function (surface) {
      const record = surfaces.get(surface);
      const renderer =
        record && record["renderer"] && record["renderer"].deref();
      const restored = renderer && restoredCallbacks.get(renderer);
      if (restored && !renderer["isDeleted"]()) {
        restored();
      }
    };

    function sizeProperty(record, key) {
      return {
        "configurable": true,
        "enumerable": true,
        "get": () => record[key],
        "set": (value) => {
          record[key] = value >>> 0;
        },
      };
    }

    function transfer(canvas) {
      let offscreen;
      try {
        offscreen = canvas["transferControlToOffscreen"]();
      } catch (e) {
        // Already drawn into from the page.
        return null;
      }
      const record = {
        "width": canvas.width,
        "height": canvas.height,
        "offscreen": offscreen,
        "surface": 0,
      };
      // Sizing the canvas keeps working; the worker applies it to the
      // OffscreenCanvas before the next frame.
      Object.defineProperty(canvas, "width", sizeProperty(record, "width"));
      Object.defineProperty(canvas, "height", sizeProperty(record, "height"));
      transferred.set(canvas, record);
      releaseCanvas && releaseCanvas.register(canvas, record);
      return record;
    }

    function makeWorkerRenderer(canvas, record, options) {
      const inkbleed = !!(options && options["inkbleed"]);
      const width = record["width"];
      const height = record["height"];
      const renderer = Module["makeWorkerRenderer"](
        width,
        height,
        inkbleed,
        record["surface"],
      );
      renderer._canvas = canvas;
      renderer._width = width;
      renderer._height = height;
      // Weak, since the renderer holds the canvas this record outlives.
      record["renderer"] = new WeakRef(renderer);
      const restored = options && options["onContextRestored"];
      restored && restoredCallbacks.set(renderer, restored);
      if (!record["surface"]) {
        record["surface"] = renderer["surfaceRef"]();
        surfaces.set(record["surface"], record);
        const offscreen = record["offscreen"];
        record["offscreen"] = null;
        postToWorker(
          {
            "riveCanvas": 1,
            "canvas": offscreen,
            "surface": renderer["surfaceRef"](),
            "width": width,
            "height": height,
            "inkbleed": inkbleed,
          },
          [offscreen],
        );
      }
      return renderer;
    }

    const makeRenderer = Module["makeRenderer"];
    Module["makeRenderer"] = function (canvas, useOffScreenRenderer, options) {
      let record = transferred.get(canvas);
      if (
        !record &&
        enabled &&
        !useOffScreenRenderer &&
        options &&
        options["replayWorker"] &&
        canvas instanceof HTMLCanvasElement
      ) {
        record = transfer(canvas);
      }
      return record
        ? makeWorkerRenderer(canvas, record, options)
        : makeRenderer(canvas, useOffScreenRenderer, options);
    };

    const workerRenderer = Module["WebGL2WorkerRenderer"]["prototype"];
    const cppClear = workerRenderer["clear"];
    workerRenderer["clear"] = function () {
      riveSyncRendererSize(this);
      cppClear.call(this);
    };
    // It can only draw what a deferred session records.
    workerRenderer["replaysOnWorker"] = function () {
      return true;
    };
  };
}
