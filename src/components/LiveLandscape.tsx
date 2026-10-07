import { useEffect, useRef, useState } from "react";
import { artUrl } from "../artAssets";
import {
  createLandscape,
  type LandscapePlayer,
} from "../visuals/liveLandscape";

export function LiveLandscape({
  playing,
  onUnavailable,
}: {
  playing: boolean;
  onUnavailable: (failed: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<LandscapePlayer | null>(null);
  const active = useRef(playing);
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    active.current = playing;
    player.current?.setPlaying(playing);
  }, [playing]);
  useEffect(() => {
    const target = canvas.current!;
    let cancelled = false;
    setReady(false);
    const lost = (event: Event) => {
      event.preventDefault();
      player.current?.dispose();
      player.current = null;
      setReady(false);
      onUnavailable(true);
    };
    const restored = () => setGeneration((value) => value + 1);
    target.addEventListener("webglcontextlost", lost);
    target.addEventListener("webglcontextrestored", restored);
    const images = ["mountain-background", "swordsman-wind"].map((name) => {
      const image = new Image();
      image.src = artUrl(`art/menu/${name}.png`);
      return image;
    });
    void Promise.all(images.map((image) => image.decode()))
      .then(() => {
        if (cancelled) return;
        player.current = createLandscape(target, images[0], images[1]);
        player.current.setPlaying(active.current);
        setReady(true);
        onUnavailable(false);
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("动态画卷暂不可用，保留静态插画", error);
          onUnavailable(true);
        }
      });
    return () => {
      cancelled = true;
      target.removeEventListener("webglcontextlost", lost);
      target.removeEventListener("webglcontextrestored", restored);
      player.current?.dispose();
      player.current = null;
    };
  }, [generation, onUnavailable]);
  return (
    <canvas
      ref={canvas}
      className={`opening-live-painting ${ready ? "is-ready" : ""}`}
      data-renderer={ready ? (playing ? "running" : "paused") : "fallback"}
      aria-hidden="true"
    />
  );
}
