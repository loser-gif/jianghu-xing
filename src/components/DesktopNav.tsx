import type { GameState, Page } from "../types";
import { realms } from "../engine/cultivation";
import { derived } from "../engine/game";
import { PlayerPortrait } from "./PlayerPortrait";
import { Icon } from "./UI";

const pages: [Page, string, string][] = [
  ["jianghu", "行走江湖", "mountain"],
  ["guide", "江湖路引", "compass"],
  ["trial", "问心试炼塔", "building"],
  ["living", "百业生活", "leaf"],
  ["calendar", "岁时与寿元", "compass"],
  ["character", "我的人物", "user"],
  ["inventory", "随身行囊", "bag"],
  ["arts", "武学修为", "book"],
  ["npc", "人物与羁绊", "users"],
  ["map", "天下舆图", "map"],
  ["quest", "委托与案卷", "scroll"],
  ["identity", "身份司簿", "shield"],
  ["journal", "江湖手记", "feather"],
];
export function DesktopNav({
  s,
  page,
  navigate,
  onSave,
  onHelp,
  onMenu,
}: {
  s: GameState;
  page: Page;
  navigate: (p: Page) => void;
  onSave: () => void;
  onHelp: () => void;
  onMenu: () => void;
}) {
  const d = derived(s);
  return (
    <aside className="desktop-sidebar">
      <button
        className="desktop-brand"
        onClick={onMenu}
        aria-label="江湖行 · 返回主菜单"
      >
        江湖行<span>杭州篇 · 一纸江湖</span>
      </button>
      <div className="desktop-player">
        <PlayerPortrait gender={s.player.gender} />
        <div>
          <b>{s.player.name}</b>
          <span>
            {realms[s.cultivation.realm]} · 银两 {s.player.silver}
          </span>
        </div>
      </div>
      <div className="desktop-vitals">
        <span>
          气血 {s.player.hp}/{d.maxHp}
        </span>
        <span>
          内力 {s.player.qi}/{d.maxQi}
        </span>
      </div>
      <nav aria-label="桌面主导航">
        {pages.map(([id, label, icon]) => (
          <button
            key={id}
            aria-current={page === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon name={icon} size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="desktop-tools">
        <button onClick={onSave}>
          <Icon name="save" size={17} />
          存档与设置
        </button>
        <button onClick={onHelp}>
          <Icon name="help" size={17} />
          玩法说明
        </button>
      </div>
      <p className="desktop-colophon">行过山河 · 自有来处</p>
    </aside>
  );
}
