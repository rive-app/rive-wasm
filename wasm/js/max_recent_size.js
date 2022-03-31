// Tracks the max size that has been pushed within a given window of time.
// Used as a buffer to avoid thrashing allocations of GL buffers.
function MaxRecentSize(milliseconds) {
    console.assert(milliseconds > 0);
    const _map = new Map();
    const _getMax = function(now) {
        // Return the max size in our window.
        let maxSize = 0;
        _map.forEach((expiration, size) => {
            if (now > expiration) {
                _map.delete(size);
            } else {
                maxSize = Math.max(maxSize, size);
            }
        });
        return maxSize;
    };
    this.push = function(size) {
        const now = Date.now();
        const expiration = now + milliseconds;
        // Set (or update) the expiration time for this size before calling _getMax().
        _map.set(size, expiration);
        return _getMax(now);
    };
}
