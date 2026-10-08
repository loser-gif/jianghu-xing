import { useEffect, useId, useRef, useState } from "react";
import { PlayerPortrait } from "./PlayerPortrait";
import { npcRealms } from "../engine/cultivation";
import { artUrl } from "../artAssets";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Feather,
  Footprints,
  FlaskConical,
  Gem,
  Hand,
  Heart,
  KeyRound,
  Lasso,
  Leaf,
  Map,
  MapPin,
  MessageCircle,
  Mountain,
  Search,
  Shield,
  Shirt,
  SlidersHorizontal,
  ScrollText,
  Sword,
  UsersRound,
  Wine,
  Wind,
  Coffee,
  X,
} from "lucide-react";
import { items, locations, npcs } from "../data/world";
import { derived, relationLabel } from "../engine/game";
import type { Action } from "../engine/game";
import { equipmentPreview } from "../engine/equipment";
import { currentNpcLocation, npcService } from "../engine/people";
import type { GameState, Item, NPC, Page } from "../types";

// Only illustration interiors are shown. Every letter, control and frame is live UI.
export function Art({
  figure,
  rect,
  className = "",
  label,
  fit = "xMidYMid slice",
}: {
  figure: number;
  rect: [number, number, number, number];
  className?: string;
  label?: string;
  fit?: string;
}) {
  const clip = useId();
  return (
    <svg
      className={`art ${className}`}
      viewBox={rect.join(" ")}
      preserveAspectRatio={fit}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} />
        </clipPath>
      </defs>
      <image
        clipPath={`url(#${clip})`}
        href={artUrl(`reference/figure-${figure}.jpg`)}
        width={figure === 1 ? 1200 : 850}
        height={figure === 1 ? 1097 : 1510}
      />
    </svg>
  );
}
const portraits: Record<string, [number, [number, number, number, number]]> = {
  suwan: [9, [104, 202, 314, 292]],
  baizhi: [10, [28, 978, 250, 234]],
  shao: [8, [32, 870, 190, 132]],
  swordsman: [8, [32, 1025, 190, 129]],
  lu: [8, [32, 1181, 190, 132]],
  gu: [18, [105, 513, 220, 330]],
  player: [15, [326, 300, 172, 235]],
};
export function Portrait({
  id,
  className = "",
  list = false,
  gender = "male",
}: {
  id: string;
  className?: string;
  list?: boolean;
  gender?: "male" | "female";
}) {
  if (id === "player")
    return (
      <PlayerPortrait gender={gender} className={`portrait-art ${className}`} />
    );
  const [figure, rect] = portraits[id];
  return (
    <Art
      figure={figure}
      rect={rect}
      className={`portrait-art ${list ? "list-portrait" : ""} ${className}`}
      fit="xMidYMid slice"
      label={
        id === "player"
          ? "你的角色肖像"
          : `${npcs.find((n) => n.id === id)?.name}的肖像`
      }
    />
  );
}
export function Header({
  equipment = false,
  title,
  subtitle,
}: {
  equipment?: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <header className="page-heading">
      <Art figure={8} rect={[391, 0, 363, 244]} className="landscape" />
      <Art figure={8} rect={[0, 0, 70, 164]} className="bamboo" />
      <div className="heading-inscription" aria-hidden="true">
        <span>{equipment ? "十年仗剑行天下" : "相逢何必曾相识"}</span>
        <span>{equipment ? "一器随身伴明月" : "江湖一见即故人"}</span>
        <i>江湖</i>
      </div>
      <div className="heading-copy">
        <div className="heading-title">
          <h1>{title || (equipment ? "装备谱" : "人物谱")}</h1>
          <span className="seal">江湖</span>
        </div>
        <p className="heading-subtitle">
          {subtitle ||
            (equipment ? "行走江湖，器甲相随" : "江湖中与你相逢的人")}
        </p>
        <p className="heading-poem">
          {equipment ? (
            <>
              好兵利器，亦是故人相伴。
              <br />
              一器在手，山河不远。
            </>
          ) : (
            <>
              千山万水，因人而有故事。
              <br />
              江湖路远，幸与君相逢。
            </>
          )}
        </p>
      </div>
    </header>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Tabs({
  options,
  value,
  onChange,
  label,
}: {
  options: string[];
  value: string;
  onChange: (s: string) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {options.map((v) => (
        <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}
export function Panel({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <Art figure={8} rect={[0, 0, 70, 164]} className="panel-bamboo" />
      <h2>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
export function Meter({
  label,
  value,
  red = false,
}: {
  label: string;
  value: number;
  red?: boolean;
}) {
  return (
    <div className={`meter ${red ? "red" : ""}`}>
      <div>
        <span>{label}</span>
        <strong>
          {value}
          <small> / 100</small>
        </strong>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="meter-track"
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function People({
  s,
  select,
}: {
  s: GameState;
  select: (n: NPC) => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("全部"),
    [known, setKnown] = useState(false);
  const list = npcs.filter(
    (n) =>
      (!known || s.relationships[n.id].met) &&
      (category === "全部" ||
        n.category === category ||
        (category === "同伴" && s.relationships[n.id].trust >= 55)) &&
      (n.name + n.role + n.tags.join("")).includes(query.trim()),
  );
  return (
    <>
      <div className="search-row">
        <label className="search">
          <Search />
          <input
            aria-label="搜索人物"
            placeholder="姓名、身份或关键词"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="清空搜索" onClick={() => setQuery("")}>
              <X />
            </button>
          )}
        </label>
        <button
          className="filter-button"
          aria-pressed={known}
          onClick={() => setKnown(!known)}
        >
          <SlidersHorizontal />
          <span>{known ? "已相识" : "筛选"}</span>
        </button>
      </div>
      <Tabs
        options={["全部", "同伴", "重要人物", "门派", "市井", "敌对"]}
        value={category}
        onChange={setCategory}
        label="人物分类"
      />
      <div className="people-list">
        {list.map((n) => (
          <button
            className="person-row"
            key={n.id}
            onClick={() => select(n)}
            aria-label={`查看${n.name}`}
          >
            <Portrait id={n.id} list />
            <div className="person-main">
              <h2>
                {n.name}
                <span className="gender">{n.gender}</span>
              </h2>
              <p>
                {n.role} · {npcRealms[n.id]}
              </p>
              <div className="tags">
                {n.tags.slice(0, 2).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="person-meta">
              <span className="place">
                <MapPin />
                {locations.find((l) => l.id === currentNpcLocation(n, s))?.name}
              </span>
              <Badge tone={s.relationships[n.id].met ? "green" : ""}>
                {relationLabel(s.relationships[n.id])}
              </Badge>
              <p>“{n.quote}”</p>
            </div>
            <ChevronRight className="row-arrow" />
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <UsersRound />
          <h2>此间未寻到故人</h2>
          <p>试试其他名字，或放宽筛选条件。</p>
          <button
            className="outline-button"
            onClick={() => {
              setQuery("");
              setCategory("全部");
              setKnown(false);
            }}
          >
            查看全部人物
          </button>
        </div>
      )}
      <footer className="collection-foot">
        <span>
          共 {list.length} 位 · 已相识{" "}
          {npcs.filter((n) => s.relationships[n.id].met).length} 位
        </span>
        <span>相逢即是缘</span>
      </footer>
    </>
  );
}
export function Detail({
  s,
  n,
  act,
  back,
  navigate,
}: {
  s: GameState;
  n: NPC;
  act: (a: Action) => void;
  back: () => void;
  navigate?: (p: Page) => void;
}) {
  const [tab, setTab] = useState("资料");
  const relation = s.relationships[n.id],
    placeId = currentNpcLocation(n, s),
    here = s.location === placeId;
  const place = locations.find((l) => l.id === placeId)?.name;
  const gift = items.find((i) => i.id === n.gift)!;
  const service = npcService(n, s);
  return (
    <>
      <button className="back-button" onClick={back}>
        <ArrowLeft />
        返回人物谱
      </button>
      <section className="profile-hero">
        <Portrait id={n.id} />

        <div>
          <div className="profile-name">
            <h2>{n.name}</h2>
            <span className="gender">{n.gender}</span>
          </div>
          <p>
            {n.role} · {npcRealms[n.id]}
          </p>
          <blockquote>“{n.quote}”</blockquote>
          <span className="place">
            <MapPin />
            杭州 · {place}
          </span>
        </div>
      </section>
      <Tabs
        options={["资料", "关系", "往事"]}
        value={tab}
        onChange={setTab}
        label="人物详情"
      />
      {tab === "资料" ? (
        <div className="profile-grid">
          <Panel title="基本信息" icon={<UsersRound />} className="facts-panel">
            <dl>
              {[
                ["姓名", n.name],
                ["性别", `${n.gender} · ${n.age} 岁`],
                ["身份", n.role],
                ["所在", `杭州 · ${place}`],
                ["门派", n.faction],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel
            title="性情与交情"
            icon={<Heart />}
            className="relationship-panel"
          >
            <div className="tags">
              {n.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Meter label="好感度" value={relation.favor} red />
            <div className="trust-line">
              <span>信任等级</span>
              <Badge tone="green">{relationLabel(relation)}</Badge>
            </div>
            <div
              className="trust-dots"
              aria-label={`信任度 ${relation.trust} / 100`}
            >
              {[0, 20, 40, 60, 80].map((v) => (
                <i className={relation.trust >= v ? "lit" : ""} key={v} />
              ))}
            </div>
            <p className="secondary">多来坐坐，或许会有新的话与你分享。</p>
          </Panel>
          <Panel
            title="与君相处"
            icon={<MessageCircle />}
            className="interaction-panel"
          >
            <div className="interaction-buttons">
              <button
                disabled={!here || n.id === "gu"}
                onClick={() => act({ type: "talk", id: n.id })}
              >
                <MessageCircle />
                <strong>交谈问候</strong>
                <span>打听江湖消息</span>
              </button>
              <button
                disabled={!here || n.id === "gu" || !s.inventory[n.gift]}
                onClick={() => act({ type: "gift", id: n.id })}
              >
                <Wine />
                <strong>赠送心意</strong>
                <span>
                  {gift.name} ×{s.inventory[n.gift] || 0}
                </span>
              </button>
            </div>
            {!here ? (
              <button
                className="ink-button full"
                onClick={() => act({ type: "move", id: placeId })}
              >
                <MapPin />
                前往{place} · 一时辰
              </button>
            ) : (
              <p className="secondary">
                {n.id === "gu"
                  ? "此人涉案，暂不可交谈与赠礼。"
                  : "交谈或赠礼会推进一个时辰。"}
              </p>
            )}
          </Panel>
          {navigate && (
            <Panel
              title="此人可助"
              icon={<BookOpen />}
              className="service-panel"
            >
              <button
                className="outline-button full"
                onClick={() => {
                  if (service.location && service.location !== s.location)
                    act({ type: "move", id: service.location });
                  navigate(service.page);
                }}
              >
                {service.label}
                <ChevronRight />
              </button>
              <p className="secondary">
                {service.location && service.location !== s.location
                  ? `前往${locations.find((l) => l.id === service.location)?.name}，行程一时辰。`
                  : "查看相关事宜。"}
              </p>
            </Panel>
          )}
          <Panel
            title="人物小传"
            icon={<BookOpen />}
            className="biography-panel"
          >
            <p>{n.description}</p>
            <p className="secondary">
              {n.nightLocation
                ? `入夜之后，常可在${locations.find((l) => l.id === n.nightLocation)?.name}寻到这位故人。`
                : `行走杭州，不妨去${place}坐坐。`}
            </p>
          </Panel>
          <Panel title="往事留痕" icon={<Feather />} className="memories-panel">
            {relation.memories.length ? (
              relation.memories.map((m, i) => (
                <p className="memory" key={i}>
                  {m}
                </p>
              ))
            ) : (
              <p className="secondary">你们的故事，还未落笔。</p>
            )}
          </Panel>
          {n.id === "suwan" && (
            <div className="profile-vignette">
              <p>
                江湖再冷，
                <br />
                也总得有一盏热茶热酒。
              </p>
              <Art
                figure={9}
                rect={[668, 1148, 180, 219]}
                className="vignette-art"
              />
              <span className="seal">故人</span>
            </div>
          )}
        </div>
      ) : tab === "关系" ? (
        <Panel title="相处之间" icon={<Heart />}>
          <Meter label="好感度" value={relation.favor} red />
          <Meter label="信任度" value={relation.trust} />
          <p>
            交谈与赠礼会拉近彼此的距离。信任达到 35 后，熟悉的商人会给你八五折。
          </p>
        </Panel>
      ) : (
        <Panel title="与故人的往事" icon={<Feather />}>
          {relation.memories.length ? (
            relation.memories.map((m, i) => <p key={i}>{m}</p>)
          ) : (
            <p>你们的故事，还未落笔。</p>
          )}
        </Panel>
      )}
    </>
  );
}
const illustratedEquipment = new Set([
  "sword",
  "saber",
  "robe",
  "boots",
  "oldSword",
]);
export function ItemPicture({ item }: { item: Item }) {
  if (illustratedEquipment.has(item.id))
    return (
      <div className="item-art-frame">
        <img
          src={artUrl(`art/equipment/${item.id}.png`)}
          className="item-picture equipment-illustration"
          alt={item.name}
          width="512"
          height="512"
          decoding="async"
        />
      </div>
    );
  const symbols: Record<string, typeof Sword> = {
    sword: Sword,
    shirt: Shirt,
    footprints: Footprints,
    wine: Wine,
    flask: FlaskConical,
    gem: Gem,
    leaf: Leaf,
    tea: Coffee,
    scroll: ScrollText,
    key: KeyRound,
    lasso: Lasso,
    hand: Hand,
    wind: Wind,
  };
  const C = symbols[item.icon] || Backpack;
  return (
    <div className="item-symbol" aria-hidden="true">
      <C />
    </div>
  );
}
export function ItemStats({ item, level }: { item: Item; level: number }) {
  return (
    <div className="tags item-stats">
      {item.attack && <span>外功 +{item.attack + level * 3}</span>}
      {item.defense && <span>防御 +{item.defense}</span>}
      {item.hp && <span>气血 +{item.hp}</span>}
    </div>
  );
}
export function Equipment({
  s,
  act,
}: {
  s: GameState;
  act: (a: Action) => void;
}) {
  const [filter, setFilter] = useState("全部"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Item | null>(null);
  const own = items
    .filter(
      (i) =>
        s.inventory[i.id] > 0 &&
        (filter === "全部" ||
          (filter === "兵器" && i.slot === "weapon") ||
          (filter === "护甲" && ["armor", "feet"].includes(i.slot || "")) ||
          (["消耗", "材料", "任务"].includes(filter) && i.kind === filter)) &&
        (i.name + i.kind + (i.quality || "") + i.description).includes(
          query.trim(),
        ),
    )
    .sort(
      (a, b) =>
        Number(Object.values(s.equipped).includes(b.id)) -
        Number(Object.values(s.equipped).includes(a.id)),
    );
  const stats = derived(s);
  return (
    <>
      <div className="search-row">
        <label className="search">
          <Search />
          <input
            aria-label="搜索装备"
            placeholder="装备名称、类型或关键词"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="清空搜索" onClick={() => setQuery("")}>
              <X />
            </button>
          )}
        </label>
      </div>
      <Tabs
        options={["全部", "兵器", "护甲", "消耗", "材料", "任务"]}
        value={filter}
        onChange={setFilter}
        label="装备分类"
      />
      <section
        className="equipment-summary illustrated-loadout"
        aria-label="随身器甲"
      >
        <div className="loadout-heading">
          <h2>
            {s.player.name}
            <span className="seal small-seal">
              {s.identity.rank >= 2
                ? "资深捕快"
                : s.identity.rank
                  ? "捕快"
                  : "侠客"}
            </span>
          </h2>
          <p>器甲在身，行走更稳</p>
          {!s.flags.guide_equip && (
            <button
              className="text-button"
              onClick={() => act({ type: "equip", id: s.equipped.weapon })}
            >
              检查行装 · 确认随身兵器
            </button>
          )}
        </div>
        <div className="loadout-scene">
          <PlayerPortrait
            gender={s.player.gender}
            full
            className="loadout-figure"
          />
          <div className="loadout">
            {[
              ["weapon", "兵器"],
              ["armor", "衣甲"],
              ["feet", "足部"],
            ].map(([slot, label]) => {
              const equipped = items.find((i) => i.id === s.equipped[slot]);
              const EmptyIcon =
                slot === "weapon"
                  ? Sword
                  : slot === "armor"
                    ? Shirt
                    : Footprints;
              return (
                <button
                  key={slot}
                  onClick={() => {
                    if (equipped) setSelected(equipped);
                    else {
                      setFilter(slot === "weapon" ? "兵器" : "护甲");
                      setQuery("");
                    }
                  }}
                >
                  {equipped ? (
                    <ItemPicture item={equipped} />
                  ) : (
                    <div className="item-symbol">
                      <EmptyIcon aria-hidden="true" />
                    </div>
                  )}
                  <div className="loadout-slot-copy">
                    <span>{label}</span>
                    <strong>
                      {equipped?.name || "未装备 · 选装"}
                      {s.equipped[slot] && s.upgrades[s.equipped[slot]]
                        ? ` +${s.upgrades[s.equipped[slot]]}`
                        : ""}
                    </strong>
                    <small>
                      {equipped ? `${equipped.quality} · 查看` : "点击选装"}
                    </small>
                  </div>
                  <ChevronRight className="loadout-arrow" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="summary-stats">
          <span>
            <Sword />
            外功 <b>{stats.attack}</b>
          </span>
          <span>
            <Shield />
            防御 <b>{stats.defense}</b>
          </span>
          <span>
            <Coins />
            银两 <b>{s.player.silver}</b>
          </span>
        </div>
      </section>
      {stats.set && (
        <p className="selection-note">行云两件套已生效 · 气血上限 +30</p>
      )}
      <div className="equipment-list">
        {own.map((i) => (
          <article className="equipment-row" key={i.id}>
            <button
              className="item-open"
              onClick={() => setSelected(i)}
              aria-label={`查看${i.name}`}
            >
              <ItemPicture item={i} />
              <div>
                <h2>
                  {i.name}
                  {s.upgrades[i.id] ? ` +${s.upgrades[i.id]}` : ""}
                </h2>
                <p className="secondary">
                  {i.kind}
                  {i.quality ? ` · ${i.quality}` : ""} · 持有{" "}
                  {s.inventory[i.id]} 件
                </p>
                <ItemStats item={i} level={s.upgrades[i.id] || 0} />
              </div>
            </button>
            <div className="equipment-action">
              {i.slot ? (
                <button
                  className={`equip-button ${s.equipped[i.slot] === i.id ? "equipped" : ""}`}
                  disabled={s.equipped[i.slot] === i.id}
                  onClick={() => act({ type: "equip", id: i.id })}
                >
                  {s.equipped[i.slot] === i.id ? (
                    <>
                      <Check />
                      已装备
                    </>
                  ) : (
                    "装备"
                  )}
                </button>
              ) : (
                <button
                  className="outline-button"
                  onClick={() => setSelected(i)}
                >
                  查看
                </button>
              )}
              <button
                className="icon-button"
                aria-label={`${i.name}详情`}
                onClick={() => setSelected(i)}
              >
                <ChevronRight />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!own.length && (
        <div className="empty">
          <Backpack />
          <h2>暂无符合条件的物品</h2>
          <button
            className="outline-button"
            onClick={() => {
              setQuery("");
              setFilter("全部");
            }}
          >
            查看全部物品
          </button>
        </div>
      )}
      <footer className="collection-foot">
        <span>共 {own.length} 种随身物</span>
        <span>器物有灵，相伴天涯</span>
      </footer>
      {selected && (
        <ItemDialog
          item={selected}
          s={s}
          act={act}
          close={() => setSelected(null)}
        />
      )}
    </>
  );
}
export function ItemDialog({
  item,
  s,
  act,
  close,
}: {
  item: Item;
  s: GameState;
  act: (a: Action) => void;
  close: () => void;
}) {
  const [interacted, setInteracted] = useState(false);
  const perform = (action: Action) => {
    setInteracted(true);
    act(action);
  };
  const preview = equipmentPreview(s, item);
  const owned = s.inventory[item.id] || 0;
  const ref = useRef<HTMLDialogElement>(null),
    level = s.upgrades[item.id] || 0,
    cost = 20 + level * 15;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-label={`${item.name}详情`}
    >
      <div className="dialog-content">
        <div className="dialog-top">
          <span>器物详情</span>
          <button className="icon-button" onClick={close} aria-label="关闭详情">
            <X />
          </button>
        </div>
        <div className="item-dialog-hero">
          <ItemPicture item={item} />
          <div>
            <span className="secondary">
              {item.kind} · {item.quality || "随身之物"}
            </span>
            <h2>
              {item.name}
              {level ? ` +${level}` : ""}
            </h2>
            <span className="secondary">持有 {owned} 件</span>
          </div>
        </div>
        <p>{item.description}</p>
        <ItemStats item={item} level={level} />
        {preview && s.equipped[item.slot!] !== item.id && (
          <section className="equipment-comparison" aria-label="换装属性对比">
            <h3>换装对比</h3>
            <p className="secondary">
              当前：{preview.current?.name || "尚未装备"}
              {preview.current && s.upgrades[preview.current.id]
                ? ` +${s.upgrades[preview.current.id]}`
                : ""}
            </p>
            <dl>
              {preview.changes.map(({ label, before, after }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <span>
                      {before} → {after}
                    </span>
                    <strong
                      className={
                        after > before
                          ? "stat-gain"
                          : after < before
                            ? "stat-loss"
                            : "secondary"
                      }
                    >
                      {after === before
                        ? "不变"
                        : `${after > before ? "+" : ""}${after - before}`}
                    </strong>
                  </dd>
                </div>
              ))}
            </dl>
            {preview.after.set && !preview.before.set && (
              <p className="set-note">将激活行云两件套 · 气血上限额外 +30</p>
            )}
            {preview.before.set && !preview.after.set && (
              <p className="set-note">更换后行云两件套失效</p>
            )}
            <p className="secondary">
              已计入强化与套装效果。提升气血上限不会恢复当前气血。
            </p>
          </section>
        )}
        {item.slot && (
          <button
            className="ink-button full"
            disabled={!owned || s.equipped[item.slot] === item.id}
            onClick={() => perform({ type: "equip", id: item.id })}
          >
            {s.equipped[item.slot] === item.id ? "已装备" : "装备此物"}
          </button>
        )}
        {item.attack && (
          <Panel title="百炼成锋" icon={<Sword />}>
            <p>
              {level >= 5
                ? "已达本篇强化上限 +5"
                : `强化 +${level} → +${level + 1} · 外功 +3`}
            </p>
            <p className="secondary">
              需要精铁 2 块（持有 {s.inventory.iron || 0}）<br />
              需要银两 {cost} 两（持有 {s.player.silver}）
            </p>
            <button
              className="outline-button full"
              disabled={
                !owned ||
                level >= 5 ||
                (s.location === "smith" &&
                  ((s.inventory.iron || 0) < 2 || s.player.silver < cost))
              }
              onClick={() =>
                perform(
                  s.location === "smith"
                    ? { type: "upgrade", id: item.id }
                    : { type: "move", id: "smith" },
                )
              }
            >
              {level >= 5
                ? "已达强化上限"
                : s.location === "smith"
                  ? "强化兵器"
                  : "前往铁匠铺 · 一时辰"}
            </button>
          </Panel>
        )}
        {item.id === "medicine" && (
          <button
            className="ink-button full"
            disabled={!s.inventory.medicine || s.player.hp >= derived(s).maxHp}
            onClick={() => perform({ type: "use", id: item.id })}
          >
            {!owned
              ? "金疮药已用尽"
              : s.player.hp >= derived(s).maxHp
                ? "气血充盈，无需用药"
                : "服用 · 恢复 65 气血"}
          </button>
        )}
        {item.id !== "medicine" && item.kind !== "装备" && (
          <p className="selection-note">
            {item.id === "rope" || item.id === "cloth"
              ? "在战后拘捕界面使用。"
              : item.id === "charm"
                ? "在后巷追踪时使用。"
                : item.id === "iron"
                  ? "在铁匠铺强化兵器时使用。"
                  : item.id === "key"
                    ? "在后巷探索事件中使用。"
                    : "可在对应人物的详情中赠送，或在事件中使用。"}
          </p>
        )}
        {interacted && s.lastMessage && (
          <p role="status" className="feedback">
            {s.lastMessage}
          </p>
        )}
      </div>
    </dialog>
  );
}
