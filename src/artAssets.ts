import manifest from "./data/art-manifest.json";

type ImageCache = Pick<Cache, "match" | "put" | "delete">;
export type ArtProgress = {
  completed: number;
  total: number;
  failed: number;
  done: boolean;
};
const resolved = new Map<string, string>();
let running: Promise<void> | undefined;
let progress: ArtProgress = {
  completed: 0,
  total: Object.values(manifest).reduce((sum, item) => sum + item.bytes, 0),
  failed: 0,
  done: false,
};
const listeners = new Set<(value: ArtProgress) => void>();
const entries = Object.entries(manifest);
const base = () => new URL(import.meta.env.BASE_URL, location.href);
export function artUrl(source: string) {
  return (
    resolved.get(source) ||
    new URL(
      (manifest as Record<string, { file: string }>)[source]?.file || source,
      base(),
    ).href
  );
}

// A damaged or unavailable persistent cache must never trap the player at startup.
export async function loadImageAsset(
  url: string,
  dependencies: {
    cache?: ImageCache;
    fetch: (url: string, options: RequestInit) => Promise<Response>;
    decode: (blob: Blob) => Promise<string>;
    signal: AbortSignal;
  },
) {
  const { cache, decode, signal, fetch: request } = dependencies;
  const cached = await cache?.match(url).catch(() => undefined);
  if (cached) {
    try {
      return await decode(await cached.blob());
    } catch {
      await cache?.delete(url).catch(() => false);
    }
  }
  const response = await request(url, {
    signal,
    // Persistent artwork is handled above. Revalidate HTTP failures on retry.
    cache: "no-cache",
  });
  if (!response.ok)
    throw new Error(`Artwork request failed: ${response.status}`);
  const result = await decode(await response.clone().blob());
  await cache?.put(url, response).catch(() => undefined);
  return result;
}

function decode(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  return image.decode().then(
    () => url,
    (error) => {
      URL.revokeObjectURL(url);
      throw error;
    },
  );
}
function notify() {
  for (const listener of listeners) listener({ ...progress });
}
export function watchArtwork(listener: (value: ArtProgress) => void) {
  listeners.add(listener);
  listener({ ...progress });
  return () => {
    listeners.delete(listener);
  };
}
export function prepareArtwork() {
  if (running) return running;
  running = (async () => {
    progress = {
      ...progress,
      completed: entries
        .filter(([source]) => resolved.has(source))
        .reduce((sum, [, item]) => sum + item.bytes, 0),
      failed: 0,
      done: false,
    };
    notify();
    let cache: Cache | undefined;
    try {
      cache = await caches.open(`jianghu-art-v1:${base().pathname}`);
    } catch {
      /* Private mode: use normal HTTP caching. */
    }
    const pending = entries.filter(([source]) => !resolved.has(source));
    const worker = async () => {
      while (pending.length) {
        const [source, item] = pending.shift()!;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        try {
          const task = loadImageAsset(new URL(item.file, base()).href, {
            cache,
            fetch,
            decode,
            signal: controller.signal,
          });
          const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error("Artwork timeout"));
            }, 12000);
          });
          resolved.set(source, await Promise.race([task, timeout]));
          progress.completed += item.bytes;
        } catch (error) {
          progress.failed += 1;
          console.warn("画卷暂未准备好", source, error);
        } finally {
          clearTimeout(timer!);
          notify();
        }
      }
    };
    const font = Promise.race([
      document.fonts.load("24px DocumentBrush", "江湖行"),
      new Promise((resolve) => setTimeout(resolve, 3500)),
    ]).catch(() => undefined);
    await Promise.all([worker(), worker(), worker(), worker(), font]);
    progress.done = true;
    notify();
    // Remove only obsolete artwork from this game's own cache, never saves or other sites.
    if (cache) {
      const current = new Set(
        entries.map(([, item]) => new URL(item.file, base()).href),
      );
      void cache
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => !current.has(key.url))
              .map((key) => cache!.delete(key)),
          ),
        )
        .catch(() => undefined);
    }
  })().finally(() => {
    running = undefined;
  });
  return running;
}
