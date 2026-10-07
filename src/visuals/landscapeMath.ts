// Painting-space coordinates stay the same at every screen size (object-position: 46% top).
export function coverPainting(width: number, height: number) {
  const scale = Math.max(width / 1024, height / 1536);
  return {
    width: width / scale,
    height: height / scale,
    left: (1024 - width / scale) * 0.46,
  };
}

export function canvasSize(width: number, height: number, dpr: number) {
  const ratio = Math.min(dpr, 1.5, Math.sqrt(1_250_000 / (width * height)));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
