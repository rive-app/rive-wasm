const kRefreshSamples = 15;
// The frames the worker's replay time averages over, plus the three still in
// flight when the cadence changes.
const kSettleFrames = 12;
const kProbeAfterMs = 1000;
const kMaxProbeAfterMs = 16000;
// A worker only slightly slower than its cadence fills its queue now and then,
// a worker that keeps up almost never.
const kBackupWindow = 60;
const kSaturatedBackups = 3;

const median = (values: number[]): number => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
};

/**
 * Paces recording to a replay worker slower than the display. Recording as
 * soon as its queue frees sends frames in bursts, so instead they go out every
 * N refreshes, with N following the worker's recent replay time.
 */
export class ReplayPacer {
  private lastTime = 0;
  private lastRecord = 0;
  private intervals: number[] = [];
  private divisor = 1;
  // Frames recorded since the divisor changed, which the replay time still
  // averages in.
  private settle = 0;
  private nextProbe = 0;
  private probing = false;
  // Failed probes back off, since each one costs a few uneven frames.
  private probeAfter = kProbeAfterMs;
  // Whether the worker's queue filled since the last decision.
  private backedUp = false;
  private recentBackups: boolean[] = [];

  /**
   * Called on every animation frame. Returns whether this one should record,
   * given the worker's replay time and whether its queue has room.
   */
  shouldRecord(time: number, replayMs: number, accepts: boolean): boolean {
    if (this.lastTime && time > this.lastTime) {
      this.intervals.push(time - this.lastTime);
      if (this.intervals.length > kRefreshSamples) {
        this.intervals.shift();
      }
    }
    this.lastTime = time;
    if (!accepts) {
      // A canvas the worker has yet to take refuses frames too.
      if (replayMs > 0) {
        this.backedUp = true;
      }
      return false;
    }
    if (replayMs > 0 && this.intervals.length > 0) {
      const refresh = median(this.intervals);
      if (this.settle === 0) {
        this.adapt(time, replayMs / refresh);
      }
      if (
        this.divisor > 1 &&
        time - this.lastRecord < (this.divisor - 0.5) * refresh
      ) {
        return false;
      }
    }
    this.lastRecord = time;
    this.settle = Math.max(0, this.settle - 1);
    return true;
  }

  private adapt(time: number, ratio: number) {
    const divisor = this.divisor;
    const backedUp = this.backedUp;
    this.backedUp = false;
    this.recentBackups.push(backedUp);
    if (this.recentBackups.length > kBackupWindow) {
      this.recentBackups.shift();
    }
    const saturated =
      this.recentBackups.filter(Boolean).length >= kSaturatedBackups;
    const lagging = ratio > divisor * 1.1;
    // A worker that keeps up never fills its queue, however long each frame
    // takes to finish, so only a lag with a full queue slows the cadence. A
    // probe fails on either, since it settled at the new cadence.
    if (
      this.probing
        ? lagging || backedUp
        : (lagging && backedUp) || (ratio > divisor && saturated)
    ) {
      this.probeAfter = this.probing
        ? Math.min(this.probeAfter * 2, kMaxProbeAfterMs)
        : kProbeAfterMs;
      this.setDivisor(time, Math.max(divisor + 1, Math.ceil(ratio)));
    } else if (ratio < (divisor - 1) * 0.9) {
      // Paced frames no longer overlap, so their replay time is a ceiling
      // and a faster cadence under it is safe.
      this.probeAfter = kProbeAfterMs;
      this.setDivisor(time, Math.max(1, Math.ceil(ratio / 0.9)));
    } else if (this.probing) {
      // A worker only slightly too slow takes a while to fill its queue.
      if (this.recentBackups.length >= kBackupWindow) {
        this.probing = false;
        this.probeAfter = kProbeAfterMs;
      }
    } else if (divisor > 1 && time >= this.nextProbe) {
      // Frames that overlap on the GPU can keep up with a cadence shorter
      // than one frame's replay, which only trying it shows.
      this.setDivisor(time, divisor - 1);
      this.probing = true;
    }
  }

  private setDivisor(time: number, divisor: number) {
    this.divisor = divisor;
    this.settle = kSettleFrames;
    this.probing = false;
    this.backedUp = false;
    this.recentBackups = [];
    this.nextProbe = time + this.probeAfter;
  }
}
