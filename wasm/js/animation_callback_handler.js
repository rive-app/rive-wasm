// Manages a list of animation callbacks to be called in batch.
// Override this.onAfterCallbacks to get a call once all animation callbacks have been invoked.
function AnimationCallbackHandler() {
    let _mainAnimationCallbackID = 0;
    let _lastAnimationSubCallbackID = 0;
    let _animationSubCallbacks = new Map();
    let _fpsCounter = null;
    let _fpsDiv = null;

    this.requestAnimationFrame = function(callback) {
        if (!_mainAnimationCallbackID) {
            _mainAnimationCallbackID =
                    requestAnimationFrame(mainAnimationCallback.bind(this));
        }
        const id = ++_lastAnimationSubCallbackID;
        _animationSubCallbacks.set(id, callback);
        return id;
    }

    this.cancelAnimationFrame = function(id) {
        _animationSubCallbacks.delete(id);
        if (_mainAnimationCallbackID && _animationSubCallbacks.size == 0) {
            cancelAnimationFrame(_mainAnimationCallbackID);
            _mainAnimationCallbackID = 0;
        }
    }

    function mainAnimationCallback(time) {
        // Snap off and reset the sub-callbacks first, since they might call requestAnimationFrame
        // recursively.
        const flushingSubCallbacks = _animationSubCallbacks;
        _mainAnimationCallbackID = 0;
        _lastAnimationSubCallbackID = 0;
        _animationSubCallbacks = new Map();

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
            _fpsCounter.frameComplete();
        }
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
            let _frames = 0;
            let _startMS = 0;
            this.frameComplete = function() {
                const now = performance.now();
                if (!_startMS) {
                    _startMS = now;
                    _frames = 0;
                } else {
                    ++_frames;
                    const milliseconds = now - _startMS;
                    if (milliseconds > 1000) {  // Update every 1 second.
                        fpsCallback(_frames * 1000 / milliseconds);
                        _frames = _startMS = 0;
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
