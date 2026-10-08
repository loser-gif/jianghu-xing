import { afterEach, describe, expect, it, vi } from "vitest";
import { createLandscape } from "../src/visuals/liveLandscape";

function rendererFixture() {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => pending.delete(id)),
  );
  vi.stubGlobal("window", { devicePixelRatio: 2 });
  const observe = vi.fn(),
    disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = observe;
      disconnect = disconnect;
    },
  );
  const gl = {
    NO_ERROR: 0,
    isContextLost: vi.fn(() => false),
    getError: vi.fn(() => 0),
    getShaderParameter: vi.fn(() => true),
    getProgramParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_program: unknown, name: string) => name),
    uniform1f: vi.fn(),
    drawArrays: vi.fn(),
    deleteTexture: vi.fn(),
    deleteShader: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
  };
  // Resource setup is mocked; draw scheduling and shader time use the real player.
  const context = new Proxy(gl, {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return String(property).startsWith("create") ? () => ({}) : () => {};
    },
  });
  const canvas = {
    getContext: vi.fn(() => context),
    getBoundingClientRect: () => ({ width: 390, height: 844 }),
    width: 0,
    height: 0,
  } as unknown as HTMLCanvasElement;
  const image = {} as HTMLImageElement;
  const frame = (now: number) => {
    expect(pending.size).toBe(1);
    const [id, callback] = pending.entries().next().value!;
    pending.delete(id);
    callback(now);
  };
  return { pending, gl, canvas, image, frame, observe, disconnect };
}

afterEach(() => vi.unstubAllGlobals());

describe("live landscape lifecycle", () => {
  it("keeps one RAF, freezes while paused and resumes without advancing across the gap", () => {
    const f = rendererFixture();
    const player = createLandscape(f.canvas, f.image, f.image);
    expect(f.gl.drawArrays).toHaveBeenCalledOnce();
    expect(f.pending.size).toBe(0);
    expect(f.observe).toHaveBeenCalledExactlyOnceWith(f.canvas);
    player.setPlaying(true);
    player.setPlaying(true);
    f.frame(0);
    f.frame(40);
    expect(f.gl.uniform1f).toHaveBeenLastCalledWith("time", 0.04);
    player.setPlaying(false);
    player.setPlaying(false);
    expect(f.pending.size).toBe(0);
    const draws = f.gl.drawArrays.mock.calls.length;
    player.setPlaying(true);
    f.frame(100000);
    expect(f.gl.uniform1f).toHaveBeenLastCalledWith("time", 0.04);
    expect(f.gl.drawArrays).toHaveBeenCalledTimes(draws + 1);
    player.dispose();
    expect(f.pending.size).toBe(0);
    expect(f.disconnect).toHaveBeenCalledOnce();
    expect(f.gl.deleteTexture).toHaveBeenCalledTimes(2);
    expect(f.gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(f.gl.deleteBuffer).toHaveBeenCalledOnce();
    expect(f.gl.deleteProgram).toHaveBeenCalledOnce();
    player.setPlaying(true);
    expect(f.pending.size).toBe(0);
  });

  it("fails cleanly when WebGL is absent or shader setup fails", () => {
    const f = rendererFixture();
    vi.mocked(f.canvas.getContext).mockReturnValueOnce(null);
    expect(() => createLandscape(f.canvas, f.image, f.image)).toThrow(
      "WebGL unavailable",
    );
    expect(f.pending.size).toBe(0);
    f.gl.getShaderParameter.mockReturnValue(false);
    expect(() => createLandscape(f.canvas, f.image, f.image)).toThrow(
      "Shader compilation failed",
    );
    expect(f.pending.size).toBe(0);
    expect(f.gl.deleteShader).toHaveBeenCalledOnce();
  });
});
