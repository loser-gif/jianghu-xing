import { useEffect, useRef, useState } from "react";
import { coverPainting } from "../visuals/landscapeMath";

// Keep weather in painting coordinates, so mist still follows the same valleys
// when the portrait artwork is cropped to a narrow phone screen.
export function MenuAtmosphere() {
  const host = useRef<HTMLDivElement>(null);
  const [plane, setPlane] = useState({ scale: 1, left: 0 });
  useEffect(() => {
    const target = host.current!;
    const resize = () => {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;
      const crop = coverPainting(width, height);
      const scale = width / crop.width;
      setPlane({ scale, left: -crop.left * scale });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    resize();
    return () => observer.disconnect();
  }, []);
  return (
    <div className="opening-atmosphere" ref={host} aria-hidden="true">
      <div
        className="opening-weather-plane"
        style={{ left: plane.left, transform: `scale(${plane.scale})` }}
      >
        <div className="opening-moonlight" />
        <div className="opening-high-cloud" />
        <div className="opening-valley opening-valley-far">
          <i />
        </div>
        <div className="opening-valley opening-valley-middle">
          <i />
        </div>
        <div className="opening-valley opening-valley-near">
          <i />
        </div>
        <div className="opening-water">
          <i />
          <i />
          <i />
        </div>
        <div className="opening-wind-leaves">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              style={{
                animationDelay: `${-index * 5.7}s`,
                animationDuration: `${27 + index * 3}s`,
              }}
            >
              <i />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
