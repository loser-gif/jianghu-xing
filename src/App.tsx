import { Living } from "./pages/Living";
import { Sect } from "./pages/Sect";
import { Court } from "./pages/Court";
import { Forge } from "./pages/Forge";
import { CalendarPage, LifeEnding } from "./pages/Calendar";
import { DesktopNav } from "./components/DesktopNav";
import { Trial } from "./pages/Trial";
import { Guide } from "./pages/Guide";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { InkNavIcon, PaperEnding, NavCorners } from "./components/InkOrnaments";
import { Creation } from "./pages/Creation";
import { MainMenu } from "./pages/MainMenu";
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
import { Icon, Modal, ActionRow } from "./components/UI";
import { Relations } from "./pages/Relations";
import { useGame } from "./store";
import { locations, timeLabel } from "./data/world";
import { events } from "./data/events";
import { meets } from "./engine/game";
import type { NPC, Item, Page } from "./types";

const titles: Record<Page, [string, string]> = {
  forge: ["百炼坊", "炉火不熄，旧器新锋"],
  court: ["朝廷案牍", "察事明理，守一方清平"],
  sect: ["宗门志", "师承有来处，薪火自相传"],
  living: ["百业生活", "一技立身，烟火亦江湖"],
  calendar: ["岁时录", "看年岁流转，惜此生光阴"],
  trial: ["问心试炼", "三十层试剑，步步见成长"],
  guide: ["江湖路引", "先知去处，再行江湖"],
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
const pageHints: Partial<Record<Page, string>> = {
  inventory:
    "点击物品查看详情与换装对比；新装备要点「装备」。在铁匠铺打开装备详情可强化。",
  arts: "先看上方人物境界，再看下方武学。已有武学点「静心修习」；外功招式点「设为出战」。",
  map: "先选地图上的地点，再点「动身前往」。查看地图不耗时，实际移动消耗两时辰。",
  npc: "人物详情可查看所在地。交谈、赠礼与请教需要当面进行；深夜人物可能换地方。",
  character:
    "基础属性影响战斗与事件；守关首通获得的潜能可在下方分配。提升气血上限不会自动回血。",
  quest:
    "委托与官府案卷各自推进。接下盗案后限八个游戏日完成，步骤与缺少的道具会显示在案卷中。",
  identity: "捕快是一条可选成长路线。先到官府入职，办案获得贡献后再申请晋升。",
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
  const previousMessage = useRef(s.lastMessage);
  const positions = useRef<Record<string, number>>({});
  const viewKey = `${screen}/${page}/${npc?.id ?? "list"}/${relations}/${page === "jianghu" ? s.location : ""}`;
  const [peopleFilters, setPeopleFilters] = useState({
    query: "",
    category: "全部",
    known: false,
  });
  const [equipmentFilters, setEquipmentFilters] = useState({
    query: "",
    category: "全部",
  });
  const [artFilter, setArtFilter] = useState("全部");
  const resetBrowsing = () => {
    positions.current = {};
    setPeopleFilters({ query: "", category: "全部", known: false });
    setEquipmentFilters({ query: "", category: "全部" });
    setArtFilter("全部");
  };
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
    window.scrollTo({
      top: positions.current[viewKey] ?? 0,
      behavior: "instant",
    });
    heading.current?.focus({ preventScroll: true });
    const remember = () => {
      positions.current[viewKey] = window.scrollY;
    };
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, [viewKey]);
  useEffect(() => {
    const changed = previousMessage.current !== s.lastMessage;
    previousMessage.current = s.lastMessage;
    if (changed && s.lastMessage && screen === "game") {
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
    <div
      className={`game-layout ${screen === "menu" ? "opening-layout" : screen === "game" ? "playing-layout" : "creation-layout-shell"}`}
    >
      {screen === "game" && (
        <DesktopNav
          s={s}
          page={page}
          navigate={navigate}
          onSave={() => setSaveOpen(true)}
          onHelp={() => setHelp(true)}
          onMenu={() => setScreen("menu")}
        />
      )}
      <main
        className={`paper game-paper ${screen === "menu" ? "opening-paper" : ""}`}
        ref={heading}
        tabIndex={-1}
      >
        {screen === "menu" ? (
          <MainMenu
            s={s}
            paused={saveOpen || help}
            onStart={() => setScreen("create")}
            onContinue={() => {
              if (s.combat?.kind === "trial") navigate("trial");
              else if (s.court.active) navigate("court");
              setScreen("game");
            }}
            onSave={() => setSaveOpen(true)}
            onHelp={() => setHelp(true)}
          />
        ) : screen === "create" ? (
          <>
            <Header title="初入江湖" subtitle="定下名姓，自立身世" />
            <div className="page-content page-arrival" key="creation">
              <Creation
                onBack={() => setScreen("menu")}
                onDone={() => {
                  resetBrowsing();
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
              <button
                className="text-button calendar-link"
                onClick={() => navigate("calendar")}
              >
                {timeLabel(s.time)}
              </button>
              <button
                className="topbar-guide"
                onClick={() => navigate("guide")}
              >
                <Icon name="compass" size={16} />
                玩法指引
              </button>
              <button
                className="icon-button"
                aria-label="存档与设置"
                onClick={() => setSaveOpen(true)}
              >
                <Icon name="save" />
              </button>
            </div>
            <LifeEnding
              s={s}
              navigate={navigate}
              onSave={() => setSaveOpen(true)}
              onMenu={() => setScreen("menu")}
            />
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
            {!npc && !relations && pageHints[page] && (
              <p className="page-hint">{pageHints[page]}</p>
            )}
            <div
              className={`page-content page-arrival content-${npc ? "detail" : relations ? "relations" : page}`}
              key={`${page}-${npc?.id ?? "list"}-${relations}`}
            >
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
                        <People
                          s={s}
                          select={setNpc}
                          filters={peopleFilters}
                          onFilters={setPeopleFilters}
                        />
                      )}
                    </>
                  )}
                  {page === "inventory" && (
                    <Equipment
                      s={s}
                      act={act}
                      filters={equipmentFilters}
                      onFilters={setEquipmentFilters}
                    />
                  )}
                  {page === "jianghu" && (
                    <Jianghu s={s} onNpc={setNpc} navigate={navigate} />
                  )}
                  {page === "character" && (
                    <Character s={s} navigate={navigate} onItem={setItem} />
                  )}
                  {page === "arts" && (
                    <Martial
                      s={s}
                      navigate={navigate}
                      filter={artFilter}
                      setFilter={setArtFilter}
                    />
                  )}
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
                  {page === "trial" && <Trial s={s} navigate={navigate} />}
                  {page === "guide" && <Guide s={s} navigate={navigate} />}
                  {page === "living" && <Living s={s} navigate={navigate} />}
                  {page === "sect" && <Sect s={s} navigate={navigate} />}
                  {page === "court" && <Court s={s} navigate={navigate} />}
                  {page === "forge" && <Forge s={s} navigate={navigate} />}
                  {page === "calendar" && (
                    <CalendarPage s={s} navigate={navigate} />
                  )}
                </>
              )}
              <nav className="utility-nav" aria-label="更多功能">
                {(
                  [
                    ["guide", "江湖路引"],
                    ["living", "百业生活"],
                    ["forge", "百炼坊"],
                    ["sect", "宗门与传承"],
                    ["court", "朝廷案牍"],
                    ["calendar", "岁时与寿元"],
                    ["trial", "试炼塔"],
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
        <div className="toast" role="status" key={notice}>
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
            resetBrowsing();
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
              <b>第一次玩：</b>
              先看行囊里的初始装备，再到武学录练一次已学武学，然后去西湖试炼塔挑战第一层。首页会根据你的进度推荐下一步。
            </p>
            <p>
              气血是生命，内力用于出招；修为用于人物破境，熟练度用于武学成长。切换页面不消耗时间，不必一开始就接官府案子。
            </p>
            {s.started && (
              <button
                className="ink-button full"
                onClick={() => {
                  closeHelp();
                  setScreen("game");
                  navigate("guide");
                }}
              >
                打开完整路引与玩法路线
              </button>
            )}
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
