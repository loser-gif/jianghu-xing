import { Creation } from "./pages/Creation";
import { Jianghu } from "./pages/Jianghu";
import { People } from "./pages/People";
import { NpcDetail } from "./pages/NpcDetail";
import { Character } from "./pages/Character";
import { Inventory } from "./pages/Inventory";
import { ItemDetail } from "./pages/ItemDetail";
import { Martial } from "./pages/Martial";
import { WorldMap } from "./pages/WorldMap";
import { Quest } from "./pages/Quest";
import { Identity } from "./pages/Identity";
import { Journal } from "./pages/Journal";
import { Combat } from "./pages/Combat";
import { Custody } from "./pages/Custody";
import { SavePanel } from "./pages/SavePanel";
import { useCallback, useState, useEffect } from "react";
import { useGame } from "./store";
import { locations, origins, timeLabel, stageLabels } from "./data/world";
import { events } from "./data/events";
import { derived, meets } from "./engine/game";
import type { NPC, Item, Page } from "./types";
import {
  Icon,
  Portrait,
  Seal,
  Button,
  Section,
  Meter,
  ActionRow,
  Modal,
} from "./components/UI";

const pageTitles: Record<Page, [string, string]> = {
  jianghu: ["江湖", "山水一程，幸会相逢"],
  character: ["人物", "见天地，见众生，见自己"],
  npc: ["人物谱", "江湖中的你我故人"],
  arts: ["武学录", "一招一式，皆是修行"],
  inventory: ["行囊", "一剑一壶酒，随身是江湖"],
  map: ["天下舆图", "山河远阔，来日方长"],
  quest: ["江湖事", "来路有迹，去处有因"],
  identity: ["身份司簿", "有所担当，方为江湖中人"],
  journal: ["江湖手记", "一笔一划，记下自己的故事"],
};
const mainNav: { id: Page; label: string; icon: string }[] = [
  { id: "jianghu", label: "江湖", icon: "mountain" },
  { id: "character", label: "人物", icon: "user" },
  { id: "npc", label: "人物谱", icon: "users" },
  { id: "arts", label: "武学", icon: "book" },
  { id: "inventory", label: "行囊", icon: "bag" },
  { id: "map", label: "地图", icon: "map" },
];

