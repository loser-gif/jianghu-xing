// Preserve the fractional interval instead of resetting to each late RAF timestamp.
// Otherwise a 60 Hz screen can alternate between 20 and 30 fps at a 30 fps cap.
export class FrameClock {
  elapsed = 0;
  private previous: number | undefined;
  private accumulated = 0;
  constructor(private readonly interval = 1000 / 30) {}
  reset() {
    this.previous = undefined;
    this.accumulated = 0;
  }
  advance(now: number) {
    if (this.previous === undefined) {
      this.previous = now;
      return true;
    }
    const delta = Math.min(100, Math.max(0, now - this.previous));
    this.previous = now;
    this.elapsed += delta / 1000;
    this.accumulated += delta;
    if (this.accumulated + 0.01 < this.interval) return false;
    this.accumulated = Math.max(0, this.accumulated % this.interval);
    // Absorb floating-point error when an interval lands a fraction below its boundary.
    if (this.interval - this.accumulated < 0.01) this.accumulated = 0;
    return true;
  }
}
