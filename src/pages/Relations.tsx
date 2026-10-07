import { npcs } from "../data/world";
import { relationLabel } from "../engine/game";
import { Portrait, Badge } from "../components/InkUI";
import type { GameState, NPC } from "../types";
export function Relations({
  s,
  select,
}: {
  s: GameState;
  select: (n: NPC) => void;
}) {
  const spots = [
    [17, 17],
    [83, 17],
    [17, 50],
    [83, 50],
    [17, 83],
    [83, 83],
  ];
  return (
    <>
      <div className="bond-map">
        <svg
          className="bond-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {npcs.map((n, i) => (
            <line
              key={n.id}
              x1="50"
              y1="50"
              x2={spots[i][0]}
              y2={spots[i][1]}
              className={s.relationships[n.id].met ? "known" : "unknown"}
            />
          ))}
        </svg>
        <div className="bond-self">
          <Portrait id="player" />
          <b>{s.player.name}</b>
          <span>你的江湖</span>
        </div>
        {npcs.map((n, i) => (
          <button
            className="bond-person"
            style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%` }}
            key={n.id}
            onClick={() => select(n)}
          >
            <Portrait id={n.id} />
            <b>{n.name}</b>
            <Badge tone={s.relationships[n.id].met ? "green" : ""}>
              {relationLabel(s.relationships[n.id])}
            </Badge>
          </button>
        ))}
      </div>
      <p className="secondary bond-caption">
        实线为已相识，虚线为尚未相逢。点选人物，可查看详情。
      </p>
      <div className="bond-ledger">
        {npcs.map((n) => (
          <button key={n.id} onClick={() => select(n)}>
            <span>{n.name}</span>
            <span>
              好感 {s.relationships[n.id].favor} · 信任{" "}
              {s.relationships[n.id].trust}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