export default function App() {
  const { game: s, act, storageError } = useGame();
  const [screen, setScreen] = useState<"menu" | "create" | "game">("menu");
  const [page, setPage] = useState<Page>("jianghu");
  const [saveOpen, setSaveOpen] = useState(false);
  const [npc, setNpc] = useState<NPC | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [help, setHelp] = useState(false);
  const closeSave = useCallback(() => setSaveOpen(false), []),
    closeNpc = useCallback(() => setNpc(null), []),
    closeItem = useCallback(() => setItem(null), []),
    closeHelp = useCallback(() => setHelp(false), []);
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);
  const d = derived(s);
  const event = events.find((e) => e.id === s.activeEvent);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (s.lastMessage && screen === "game") {
      setNotice(s.lastMessage);
      const id = setTimeout(() => setNotice(""), 7000);
      return () => clearTimeout(id);
    }
  }, [s.lastMessage, screen]);
  if (screen === "create")
    return (
      <Creation
        onBack={() => setScreen("menu")}
        onDone={() => {
          setScreen("game");
          setPage("jianghu");
        }}
      />
    );
  return (
    <>
      {screen === "menu" ? (
        <div className="menu-page">
          <div className="menu-art" />
          <div className="menu-top">
            <span className="brand-small">
              江湖行 <Seal>杭州篇</Seal>
            </span>
            <button className="text-button" onClick={() => setHelp(true)}>
              初入江湖须知 <Icon name="help" size={16} />
            </button>
          </div>
          <main className="menu-content">
            <div className="menu-kicker">
              <span /> 开放式文字武侠 · 杭州卷
            </div>
            <h1>
              江湖<span>行</span>
              <Seal>一念之间</Seal>
            </h1>
            <p className="menu-poem">
              一纸江湖，万般人生。
              <br />
              山水有相逢，来去皆由你。
            </p>
            <div className="menu-actions">
              <Button
                kind="ink"
                onClick={() => {
                  if (s.started) setHelp(false);
                  setScreen("create");
                }}
              >
                <Icon name="feather" />
                初入江湖 <Icon name="right" size={16} />
              </Button>
              {s.started && (
                <Button onClick={() => setScreen("game")}>
                  <Icon name="book" />
                  续写前缘 <span className="small">{s.player.name}</span>
                  <Icon name="right" size={16} />
                </Button>
              )}
              <button
                className="text-button menu-load"
                onClick={() => setSaveOpen(true)}
              >
                <Icon name="save" size={16} />
                读取存档
              </button>
            </div>
            <div className="menu-note">
              <span className="vertical-line" />
              少一些匆忙，多一段属于你的江湖。
            </div>
          </main>
          <div className="menu-footer">
            <span>大胤十二年 · 杭州</span>
            <span>第一卷 · 烟雨初逢</span>
            <span>山水间，自有故事</span>
          </div>
        </div>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <button
              className="brand"
              onClick={() => setScreen("menu")}
              aria-label="返回主菜单"
            >
              <span>江湖行</span>
              <Seal>江湖</Seal>
              <small>一纸江湖 · 万般人生</small>
            </button>
            <div className="side-caption">行 走 江 湖</div>
            <nav>
              {mainNav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  className={page === n.id ? "active" : ""}
                >
                  <Icon name={n.icon} />
                  <span>{n.label}</span>
                  {page === n.id && <i />}
                </button>
              ))}
            </nav>
            <div className="side-caption secondary-caption">此 间 故 事</div>
            <nav className="secondary-nav">
              {(
                [
                  { id: "quest", label: "江湖事", icon: "scroll" },
                  { id: "identity", label: "身份司簿", icon: "shield" },
                  { id: "journal", label: "江湖手记", icon: "feather" },
                ] as const
              ).map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  className={page === n.id ? "active" : ""}
                >
                  <Icon name={n.icon} />
                  <span>{n.label}</span>
                  {n.id === "quest" &&
                    !["locked", "available", "completed"].includes(
                      s.quest.stage,
                    ) && <span className="nav-dot" />}
                </button>
              ))}
            </nav>
            <div className="side-bottom">
              <button
                className="side-player"
                onClick={() => navigate("character")}
              >
                <Portrait size="small" />
                <span>
                  <b>{s.player.name}</b>
                  <small>
                    {s.identity.rank === 2
                      ? "资深捕快"
                      : s.identity.rank === 1
                        ? "杭州捕快"
                        : "初入江湖"}
                  </small>
                </span>
                <Icon name="right" size={14} />
              </button>
              <button
                className="save-control"
                onClick={() => setSaveOpen(true)}
              >
                <Icon name="save" size={16} />
                存档与设置
                <span className="saved-dot" />
              </button>
            </div>
          </aside>
          <div className="app-body">
            <header className="topbar">
              <div className="breadcrumb">
                <span>江南</span>
                <span>/</span>
                <b>杭州</b>
                <span className="weather">
                  <Icon name={s.time % 6 >= 4 ? "moon" : "sun"} size={14} />
                  {s.time % 6 >= 4 ? "月色清明" : "薄云微风"}
                </span>
              </div>
              <div className="topbar-right">
                <span className="date">大胤十二年 · {timeLabel(s.time)}</span>
                <button
                  className="icon-button mobile-save"
                  aria-label="存档与设置"
                  onClick={() => setSaveOpen(true)}
                >
                  <Icon name="save" size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="玩法说明"
                  onClick={() => setHelp(true)}
                >
                  <Icon name="help" size={18} />
                </button>
              </div>
            </header>
            <main className="workspace">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    JIANG HU · {page === "jianghu" ? "HANGZHOU" : "CHRONICLES"}
                  </div>
                  <h1>
                    {pageTitles[page][0]}
                    <Seal>{page === "jianghu" ? "杭州" : "江湖"}</Seal>
                  </h1>
                  <p>{pageTitles[page][1]}</p>
                </div>
                <div className="heading-art" />
                <span className="heading-poem">
                  人间有味是清欢
                  <br />
                  半城烟雨半城诗
                </span>
              </div>
              {storageError && (
                <div className="error-banner" role="alert">
                  {storageError}
                  <button onClick={() => setSaveOpen(true)}>管理存档</button>
                </div>
              )}
              <div
                className={`content-layout ${["map", "npc", "inventory", "arts"].includes(page) ? "full-content" : ""}`}
              >
                <div className="primary-content">
                  {page === "jianghu" && (
                    <Jianghu s={s} onNpc={setNpc} navigate={navigate} />
                  )}
                  {page === "npc" && <People s={s} onNpc={setNpc} />}
                  {page === "character" && (
                    <Character s={s} navigate={navigate} onItem={setItem} />
                  )}
                  {page === "inventory" && <Inventory s={s} onItem={setItem} />}
                  {page === "arts" && <Martial s={s} navigate={navigate} />}
                  {page === "map" && (
                    <WorldMap
                      s={s}
                      onTravel={(id) => {
                        act({ type: "move", id });
                        navigate("jianghu");
                      }}
                    />
                  )}
                  {page === "quest" && <Quest s={s} navigate={navigate} />}
                  {page === "identity" && (
                    <Identity s={s} navigate={navigate} />
                  )}
                  {page === "journal" && <Journal s={s} />}
                </div>
                {!["map", "npc", "inventory", "arts"].includes(page) && (
                  <aside className="right-sidebar">
                    <div className="player-summary">
                      <div className="player-summary-head">
                        <Portrait size="small" />
                        <div>
                          <h3>{s.player.name}</h3>
                          <span>
                            {
                              origins.find((o) => o.id === s.player.origin)
                                ?.name
                            }{" "}
                            · {s.identity.rank ? "官府捕快" : "江湖游侠"}
                          </span>
                        </div>
                        <button
                          className="icon-button"
                          aria-label="查看人物"
                          onClick={() => navigate("character")}
                        >
                          <Icon name="right" size={16} />
                        </button>
                      </div>
                      <Meter
                        label="气血"
                        value={s.player.hp}
                        max={d.maxHp}
                        color="red"
                      />
                      <Meter label="内力" value={s.player.qi} max={d.maxQi} />
                      <div className="summary-numbers">
                        <span>
                          <Icon name="coins" size={15} />
                          {s.player.silver}
                          <small>两</small>
                        </span>
                        <span>
                          <Icon name="flag" size={15} />
                          {s.player.fame}
                          <small>名望</small>
                        </span>
                      </div>
                    </div>
                    <Section
                      title="此间要事"
                      aside={
                        <button
                          className="text-button"
                          onClick={() => navigate("quest")}
                        >
                          查看 <Icon name="right" size={13} />
                        </button>
                      }
                    >
                      <div className="mini-quest">
                        <div className="mini-quest-kicker">杭州 · 官府缉捕</div>
                        <h3>烟雨楼盗案</h3>
                        <p>
                          {s.quest.stage === "locked"
                            ? "烟雨楼失窃，城中流言四起。到官府见见陆捕头，或许能知晓原委。"
                            : s.quest.stage === "completed"
                              ? "案已告破，风波渐息。你的选择，已成为这座城的一部分。"
                              : `当前：${stageLabels[s.quest.stage]}。循着线索，让这桩盗案有个交代。`}
                        </p>
                        <button
                          onClick={() => navigate("quest")}
                          className="quest-link"
                        >
                          {s.quest.stage === "completed"
                            ? "翻阅结案卷宗"
                            : "展开案卷"}
                          <Icon name="right" size={14} />
                        </button>
                      </div>
                    </Section>
                    <Section title="江湖手记">
                      <div className="mini-journal">
                        {s.journal.slice(0, 3).map((j, i) => (
                          <div key={i}>
                            <time>{timeLabel(j.time)}</time>
                            <p>{j.text}</p>
                          </div>
                        ))}
                        <button
                          className="text-button"
                          onClick={() => navigate("journal")}
                        >
                          翻阅往事 <Icon name="right" size={13} />
                        </button>
                      </div>
                    </Section>
                    <p className="side-quote">
                      “莫愁前路无知己，
                      <br />
                      天下谁人不识君。”
                    </p>
                  </aside>
                )}
              </div>
              <footer className="page-footer">
                <span>江湖路远，且行且记。</span>
                <span>
                  <span className="saved-dot" />
                  {storageError ? "存档需留意" : "行迹已自动存档"}
                </span>
              </footer>
            </main>
          </div>
          <nav className="mobile-nav">
            {(
              [
                { id: "inventory", label: "行囊", icon: "bag" },
                { id: "character", label: "人物", icon: "user" },
                { id: "jianghu", label: "江湖", icon: "mountain" },
                { id: "arts", label: "武学", icon: "book" },
                { id: "map", label: "地图", icon: "map" },
              ] as const
            ).map((n) => (
              <button
                key={n.id}
                className={
                  page === n.id ||
                  (n.id === "character" && ["npc", "identity"].includes(page))
                    ? "active"
                    : ""
                }
                onClick={() => navigate(n.id)}
              >
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          {notice && (
            <div className="toast" role="status">
              <Icon name="feather" size={16} />
              <span>{notice}</span>
              <button aria-label="收起提示" onClick={() => setNotice("")}>
                <Icon name="close" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      {saveOpen && (
        <SavePanel
          onClose={closeSave}
          onLoaded={() => {
            setSaveOpen(false);
            setScreen("game");
          }}
          onMenu={() => {
            setSaveOpen(false);
            setScreen("menu");
          }}
        />
      )}
      {help && (
        <Modal title="初入江湖须知" onClose={closeHelp}>
          <p className="prose">你的每一次选择，都会在这座城留下痕迹。</p>
          <div className="guide-list">
            <div>
              <Icon name="map" />
              <span>
                <b>走进杭州</b>
                <p>
                  地图上的八处地点都可前往。移动、交谈与修习会推进时辰；深夜有些人会换个去处。
                </p>
              </span>
            </div>
            <div>
              <Icon name="users" />
              <span>
                <b>认识故人</b>
                <p>
                  交谈、送礼、相助会改变好感与信任。曾经帮过的人，也许会在追踪中为你指路。
                </p>
              </span>
            </div>
            <div>
              <Icon name="shield" />
              <span>
                <b>第一桩案子</b>
                <p>
                  到官府入职捕快，接取《烟雨楼盗案》。备齐两条绳索、一条布条，循烟雨楼、后巷、旧码头查案。
                </p>
              </span>
            </div>
            <div>
              <Icon name="save" />
              <span>
                <b>留下你的故事</b>
                <p>
                  每次行动都会自动存档，也可使用三个手动存档位或导出文件。新故事会将旧进度保留在“上一段江湖”。
                </p>
              </span>
            </div>
          </div>
          <p className="muted small">
            杭州篇 v0.1 · 回合制文字 RPG · 进度保存在当前浏览器
          </p>
        </Modal>
      )}
      {screen === "game" && npc && (
        <NpcDetail
          npc={npc}
          s={s}
          onClose={closeNpc}
          navigate={(p) => {
            setNpc(null);
            navigate(p);
          }}
        />
      )}
      {screen === "game" && item && (
        <ItemDetail item={item} s={s} onClose={closeItem} />
      )}
      {screen === "game" && event && (
        <Modal title={event.title}>
          <p className="event-overline">
            {locations.find((l) => l.id === event.location)?.name} · 偶然相逢
          </p>
          <p className="event-prose">{event.text}</p>
          <div className="event-options">
            {event.choices.map((c) => (
              <ActionRow
                key={c.id}
                icon="feather"
                title={c.text}
                description={c.hint}
                disabled={!meets(s, c.requirements)}
                onClick={() => act({ type: "choice", id: c.id })}
              />
            ))}
          </div>
        </Modal>
      )}
      {screen === "game" && s.combat && <Combat s={s} />}
      {screen === "game" && s.quest.stage === "defeated" && <Custody s={s} />}
    </>
  );
}
