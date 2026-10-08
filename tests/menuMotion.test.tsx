import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MainMenu } from "../src/pages/MainMenu";
import { freshState } from "../src/engine/game";
import menuSource from "../src/pages/MainMenu.tsx?raw";
// Vitest stubs CSS imports in its Node environment. Read the source directly;
// keep this test-only Node API independent of the app's browser-only typings.
const fsModule = "node:fs";
const { readFileSync } = (await import(fsModule)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");

const getItem = vi.fn();
const setItem = vi.fn();
const renderMenu = (paused = false) =>
  renderToStaticMarkup(
    <MainMenu
      s={freshState()}
      paused={paused}
      onStart={() => {}}
      onContinue={() => {}}
      onSave={() => {}}
      onHelp={() => {}}
    />,
  );

beforeEach(() => {
  getItem.mockReset().mockReturnValue(null);
  setItem.mockReset();
  vi.stubGlobal("localStorage", { getItem, setItem });
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("location", { href: "https://example.test/jianghu-xing/" });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("main menu motion policy", () => {
  it("renders the artwork and all lightweight weather layers before WebGL is ready", () => {
    const html = renderMenu();
    expect(html).toContain("opening-menu motion-playing");
    expect(html).toContain('class="opening-painting"');
    for (const layer of [
      "high-cloud",
      "valley-far",
      "valley-middle",
      "valley-near",
      "water",
      "wind-leaves",
    ])
      expect(html).toContain(`opening-${layer}`);
    expect(html).toContain("暂停动效");
    expect(getItem).toHaveBeenCalledExactlyOnceWith("jianghu-menu-motion");
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each(["preference", "hidden", "dialog", "reduced"])(
    "starts paused when blocked by %s",
    (reason) => {
      if (reason === "preference") getItem.mockReturnValue("off");
      if (reason === "hidden") vi.stubGlobal("document", { hidden: true });
      if (reason === "reduced")
        vi.stubGlobal(
          "matchMedia",
          vi.fn(() => ({ matches: true })),
        );
      const html = renderMenu(reason === "dialog");
      expect(html).toContain("opening-menu motion-paused");
      if (reason === "reduced") {
        expect(html).toMatch(/class="opening-motion-control"[^>]*disabled=""/);
        expect(html).toContain("静态画面");
      }
      expect(setItem).not.toHaveBeenCalled();
    },
  );

  it("still renders when the optional preference store is unavailable", () => {
    getItem.mockImplementation(() => {
      throw new Error("Storage denied");
    });
    expect(renderMenu()).toContain("opening-menu motion-playing");
    expect(setItem).not.toHaveBeenCalled();
  });

  // Node SSR cannot run effects or simulate CSS. These are narrow source-contract
  // guards, not a substitute for mounted-browser lifecycle or pixel tests.
  it("keeps renderer failure separate from CSS playback and the user toggle", () => {
    const playback = menuSource.match(/const playing\s*=\s*([^;]+);/)?.[1];
    expect(playback).toBeDefined();
    for (const gate of ["motion", "visible", "inView", "!reduced", "!paused"])
      expect(playback).toContain(gate);
    expect(playback).not.toContain("unavailable");
    expect(menuSource).toMatch(
      /<LiveLandscape\s+playing=\{playing && !unavailable\}/,
    );
    expect(menuSource).toMatch(
      /className="opening-motion-control"\s+disabled=\{reduced\}/,
    );
    expect(menuSource).toMatch(
      /new IntersectionObserver\([\s\S]*?setInView\(entry\.isIntersecting\)/,
    );
    expect(menuSource).toMatch(/observer\.observe\(menu\.current!\)/);
    expect(menuSource).toMatch(/return \(\) => observer\.disconnect\(\)/);
  });

  it("only persists the existing menu preference and freezes CSS animations in place", () => {
    expect(
      [
        ...menuSource.matchAll(/localStorage\.(?:getItem|setItem)\("([^"]+)"/g),
      ].map((match) => match[1]),
    ).toEqual(["jianghu-menu-motion", "jianghu-menu-motion"]);
    expect(css).toMatch(
      /\.motion-paused \.opening-atmosphere \*\s*\{\s*animation-play-state:\s*paused;/,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.opening-painting,\s*\.opening-atmosphere \*\s*\{\s*animation:\s*none !important;/,
    );
  });
});
