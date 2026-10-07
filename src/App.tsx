import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { InkNavIcon, PaperEnding, NavCorners } from "./components/InkOrnaments";
import { Creation } from "./pages/Creation";
import { Jianghu } from "./pages/Jianghu";
import { Character } from "./pages/Character";
import { Martial } from "./pages/Martial";
import { WorldMap } from "./pages/WorldMap";
import { Quest } from "./pages/Quest";
import { Identity } from "./pages/Identity";
import { Journal } from "./pages/Journal";
import { Combat } from "./pages/Combat";
import { Custody } from "./pages/Custody";
import { SavePanel } from "./pages/SavePanel";
import {
  Header,
  People,
  Detail,
  Equipment,
  ItemDialog,
} from "./components/InkUI";
import { Icon, Button, Modal, ActionRow } from "./components/UI";
import { Relations } from "./pages/Relations";
import { useGame } from "./store";
import { locations, timeLabel } from "./data/world";
import { events } from "./data/events";
import { meets } from "./engine/game";
import type { NPC, Item, Page } from "./types";

const titles: Record<Page, [string, string]> = {
  jianghu: ["江湖行", "山水一程，幸会相逢"],
  character: ["我的人物", "见天地，见众生，见自己"],
  npc: ["人物谱", "江湖中与你相逢的人"],
  arts: ["武学录", "一招一式，皆是修行"],
  inventory: ["装备谱", "行走江湖，器甲相随"],
  map: ["天下舆图", "山河远阔，来日方长"],
  quest: ["缉捕令", "官府悬赏，循迹追缉"],
  identity: ["身份司簿", "有所担当，方为江湖中人"],
  journal: ["江湖手记", "一笔一划，记下自己的故事"],
};
const navigation: [Page, string, string][] = [
  ["inventory", "行囊", "bag"],
  ["npc", "人物", "users"],
  ["jianghu", "江湖", "mountain"],
  ["arts", "武学", "book"],
  ["map", "地图", "map"],
];
export default function App() {
  const { game: s, act, storageError } = useGame();
  const [screen, setScreen] = useState<"menu" | "create" | "game">("menu"),
    [page, setPage] = useState<Page>("jianghu"),
    [npc, setNpc] = useState<NPC | null>(null),
    [item, setItem] = useState<Item | null>(null),
    [saveOpen, setSaveOpen] = useState(false),
    [help, setHelp] = useState(false),
    [relations, setRelations] = useState(false),
    [notice, setNotice] = useState("");
  const heading = useRef<HTMLElement>(null);
  const closeSave = useCallback(() => setSaveOpen(false), []),
    closeHelp = useCallback(() => setHelp(false), []);
  const navigate = (p: Page) => {
    setPage(p);
    setNpc(null);
    setItem(null);
    setRelations(false);
    setNotice("");
  };
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [screen, page, npc, relations]);
  useEffect(() => {
    if (s.lastMessage && screen === "game") {
      setNotice(s.lastMessage);
      const timer = window.setTimeout(() => setNotice(""), 7000);
      return () => window.clearTimeout(timer);
    }
  }, [s.lastMessage, screen]);
  const event = events.find((e) => e.id === s.activeEvent);
  const modalActive = !!(
    saveOpen ||
    help ||
    item ||
    s.combat ||
    s.quest.stage === "defeated" ||
    event
  );
  return (
    <div className="game-layout">
      <main className="paper game-paper" ref={heading} tabIndex={-1}>
        {screen === "menu" ? (
          <>
            <Header title="江湖行" subtitle="一纸江湖 · 万般人生" />
            <section className="main-menu">
              <p className="menu-verse">
                千山万水，因人而有故事。
                <br />
                这一程江湖，等你落笔。
              </p>
              <div className="menu-buttons">
                <Button kind="ink" onClick={() => setScreen("create")}>
                  <Icon name="feather" />
                  开始江湖
                  <Icon name="right" />
                </Button>
                <Button disabled={!s.started} onClick={() => setScreen("game")}>
                  <Icon name="mountain" />
                  继续游历
                  <Icon name="right" />
                </Button>
                <Button onClick={() => setSaveOpen(true)}>
                  <Icon name="save" />
                  存档与设置
                  <Icon name="right" />
                </Button>
                <Button onClick={() => setHelp(true)}>
                  <Icon name="book" />
                  初入江湖须知
                  <Icon name="right" />
                </Button>
              </div>
              {s.started && (
                <p className="secondary">
                  {s.player.name} ·{" "}
                  {locations.find((l) => l.id === s.location)?.name}
                  <br />
                  {timeLabel(s.time)} · 续写上次的故事
                </p>
              )}
              <span className="menu-seal">杭州篇</span>
            </section>
          </>
        ) : screen === "create" ? (
          <>
            <Header title="初入江湖" subtitle="定下名姓，自立身世" />
            <div className="page-content">
              <Creation
                onBack={() => setScreen("menu")}
                onDone={() => {
                  navigate("jianghu");
                  setScreen("game");
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="game-topbar">
              <span>
                杭州 · {locations.find((l) => l.id === s.location)?.name}
              </span>
              <span>{timeLabel(s.time)}</span>
              <button
                className="icon-button"
                aria-label="存档与设置"
                onClick={() => setSaveOpen(true)}
              >
                <Icon name="save" />
              </button>
            </div>
            <Header
              title={npc ? "人物谱" : relations ? "羁绊图" : titles[page][0]}
              subtitle={
                npc
                  ? titles.npc[1]
                  : relations
                    ? "江湖中的人与缘"
                    : titles[page][1]
              }
              equipment={page === "inventory"}
            />
            <div className="page-content">
              {storageError && (
                <div className="error-banner" role="alert">
                  {storageError}
                  <button
                    className="outline-button"
                    onClick={() => setSaveOpen(true)}
                  >
                    管理存档
                  </button>
                </div>
              )}
              {npc ? (
                <Detail
                  s={s}
                  n={npc}
                  act={act}
                  back={() => navigate("npc")}
                  navigate={navigate}
                />
              ) : (
                <>
                  {page === "npc" && (
                    <>
                      <div className="people-tools">
                        <button
                          className="text-button"
                          onClick={() => navigate("character")}
                        >
                          <Icon name="user" />
                          我的人物
                        </button>
                        <button
                          className="text-button"
                          onClick={() => setRelations(!relations)}
                        >
                          <Icon name="users" />
                          {relations ? "返回人物谱" : "查看羁绊图"}
                        </button>
                      </div>
                      {relations ? (
                        <Relations s={s} select={setNpc} />
                      ) : (
                        <People s={s} select={setNpc} />
                      )}
                    </>
                  )}
                  {page === "inventory" && <Equipment s={s} act={act} />}
                  {page === "jianghu" && (
                    <Jianghu s={s} onNpc={setNpc} navigate={navigate} />
                  )}
                  {page === "character" && (
                    <Character s={s} navigate={navigate} onItem={setItem} />
                  )}
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
                </>
              )}
              <nav className="utility-nav" aria-label="更多功能">
                {(
                  [
                    ["character", "我的人物"],
                    ["identity", "身份司簿"],
                    ["quest", "缉捕令"],
                    ["journal", "江湖手记"],
                  ] as [Page, string][]
                ).map(([p, label]) => (
                  <button
                    key={p}
                    aria-current={page === p ? "page" : undefined}
                    onClick={() => navigate(p)}
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => setHelp(true)}>玩法说明</button>
                <button onClick={() => setScreen("menu")}>返回首页</button>
              </nav>
              <p className="save-indicator">
                {storageError ? "存档需留意" : "行迹已自动存档"}
              </p>
            </div>
            <PaperEnding />
            <nav className="bottom-nav" aria-label="主导航">
              <NavCorners />
              {navigation.map(([p, label, icon]) => (
                <button
                  key={p}
                  aria-current={
                    page === p ||
                    (p === "npc" && ["character", "identity"].includes(page))
                      ? "page"
                      : undefined
                  }
                  onClick={() => navigate(p)}
                >
                  <InkNavIcon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </main>
      {notice && screen === "game" && !modalActive && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <Icon name="close" />
          </button>
        </div>
      )}
      {saveOpen && (
        <SavePanel
          onClose={closeSave}
          onLoaded={() => {
            closeSave();
            navigate("jianghu");
            setScreen("game");
          }}
          onMenu={() => {
            closeSave();
            setScreen("menu");
          }}
        />
      )}
      {help && (
        <Modal title="初入江湖须知" onClose={closeHelp}>
          <div className="guide-list">
            <p>
              八处地点都可前往。移动、交谈、修习会推进时辰，入夜后有些人会换个去处。
            </p>
            <p>
              人物谱中可查看位置、当面交谈与赠礼。信任会影响消息、价格与剧情。
            </p>
            <p>
              到官府拜见陆捕头，入职捕快并接取《烟雨楼盗案》。准备两条绳索、一条布条，循烟雨楼、后巷、旧码头查案。
            </p>
            <p>
              每次行动自动存档。可使用三个手动存档位，或导出文件留存。进度保存在当前浏览器。
            </p>
          </div>
        </Modal>
      )}
      {screen === "game" && item && (
        <ItemDialog item={item} s={s} act={act} close={() => setItem(null)} />
      )}
      {screen === "game" && event && (
        <Modal title={event.title}>
          <p className="eyebrow">
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
    </div>
  );
}
