// Manages a list of animation callbacks to be called in batch.
// Override this.onAfterCallbacks to get a call once all animation callbacks have been invoked.
function AnimationCallbackHandler() {
    let _mainAnimationCallbackID = 0;
    let _lastAnimationSubCallbackID = 0;
    let _animationSubCallbacks = new Map();

    this.requestAnimationFrame = function(callback) {
        if (!_mainAnimationCallbackID) {
            _mainAnimationCallbackID =
                    window['requestAnimationFrame'](mainAnimationCallback.bind(this));
        }
        const id = ++_lastAnimationSubCallbackID;
        _animationSubCallbacks.set(id, callback);
        return id;
    }

    this.cancelAnimationFrame = function(id) {
        _animationSubCallbacks.delete(id);
        if (_mainAnimationCallbackID && _animationSubCallbacks.size == 0) {
            window['cancelAnimationFrame'](_mainAnimationCallbackID);
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
    }

    // Override this member to get a call once all post-animation-callbacks have been invoked.
    this.onAfterCallbacks = function() {};
}
