import { locations, timeLabel } from "../data/world";
import { useEffect, useRef, useState } from "react";
import { artUrl } from "../artAssets";
import { LiveLandscape } from "../components/LiveLandscape";
import { MenuAtmosphere } from "../components/MenuAtmosphere";
import type { GameState } from "../types";

export function MainMenu({
  s,
  onStart,
  onContinue,
  onSave,
  onHelp,
  paused = false,
}: {
  s: GameState;
  onStart: () => void;
  onContinue: () => void;
  onSave: () => void;
  onHelp: () => void;
  paused?: boolean;
}) {
  const [motion, setMotion] = useState(() => {
    try {
      return localStorage.getItem("jianghu-menu-motion") !== "off";
    } catch {
      return true;
    }
  });
  const [visible, setVisible] = useState(!document.hidden);
  const menu = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(menu.current!);
    return () => observer.disconnect();
  }, []);
  const playing = motion && visible && inView && !reduced && !paused;
  const location = locations.find((place) => place.id === s.location)?.name;
  return (
    <section
      ref={menu}
      className={`opening-menu ${playing ? "motion-playing" : "motion-paused"}`}
      data-motion-quality={unavailable ? "lightweight" : "layered"}
      aria-label="江湖行主菜单"
    >
      <img
        className="opening-painting"
        src={artUrl("art/menu/mountain-moon.png")}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <LiveLandscape
        playing={playing && !unavailable}
        onUnavailable={setUnavailable}
      />
      <div className="opening-wash" aria-hidden="true" />
      <MenuAtmosphere />
      <button
        className="opening-motion-control"
        disabled={reduced}
        aria-pressed={!motion || reduced}
        title={
          unavailable ? "轻量动态画卷：保留流云、山雾与风叶" : "分层动态画卷"
        }
        onClick={() => {
          setMotion(!motion);
          try {
            localStorage.setItem("jianghu-menu-motion", motion ? "off" : "on");
          } catch {
            /* Optional preference. */
          }
        }}
      >
        {reduced ? "静态画面" : motion ? "暂停动效" : "开启动效"}
      </button>
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
