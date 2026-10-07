import { describe, expect, it } from "vitest";
import { canvasSize, coverPainting } from "../src/visuals/landscapeMath";

describe("live landscape viewport", () => {
  it.each([
    [320, 760],
    [390, 844],
    [720, 820],
    [720, 1040],
  ])("matches the static cover crop at %sx%s", (width, height) => {
    const view = coverPainting(width, height);
    expect(view.width / view.height).toBeCloseTo(width / height);
    expect(view.width).toBeLessThanOrEqual(1024);
    expect(view.height).toBeLessThanOrEqual(1536);
    expect(view.left).toBeGreaterThanOrEqual(0);
    expect(view.left + view.width).toBeLessThanOrEqual(1024);
    expect(view.left).toBeCloseTo((1024 - view.width) * 0.46);
  });
  it("caps backing-store pixels on high-DPI displays", () => {
    const large = canvasSize(720, 1040, 3);
    expect(large.width * large.height).toBeLessThan(1_253_000);
    const phone = canvasSize(390, 844, 3);
    expect(phone.width).toBe(585);
    expect(phone.height).toBe(1266);
  });
});
