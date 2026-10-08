import { ItemArt } from "../components/Reference";
import { useState } from "react";
import { items } from "../data/world";
import { Icon, Portrait } from "../components/UI";
import type { GameState, Item } from "../types";

export function Inventory({
  s,
  onItem,
}: {
  s: GameState;
  onItem: (i: Item) => void;
}) {
  const [filter, setFilter] = useState("全部"),
    [query, setQuery] = useState("");
  const own = items.filter(
    (i) =>
      (s.inventory[i.id] || 0) > 0 &&
      (filter === "全部" || i.kind === filter) &&
      i.name.includes(query),
  );
  return (
    <>
      <div className="inventory-summary">
        <Portrait gender={s.player.gender} size="small" />
        <div>
          <b>{s.player.name}的行囊</b>
          <p>行走江湖，轻装亦有底气。</p>
        </div>
        <span className="silver">
          <Icon name="coins" size={20} />
          {s.player.silver}
          <small>两</small>
        </span>
      </div>
      <div className="toolbar">
        <div className="tabs compact">
          {["全部", "装备", "消耗", "材料", "任务"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search-field short">
          <Icon name="search" size={16} />
          <input
            aria-label="搜索物品"
            placeholder="寻一件随身物…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="inventory-grid">
        {own.map((i) => (
          <button
            key={i.id}
            className="inventory-item"
            onClick={() => onItem(i)}
          >
            <div className="inventory-item-art">
              <ItemArt icon={i.icon} />
              <span>{i.quality || i.kind}</span>
            </div>
            <div className="inventory-item-copy">
              <h3>
                {i.name}
                {s.upgrades[i.id] ? ` +${s.upgrades[i.id]}` : ""}
              </h3>
              <p>{i.description}</p>
              <div>
                <span>持有 ×{s.inventory[i.id]}</span>
                {Object.values(s.equipped).includes(i.id) && (
                  <span className="relation-tag green">已装备</span>
                )}
                <Icon name="right" size={14} />
              </div>
            </div>
          </button>
        ))}
      </div>
      {!own.length && (
        <div className="empty-state">
          <Icon name="bag" size={30} />
          <p>行囊中暂无此类物品。</p>
        </div>
      )}
      <div className="collection-footer">
        <span>{own.length} 种物品</span>
        <span>点选物品查看详情、使用或强化</span>
      </div>
    </>
  );
}
