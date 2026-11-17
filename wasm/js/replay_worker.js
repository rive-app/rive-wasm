// Threads build only. A page whose canvases can move to a worker records each
// frame on its own thread while one replay worker, shared by every instance,
// draws the previous one.

// Chromium and WebKit keep at most 4 WebGL contexts alive on a worker, and no
// API reports it; past that they lose the oldest, so further canvases replay
// on the page.
const MAX_REPLAY_WORKER_CANVASES = 4;

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

    // A context of our own, with the attributes a canvas would get, measures
    // the caps scripts read before any canvas arrives.
    // The antialias probe's context is reused when the canvases will match it,
    // since WebKit holds a lost context against the worker's limit until GC.
    function probeCaps() {
      let gl = null;
      let handle = 0;
      try {
        const antialiased = riveContextAttributes(true, false);
        gl = new OffscreenCanvas(1, 1).getContext("webgl2", antialiased);
        if (enableMSAA === null) {
          enableMSAA = !!gl && riveCanvasAntialiasPreferred(gl);
        }
        let attributes = antialiased;
        if (!enableMSAA) {
          const loseContext = gl && gl.getExtension("WEBGL_lose_context");
          loseContext && loseContext.loseContext();
          attributes = riveContextAttributes(false, false);
          gl = new OffscreenCanvas(1, 1).getContext("webgl2", attributes);
        }
        handle = gl ? GL.registerContext(gl, attributes) : 0;
      } catch (e) {
        handle = 0;
      }
      Module["_riveReplayWorkerProbeCaps"](handle);
      // Unregistering leaves the context alive until GC.
      const loseContext = gl && gl.getExtension("WEBGL_lose_context");
      loseContext && loseContext.loseContext();
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
      } else if (message["riveProbeCaps"]) {
        probeCaps();
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

    // Chrome slows a page's animation frames while the page repaints nothing,
    // and a page whose canvases draw on the replay worker repaints nothing. A
    // worker's frames keep the display's rate, so one that does nothing else
    // paces those canvases while its frames outrun the page's. A worker
    // without frames never answers.
    const frameWorkerSource =
      "let r=0;self.requestAnimationFrame&&(onmessage=()=>{r=r||" +
      "requestAnimationFrame((t)=>{r=0;postMessage(performance.timeOrigin+t)})})";
    // Out of view the page's frames stop and the worker's do not.
    const maxFramesPerPageFrame = 16;
    // Frames the worker must gain on the page to pace, and lose to stop.
    const maxLead = 4;
    // Page frames the comparison goes on after its last caller.
    const comparedFrames = 2;
    // Null once it could not start.
    let frameWorker;
    let frameCallback = null;
    let frameAsked = false;
    let workerPaces = false;
    let lead = 0;
    let comparing = 0;
    let pageFrame = 0;
    // Stale after a pause.
    let framesComparable = false;
    // A worker frame from before it is stale.
    let lastFrameTime = 0;
    // The worker is asked nothing before the page's next frame.
    let framesSincePageFrame = maxFramesPerPageFrame;
    function askFrame() {
      if (!frameAsked && framesSincePageFrame < maxFramesPerPageFrame) {
        frameAsked = true;
        frameWorker.postMessage(0);
      }
    }
    function watchPage() {
      if (!pageFrame) {
        pageFrame = requestAnimationFrame(onPageFrame);
        framesComparable = false;
        // The page may have left the view since its last frame.
        framesSincePageFrame = maxFramesPerPageFrame;
      }
    }
    function runFrame(time) {
      const callback = frameCallback;
      frameCallback = null;
      lastFrameTime = time;
      callback(time);
    }
    function onWorkerFrame(event) {
      frameAsked = false;
      ++framesSincePageFrame;
      if (!workerPaces) {
        comparing && askFrame();
      } else if (
        frameCallback &&
        // A frame asked for before a pause arrives after it.
        framesSincePageFrame <= maxFramesPerPageFrame
      ) {
        // The worker's clock started after the page's.
        const time = event.data - performance.timeOrigin;
        time > lastFrameTime ? runFrame(time) : askFrame();
      }
    }
    function onPageFrame(time) {
      pageFrame = 0;
      const frames = framesSincePageFrame;
      const waited = frames >= maxFramesPerPageFrame;
      framesSincePageFrame = 0;
      // A page whose frames stopped says nothing of the worker's rate.
      if (framesComparable && !waited) {
        // One late page frame is not a slower page: a frame gains 1 at most.
        lead = Math.max(Math.min(lead + Math.min(frames - 1, 1), maxLead), -maxLead);
        if (lead == -maxLead) {
          workerPaces = false;
        } else if (lead == maxLead && !workerPaces) {
          workerPaces = true;
          // The page's callers draw this frame.
          lastFrameTime = time;
        }
      }
      framesComparable = true;
      comparing && --comparing;
      const callback = frameCallback && (waited || !workerPaces);
      if (frameCallback || comparing) {
        pageFrame = requestAnimationFrame(onPageFrame);
      }
      callback && runFrame(time);
    }
    function startFrameWorker() {
      if (frameWorker !== undefined) {
        return;
      }
      frameWorker = null;
      try {
        frameWorker = new Worker(
          URL.createObjectURL(
            new Blob([frameWorkerSource], { "type": "text/javascript" }),
          ),
        );
      } catch (e) {
        // The page's policy forbids it; its own frames go on pacing.
        return;
      }
      frameWorker.onmessage = onWorkerFrame;
      riveWorkerFrames = {
        // Asking keeps the two rates compared.
        paces: () => {
          comparing = comparedFrames;
          watchPage();
          workerPaces || askFrame();
          return workerPaces;
        },
        request: (callback) => {
          frameCallback = callback;
          watchPage();
          askFrame();
          return 1;
        },
        cancel: () => {
          frameCallback = null;
        },
      };
    }

    let enabled = false;
    let replayCaps = null;
    let replayCapsArrived = null;
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
        replayCaps = new Promise((resolve) => {
          replayCapsArrived = resolve;
        });
        postToWorker({ "riveProbeCaps": 1 }, []);
      }
      return enabled;
    };

    // Settles once the worker's caps have reached the page, or undefined when
    // nothing replays on the worker.
    Module["awaitReplayCaps"] = function () {
      return replayCaps || undefined;
    };
    Module["riveReplayCapsArrived"] = function () {
      replayCapsArrived && replayCapsArrived();
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
      startFrameWorker();
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
        canvas instanceof HTMLCanvasElement &&
        surfaces.size < MAX_REPLAY_WORKER_CANVASES
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
