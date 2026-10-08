import { ReferenceArt } from "../components/Reference";
import { useState } from "react";
import { locations } from "../data/world";
import { Icon, Seal, Button } from "../components/UI";
import type { GameState } from "../types";

export function WorldMap({
  s,
  onTravel,
}: {
  s: GameState;
  onTravel: (id: string) => void;
}) {
  const coordinates: Record<string, [number, number]> = {
    lake: [18, 35],
    tower: [49, 16],
    herb: [82, 20],
    inn: [48, 45],
    alley: [81, 45],
    smith: [18, 72],
    office: [49, 80],
    dock: [82, 72],
  };
  const places = locations.map((l) => ({
    ...l,
    x: coordinates[l.id][0],
    y: coordinates[l.id][1],
  }));
  const [selected, setSelected] = useState(s.location);
  const l = locations.find((l) => l.id === selected)!;
  return (
    <>
      <div className="map-region-bar">
        <span>
          <Seal>江南</Seal>杭州府
        </span>
        <span className="small muted">八处烟火，万般故事</span>
        <span className="tag">当前开放区域</span>
      </div>
      <div className="world-map">
        <ReferenceArt
          figure={8}
          rect={[391, 0, 363, 244]}
          className="map-reference"
          label="文档原画山水舆图"
        />
        <div className="map-water-label">西 湖</div>
        <div className="map-title">
          杭<br />州<br />
          <small>府志</small>
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {places.flatMap((l) =>
            l.connections
              .filter((id) => id > l.id)
              .map((id) => {
                const next = places.find((x) => x.id === id)!;
                return (
                  <line
                    key={l.id + id}
                    x1={l.x}
                    y1={l.y}
                    x2={next.x}
                    y2={next.y}
                  />
                );
              }),
          )}
        </svg>
        {places.map((l) => (
          <button
            key={l.id}
            className={`map-pin ${s.location === l.id ? "current" : ""} ${selected === l.id ? "selected" : ""}`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            onClick={() => setSelected(l.id)}
            aria-pressed={selected === l.id}
          >
            <span>
              <Icon name={l.icon} size={20} />
            </span>
            <b>{l.name}</b>
            {s.location === l.id && <small>你在此处</small>}
          </button>
        ))}
        <div className="map-legend">
          <span>
            <i />
            所在之处
          </span>
          <span>◇ 可前往</span>
          <span>— 街巷水路</span>
        </div>
      </div>
      <div className="map-detail" key={selected}>
        <Icon name={l.icon} size={30} />
        <div>
          <h2>
            {l.name}
            <span className="tag">{l.tag}</span>
          </h2>
          <p>{l.subtitle}。前往此地消耗两个时辰。</p>
        </div>
        <Button
          kind="ink"
          disabled={s.location === l.id}
          onClick={() => onTravel(l.id)}
        >
          {s.location === l.id ? "已在此处" : "动身前往"}
          <Icon name="right" size={15} />
        </Button>
      </div>
      <div className="future-regions">
        <span>卷外山河</span>
        {["苏州", "洛阳", "长安", "少林", "武当"].map((n) => (
          <span key={n}>
            {n}
            <small>待续</small>
          </span>
        ))}
      </div>
    </>
  );
}
