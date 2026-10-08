import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuAtmosphere } from "../src/components/MenuAtmosphere";
import { coverPainting } from "../src/visuals/landscapeMath";

const hooks = vi.hoisted(() => ({
  effect: vi.fn(),
  ref: vi.fn(),
  setPlane: vi.fn(),
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: hooks.effect,
  useRef: hooks.ref,
  useState: () => [{ scale: 1, left: 0 }, hooks.setPlane],
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("menu weather painting coordinates", () => {
  it("registers resize, keeps the artwork crop aligned, ignores zero sizes and disconnects", () => {
    let width = 390,
      height = 844;
    const target = { getBoundingClientRect: () => ({ width, height }) };
    hooks.ref.mockReturnValue({ current: target });
    const observe = vi.fn(),
      disconnect = vi.fn();
    let resize!: () => void;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );

    MenuAtmosphere();
    const cleanup = hooks.effect.mock.calls[0][0]() as () => void;
    expect(observe).toHaveBeenCalledExactlyOnceWith(target);
    expect(hooks.setPlane).toHaveBeenCalledOnce();
    for (const [nextWidth, nextHeight] of [
      [390, 844],
      [320, 760],
      [720, 1040],
      [720, 820],
    ]) {
      width = nextWidth;
      height = nextHeight;
      resize();
      const plane = hooks.setPlane.mock.lastCall![0];
      const crop = coverPainting(width, height);
      expect(plane.scale).toBeCloseTo(Math.max(width / 1024, height / 1536));
      expect(plane.left).toBeCloseTo(-crop.left * plane.scale);
      // The left screen edge maps to the same painting point as the WebGL view.
      expect(-plane.left / plane.scale).toBeCloseTo(crop.left);
    }
    const calls = hooks.setPlane.mock.calls.length;
    width = 0;
    resize();
    expect(hooks.setPlane).toHaveBeenCalledTimes(calls);
    cleanup();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
