// Frames a worker paces for the page, in a build with one that can.
let riveWorkerFrames = null;

// Manages a list of animation callbacks to be called in batch.
// Override this.onAfterCallbacks to get a call once all animation callbacks have been invoked.
function AnimationCallbackHandler() {
    let _fpsCounter = null;
    let _fpsDiv = null;

    // The callbacks waiting on one source of frames. The worker's ids are
    // negative, so cancelAnimationFrame can tell the batches apart.
    const makeBatch = (onWorker, request, cancel) => {
        const sign = onWorker ? -1 : 1;
        let mainAnimationCallbackID = 0;
        let lastAnimationSubCallbackID = 0;
        let animationSubCallbacks = new Map();

        const mainAnimationCallback = (time) => {
            // Snap off and reset the sub-callbacks first, since they might call requestAnimationFrame
            // recursively.
            const flushingSubCallbacks = animationSubCallbacks;
            mainAnimationCallbackID = 0;
            lastAnimationSubCallbackID = 0;
            animationSubCallbacks = new Map();

            // Invoke all pending animation callbacks.
            flushingSubCallbacks.forEach((callback) => {
                try {
                    callback(time);
                } catch (err) {
                    console.error(err);
                }
            });

            this.onAfterCallbacks();

            if (_fpsCounter) {
                _fpsCounter.frameComplete(onWorker);
            }
        };

        return {
            add: (callback) => {
                if (!mainAnimationCallbackID) {
                    mainAnimationCallbackID = request(mainAnimationCallback);
                }
                const id = ++lastAnimationSubCallbackID;
                animationSubCallbacks.set(id, callback);
                return sign * id;
            },
            remove: (id) => {
                animationSubCallbacks.delete(sign * id);
                if (mainAnimationCallbackID && animationSubCallbacks.size == 0) {
                    cancel(mainAnimationCallbackID);
                    mainAnimationCallbackID = 0;
                }
            },
        };
    };

    const _pageBatch = makeBatch(
            false,
            (callback) => requestAnimationFrame(callback),
            (id) => cancelAnimationFrame(id));
    const _workerBatch = makeBatch(
            true,
            (callback) => riveWorkerFrames.request(callback),
            (id) => riveWorkerFrames.cancel(id));

    // onWorker: the caller draws on a worker, so a worker's frames pace it
    // when the page's own, which slow while the page repaints nothing, lag.
    this.requestAnimationFrame = function(callback, onWorker) {
        return onWorker && riveWorkerFrames && riveWorkerFrames.paces()
                ? _workerBatch.add(callback)
                : _pageBatch.add(callback);
    }

    this.cancelAnimationFrame = function(id) {
        (id < 0 ? _workerBatch : _pageBatch).remove(id);
    }

    this.enableFPSCounter = function(fpsCallback) {
        if (_fpsDiv) {
            document.body.remove(_fpsDiv);
            _fpsDiv = null;
        }

        // If the caller didn't provide a callback, add simple div to the top right corner to dump
        // the fps.
        if (!fpsCallback) {
            _fpsDiv = document.createElement('div');
            _fpsDiv.style.backgroundColor = 'black';
            _fpsDiv.style.position = 'fixed';
            _fpsDiv.style.right = 0;
            _fpsDiv.style.top = 0;
            _fpsDiv.style.color = 'white';
            _fpsDiv.style.padding = '4px';
            _fpsDiv.innerHTML = 'RIVE FPS';
            fpsCallback = function(fps) {
                _fpsDiv.innerHTML = 'RIVE FPS ' + fps.toFixed(1);
            };
            document.body.appendChild(_fpsDiv);
        }

        _fpsCounter = new (function() {
            // The page's frames and the worker's; the faster batch is the rate.
            let _frames = [0, 0];
            let _startMS = 0;
            this.frameComplete = function(onWorker) {
                const now = performance.now();
                if (!_startMS) {
                    _startMS = now;
                    _frames = [0, 0];
                } else {
                    ++_frames[onWorker ? 1 : 0];
                    const milliseconds = now - _startMS;
                    if (milliseconds > 1000) {  // Update every 1 second.
                        fpsCallback(Math.max(_frames[0], _frames[1]) * 1000 / milliseconds);
                        _startMS = 0;
                    }
                }
            };
        })();
    }

    this.disableFPSCounter = function() {
        if (_fpsDiv) {
            document.body.remove(_fpsDiv);
            _fpsDiv = null;
        }
        _fpsCounter = null;
    }

    // Override this member to get a call once all post-animation-callbacks have been invoked.
    this.onAfterCallbacks = function() {};
}
