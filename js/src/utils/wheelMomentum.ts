// The runtime closes a scroll gesture after this long without events.
const GESTURE_GAP_MS = 100;
// Falls, and how far below the peak, before a stream counts as momentum.
const FALLING_EVENTS = 3;
const FALL_FROM_PEAK = 0.15;
// Rises in a row that mean fingers. One alone is two merged events.
const RISING_EVENTS = 2;
// Pixel deltas arrive rounded.
const JITTER = 1;
// Assumed slowest share momentum loses a second; a delta held longer is fingers.
const SLOWEST_DECAY = 0.6;
const HOLD_MARGIN = 1.5;
const SHORTEST_HOLD_MS = 50;

/** Tells the platform's momentum from the fingers in pixel wheel events. */
export class WheelMomentumDetector {
  private lastTime = -Infinity;
  private lastX = 0;
  private lastY = 0;
  // The lowest delta since the last rise, and the peak it fell from.
  private base = 0;
  private peak = 0;
  private falls = 0;
  private rises = 0;
  private heldSince = 0;
  private momentum = false;

  reset(): void {
    this.lastTime = -Infinity;
    this.momentum = false;
  }

  isMomentum(event: WheelEvent, deltaX: number, deltaY: number): boolean {
    // Browsers with WheelEvent.momentum know; the rest leave it to the deltas.
    if ("momentum" in event) {
      return (event as WheelEvent & { momentum: boolean }).momentum === true;
    }
    // Each axis rounds on its own, so the larger one is the size.
    const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const time = event.timeStamp;
    const newGesture =
      time - this.lastTime > GESTURE_GAP_MS ||
      deltaX * this.lastX + deltaY * this.lastY < 0;
    this.lastTime = time;
    this.lastX = deltaX;
    this.lastY = deltaY;
    if (newGesture) {
      this.restart(size, time);
      return false;
    }
    if (size > this.base + JITTER) {
      if (++this.rises >= RISING_EVENTS) {
        this.restart(size, time);
      }
      return this.momentum;
    }
    this.rises = 0;
    const longestHold = (HOLD_MARGIN * 1000) / (SLOWEST_DECAY * size);
    if (size < this.base) {
      this.falls++;
      this.base = size;
      this.heldSince = time;
    } else if (
      time - this.heldSince >
      Math.max(SHORTEST_HOLD_MS, longestHold)
    ) {
      this.restart(size, time);
    }
    if (
      this.falls >= FALLING_EVENTS &&
      size <= this.peak - Math.max(2 * JITTER, FALL_FROM_PEAK * this.peak)
    ) {
      this.momentum = true;
    }
    return this.momentum;
  }

  private restart(size: number, time: number): void {
    this.base = this.peak = size;
    this.falls = this.rises = 0;
    this.heldSince = time;
    this.momentum = false;
  }
}
