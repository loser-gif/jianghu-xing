import { expect, it } from "vitest";
import { FrameClock } from "../src/visuals/frameClock";

it.each([60, 90, 120, 144])(
  "maintains a steady 30 fps budget on a %s Hz display",
  (hz) => {
    const clock = new FrameClock();
    let count = 0;
    for (let i = 0; i <= hz * 10; i++)
      if (clock.advance((i * 1000) / hz)) count++;
    expect(count).toBeGreaterThanOrEqual(300);
    expect(count).toBeLessThanOrEqual(302);
    expect(clock.elapsed).toBeCloseTo(10);
  },
);
it("freezes time while paused and avoids a jump after resuming", () => {
  const clock = new FrameClock();
  clock.advance(0);
  clock.advance(50);
  clock.reset();
  clock.advance(100000);
  expect(clock.elapsed).toBeCloseTo(0.05);
  clock.advance(100050);
  expect(clock.elapsed).toBeCloseTo(0.1);
});
it("limits the visual jump after a stalled browser frame", () => {
  const clock = new FrameClock();
  clock.advance(0);
  clock.advance(2000);
  expect(clock.elapsed).toBe(0.1);
});
