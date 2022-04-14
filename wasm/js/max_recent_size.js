// Tracks the max size that has been pushed within a given window of time.
// Used as a buffer to avoid thrashing allocations of GL buffers.
// All values are rounded up to the next multiple of 2^bitShift.
function MaxRecentSize(milliseconds, bitShift) {
    console.assert(milliseconds > 0);
    const _map = new Map();
    let _maxSize = -Infinity;
    this.push = function(size) {
        // Store values in right-shifted form. We will shift left before returning back to the user.
        // Also add 2^(bitShift - 1) before shifting, to ensure we only round upward.
        size = (size + ((1 << bitShift) - 1)) >> bitShift;
        // Erase the previous eviction timer for the value 'size', if any.
        if (_map.has(size)) {
            clearTimeout(_map.get(size));
        }
        // Set an eviction timer for the value 'size'.
        _map.set(size, setTimeout(function() {
            _map.delete(size);
            if (_map.length == 0) {
                _maxSize = -Infinity;
            } else if (size == _maxSize) {
                _maxSize = Math.max(..._map.keys());
                console.assert(_maxSize < size);
            }
        }, milliseconds));
        _maxSize = Math.max(size, _maxSize);
        return _maxSize << bitShift;
    };
}
