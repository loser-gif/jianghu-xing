import { useState } from "react";
import { locations, npcs, npcLocation } from "../data/world";
import { Icon, Portrait } from "../components/UI";
import type { GameState, NPC } from "../types";
import { relationLabel } from "../engine/game";
import { ReferenceHeader } from "../components/Reference";

export function People({
  s,
  onNpc,
}: {
  s: GameState;
  onNpc: (n: NPC) => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("全部"),
    [view, setView] = useState("list");
  const filtered = npcs.filter(
    (n) =>
      (category === "全部" ||
        n.category === category ||
        (category === "同伴" && s.relationships[n.id].trust >= 55)) &&
      (n.name + n.role + n.tags.join("")).includes(query),
  );
  return (
    <>
      {view === "relations" && <ReferenceHeader title="羁绊图" />}
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            placeholder="寻一位故人，或一段过往…"
            aria-label="搜索人物"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="segmented">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <Icon name="users" size={16} />
            人物
          </button>
          <button
            className={view === "relations" ? "active" : ""}
            onClick={() => setView("relations")}
          >
            <Icon name="circle" size={16} />
            羁绊
          </button>
        </div>
      </div>
      <div className="tabs">
        {["全部", "同伴", "重要人物", "门派", "市井", "敌对"].map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {view === "relations" ? (
        <>
          <div className="relationship-map">
            <svg
              viewBox="0 0 700 450"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {filtered.map((n, i) => {
                const angle = (i / filtered.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line
                    key={n.id}
                    x1="350"
                    y1="225"
                    x2={350 + 260 * Math.cos(angle)}
                    y2={225 + 160 * Math.sin(angle)}
                    stroke={
                      s.relationships[n.id].trust >= 35 ? "#7d886a" : "#beb4a0"
                    }
                    strokeWidth="1.2"
                    strokeDasharray={s.relationships[n.id].met ? "0" : "5 5"}
                  />
                );
              })}
            </svg>
            <div className="relation-center">
              <Portrait />
              <b>{s.player.name}</b>
              <small>你在江湖中</small>
            </div>
            {filtered.map((n, i) => {
              const a = (i / filtered.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <button
                  key={n.id}
                  className="relation-node"
                  style={{
                    left: `${50 + 37 * Math.cos(a)}%`,
                    top: `${50 + 36 * Math.sin(a)}%`,
                  }}
                  onClick={() => onNpc(n)}
                >
                  <Portrait index={n.portrait} size="small" />
                  <b>{n.name}</b>
                  <span className="relation-tag">
                    {relationLabel(s.relationships[n.id])}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="center muted small">
            实线为已相识，虚线为尚未相逢。每一段关系，都从一次相遇开始。
          </p>
        </>
      ) : (
        <div className="people-list">
          {filtered.map((n) => {
            const r = s.relationships[n.id];
            return (
              <button
                className="person-row"
                key={n.id}
                onClick={() => onNpc(n)}
              >
                <Portrait index={n.portrait} size="large" />
                <div className="person-info">
                  <div className="person-title">
                    <h2>{n.name}</h2>
                    <span
                      className={`gender ${n.gender === "女" ? "red" : ""}`}
                    >
                      {n.gender}
                    </span>
                    <span className="person-role">{n.role}</span>
                  </div>
                  <div className="person-tags">
                    {n.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="person-meta">
                  <span className="person-location">
                    <Icon name="compass" size={13} />
                    {n.id === "gu" && s.quest.stage === "completed"
                      ? "官府 · 在押"
                      : locations.find((l) => l.id === npcLocation(n, s.time))
                          ?.name}
                  </span>
                  <span
                    className={`relation-tag ${r.trust >= 35 ? "green" : ""}`}
                  >
                    {relationLabel(r)}
                  </span>
                  <p className="person-quote">“{n.quote}”</p>
                </div>
                <Icon name="right" size={17} />
              </button>
            );
          })}
          {!filtered.length && (
            <div className="empty-state">
              <Icon name="users" size={32} />
              <p>此间暂无符合条件的人物。</p>
              <small>多走几段路，多结几份缘。</small>
            </div>
          )}
        </div>
      )}
      <div className="collection-footer">
        <span>
          共 {filtered.length} 位 · 已相识{" "}
          {npcs.filter((n) => s.relationships[n.id].met).length} 位
        </span>
        <span>相逢即是缘</span>
      </div>
    </>
  );
}
