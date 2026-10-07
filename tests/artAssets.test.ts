import { describe, expect, it, vi } from "vitest";
import { loadImageAsset } from "../src/artAssets";

const url = "https://example.test/jianghu/art/optimized/test.123.webp";
const signal = new AbortController().signal;
const image = () => new Response(new Blob(["picture"], { type: "image/webp" }));

describe("画卷缓存", () => {
  it("重试会重新验证 HTTP 响应，不继续读取过期的失败响应", async () => {
    const request = vi.fn(async (_url: string, options: RequestInit) => {
      expect(options.cache).toBe("no-cache");
      return image();
    });
    expect(
      await loadImageAsset(url, {
        fetch: request,
        decode: async () => "blob:restored",
        signal,
      }),
    ).toBe("blob:restored");
  });
  it("浏览器请求函数不会被绑定到依赖对象", async () => {
    async function request(this: unknown) {
      expect(this).toBeUndefined();
      return image();
    }
    expect(
      await loadImageAsset(url, {
        fetch: request,
        decode: async () => "blob:ready",
        signal,
      }),
    ).toBe("blob:ready");
  });
  it("首次获取并解码后写入缓存，再次进入不请求网络", async () => {
    let saved: Response | undefined;
    const cache = {
      match: vi.fn(async () => saved?.clone()),
      put: vi.fn(async (_: unknown, response: Response) => {
        saved = response.clone();
      }),
      delete: vi.fn(async () => true),
    };
    const fetcher = vi.fn(async () => image());
    const decode = vi.fn(async (blob: Blob) => {
      expect(await blob.text()).toBe("picture");
      return "blob:ready";
    });
    const dependencies = {
      cache: cache as unknown as Cache,
      fetch: fetcher,
      decode,
      signal,
    };
    expect(await loadImageAsset(url, dependencies)).toBe("blob:ready");
    expect(await loadImageAsset(url, dependencies)).toBe("blob:ready");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(2);
  });
  it("损坏的缓存会被丢弃并重新获取，不永久卡在加载页", async () => {
    const cache = {
      match: vi.fn(async () => new Response("broken")),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => true),
    };
    const decode = vi.fn(async (blob: Blob) => {
      if ((await blob.text()) === "broken") throw new Error("Invalid image");
      return "blob:repaired";
    });
    const fetcher = vi.fn(async () => image());
    expect(
      await loadImageAsset(url, {
        cache: cache as unknown as Cache,
        fetch: fetcher,
        decode,
        signal,
      }),
    ).toBe("blob:repaired");
    expect(cache.delete).toHaveBeenCalledWith(url);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("缓存权限或空间不足时仍能显示图片", async () => {
    const cache = {
      match: vi.fn(async () => {
        throw new Error("Denied");
      }),
      put: vi.fn(async () => {
        throw new Error("Quota");
      }),
      delete: vi.fn(async () => false),
    };
    expect(
      await loadImageAsset(url, {
        cache: cache as unknown as Cache,
        fetch: async () => image(),
        decode: async () => "blob:ready",
        signal,
      }),
    ).toBe("blob:ready");
  });
  it("网络错误不会把错误页作为图片写入缓存", async () => {
    const put = vi.fn();
    const cache = { match: vi.fn(async () => undefined), put, delete: vi.fn() };
    const decode = vi.fn();
    await expect(
      loadImageAsset(url, {
        cache: cache as unknown as Cache,
        fetch: async () => new Response("Not found", { status: 404 }),
        decode,
        signal,
      }),
    ).rejects.toThrow("404");
    expect(put).not.toHaveBeenCalled();
    expect(decode).not.toHaveBeenCalled();
  });
});
