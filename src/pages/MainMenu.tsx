import { locations, timeLabel } from "../data/world";
import type { GameState } from "../types";

export function MainMenu({
  s,
  onStart,
  onContinue,
  onSave,
  onHelp,
}: {
  s: GameState;
  onStart: () => void;
  onContinue: () => void;
  onSave: () => void;
  onHelp: () => void;
}) {
  const location = locations.find((place) => place.id === s.location)?.name;
  return (
    <section className="opening-menu" aria-label="江湖行主菜单">
      <img
        className="opening-painting"
        src={`${import.meta.env.BASE_URL}art/menu/mountain-moon.png`}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <div className="opening-wash" aria-hidden="true" />
      <header className="opening-heading">
        <h1 aria-label="江湖行">
          <span>江</span>
          <span>湖</span>
          <span>行</span>
        </h1>
        <span className="opening-seal">杭州篇</span>
      </header>
      <p className="opening-verse">
        <span>一念山河远</span>
        <span>一剑天地宽</span>
      </p>
      <nav className="opening-actions" aria-label="开始游历">
        <p className="opening-chapter">第一卷 · 烟雨初逢</p>
        {s.started ? (
          <>
            <button
              className="opening-action opening-primary"
              onClick={onContinue}
              aria-label="继续游历"
            >
              <span className="opening-diamond" aria-hidden="true" />
              <span>
                继续游历
                  <small title={`${s.player.name} · ${location}`}>
                  {s.player.name} · {location}
                </small>
              </span>
            </button>
            <button className="opening-action" onClick={onStart}>
              <span className="opening-diamond" aria-hidden="true" />
              开始江湖
            </button>
          </>
        ) : (
          <>
            <button
              className="opening-action opening-primary"
              onClick={onStart}
            >
              <span className="opening-diamond" aria-hidden="true" />
              开始江湖
            </button>
            <button className="opening-action" disabled aria-label="继续游历">
              <span className="opening-diamond" aria-hidden="true" />
              继续游历
            </button>
          </>
        )}
        <button className="opening-action" onClick={onSave}>
          <span className="opening-diamond" aria-hidden="true" />
          存档与设置
        </button>
        <button className="opening-action" onClick={onHelp}>
          <span className="opening-diamond" aria-hidden="true" />
          初入江湖须知
        </button>
        <p className="opening-progress">
          {s.started ? timeLabel(s.time) : "江湖路远，由此启程"}
        </p>
      </nav>
      <footer className="opening-footer">
        <span />
        一纸江湖 · 万般人生
        <span />
      </footer>
    </section>
  );
}
