import { ReferenceArt } from "../components/Reference";
import { derived } from "../engine/game";
import { useState, useEffect } from "react";
import { relationLabel } from "../engine/game";
import { useGame } from "../store";
import { locations, npcs, items, npcLocation, shopStock } from "../data/world";
import { Icon, Portrait, Section, Button, ActionRow } from "../components/UI";
import type { GameState, NPC, Page } from "../types";

export function Jianghu({
  s,
  onNpc,
  navigate,
}: {
  s: GameState;
  onNpc: (n: NPC) => void;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const l = locations.find((l) => l.id === s.location)!;
  const nearby = npcs.filter(
    (n) =>
      npcLocation(n, s.time) === s.location &&
      (n.id !== "gu" || ["dock", "combat", "defeated"].includes(s.quest.stage)),
  );
  const shop = shopStock(s.location);
  const shopClosed =
    s.time % 6 === 5 && !["office", "herb"].includes(s.location);
  const [shopOpen, setShopOpen] = useState(false);
  useEffect(() => setShopOpen(false), [s.location]);
  return (
    <>
      <div className="journey-status">
        <Portrait size="small" />
        <div>
          <b>{s.player.name}</b>
          <small>杭州 · {l.name}</small>
        </div>
        <div>
          <span>
            气血 {s.player.hp}/{derived(s).maxHp}
          </span>
          <span>
            内力 {s.player.qi}/{derived(s).maxQi}
          </span>
          <small>
            银两 {s.player.silver} · 名望 {s.player.fame}
          </small>
        </div>
      </div>
      <div className={`scene scene-${s.location}`}>
        <ReferenceArt
          figure={8}
          rect={[391, 0, 363, 244]}
          className="scene-reference"
          label="杭州山水"
        />
        <div className="scene-title">
          <span>江 南 · 杭 州</span>
          <h2>{l.name}</h2>
          <p>{l.subtitle}</p>
        </div>
        <div className="scene-bottom">
          <span>
            <Icon name="compass" size={14} />
            {l.tag}
          </span>
          <button onClick={() => navigate("map")}>
            天下舆图 <Icon name="right" size={14} />
          </button>
        </div>
        <div className="scene-stamp">
          杭州
          <br />
          记游
        </div>
      </div>
      <div className="scene-prose">
        <span className="chapter-mark">此刻</span>
        <p>{l.description}</p>
        <div className="tiny-divider">◇</div>
      </div>
      <Section
        title="此地可为"
        aside={<span className="small muted">一步一选择，一念一江湖</span>}
      >
        <div className="actions-list">
          <ActionRow
            icon="compass"
            title="四处走走"
            description="探寻此地的人与事，或有意外际遇"
            onClick={() => act({ type: "explore" })}
          />
          {s.location === "office" && (
            <ActionRow
              icon="shield"
              title={s.identity.rank ? "查看官府案卷" : "拜见陆捕头"}
              description={
                s.identity.rank
                  ? "通缉、准备与职业晋升"
                  : "入职捕快，守一方百姓"
              }
              onClick={() => navigate(s.identity.rank ? "quest" : "identity")}
            />
          )}
          <QuestAction s={s} navigate={navigate} />
          {s.location === "inn" && (
            <ActionRow
              icon="tea"
              title="歇脚住店"
              description={`一夜安睡，恢复气血与内力 · ${s.flags.helped_suwan ? 4 : 8} 两 / 三个时辰`}
              onClick={() => act({ type: "rest" })}
            />
          )}{" "}
          {s.location === "herb" && (
            <ActionRow
              icon="leaf"
              title="请白芷疗伤"
              description={`恢复气血与内力 · 诊金 ${s.flags.helped_baizhi ? 5 : 10} 两，囊中羞涩可免费静养`}
              onClick={() => act({ type: "heal" })}
            />
          )}{" "}
          {s.location === "lake" && (
            <ActionRow
              icon="swords"
              title="湖畔试剑"
              description="与剑客切磋，悟性 +2 · 气血 −20"
              onClick={() => act({ type: "spar" })}
            />
          )}{" "}
          {shop.length > 0 && (
            <ActionRow
              icon={s.location === "smith" ? "hammer" : "bag"}
              title={
                s.location === "smith"
                  ? "锻造与购置"
                  : s.location === "office"
                    ? "官府军需"
                    : "买些随身物品"
              }
              description={
                s.location === "smith"
                  ? "购入合手兵器，或强化已有武器"
                  : "绳索、药物与一壶酒，都是江湖里的底气"
              }
              onClick={() => setShopOpen(!shopOpen)}
            />
          )}
          <ActionRow
            icon="clock"
            title={
              s.location === "office" && s.identity.rank
                ? "值勤巡街"
                : "暂歇片刻"
            }
            description={
              s.location === "office" && s.identity.rank
                ? "推进一个时辰，每日前两次可领 8 两"
                : "让时辰向前，看看此地的新变化"
            }
            onClick={() => act({ type: "wait" })}
          />
        </div>
      </Section>
      {shopOpen && (
        <Section title={s.location === "office" ? "官府军需" : "柜上物什"}>
          {shopClosed && (
            <p className="service-hint" role="status">
              店家已打烊，等天亮后再来置办。
            </p>
          )}
          <div className="shop-list">
            {shop.map((id) => {
              const i = items.find((i) => i.id === id)!;
              const merchant =
                s.location === "smith"
                  ? "shao"
                  : s.location === "herb"
                    ? "baizhi"
                    : s.location === "inn"
                      ? "suwan"
                      : "lu";
              const price = Math.ceil(
                i.price * (s.relationships[merchant].trust >= 35 ? 0.85 : 1),
              );
              return (
                <div key={id}>
                  <span className="item-symbol">
                    <Icon name={i.icon} size={22} />
                  </span>
                  <span>
                    <b>{i.name}</b>
                    <small>
                      已有 {s.inventory[id] || 0} · {i.description}
                    </small>
                  </span>
                  <Button
                    onClick={() => act({ type: "buy", id })}
                    disabled={shopClosed || s.player.silver < price}
                  >
                    {price} 两 · 买入
                  </Button>
                </div>
              );
            })}
          </div>
          {s.location === "smith" && (
            <Button onClick={() => navigate("inventory")} className="full">
              <Icon name="hammer" size={16} />
              到行囊选择兵器强化
            </Button>
          )}
        </Section>
      )}
      <Section
        title="此地人物"
        aside={
          <button className="text-button" onClick={() => navigate("npc")}>
            人物谱 <Icon name="right" size={13} />
          </button>
        }
      >
        <div className="nearby-list">
          {nearby.length ? (
            nearby.map((n) => (
              <button key={n.id} onClick={() => onNpc(n)}>
                <Portrait index={n.portrait} />
                <div>
                  <h3>
                    {n.name}
                    <span
                      className={`relation-tag ${s.relationships[n.id].trust >= 35 ? "green" : ""}`}
                    >
                      {relationLabel(s.relationships[n.id])}
                    </span>
                  </h3>
                  <p>{n.role}</p>
                  <span className="small muted">{n.quote}</span>
                </div>
                <Icon name="right" size={16} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              此处暂没有相识之人，换个时辰再来看看。
            </div>
          )}
        </div>
      </Section>
      <Section title="下一程">
        <div className="destination-list">
          {l.connections.map((id) => {
            const next = locations.find((x) => x.id === id)!;
            return (
              <button key={id} onClick={() => act({ type: "move", id })}>
                <Icon name={next.icon} size={18} />
                <span>{next.name}</span>
                <Icon name="right" size={13} />
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function QuestAction({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  if (s.quest.stage === "captured")
    return (
      <ActionRow
        icon="shield"
        title="押送归案"
        description="控制状态完备，押送至官府领取赏银"
        onClick={() => act({ type: "turnin" })}
      />
    );
  if (s.location === "tower" && s.quest.stage === "investigate")
    return (
      <ActionRow
        icon="search"
        title="调查烟雨楼失窃案"
        description="勘查窗棂与后门，寻找顾红绫的去向"
        badge="案情"
        onClick={() => act({ type: "investigate" })}
      />
    );
  if (s.location === "alley" && s.quest.stage === "trail")
    return (
      <ActionRow
        icon="footprints"
        title="循迹追踪"
        description="辨别脚印与水路，寻找正确去向"
        badge="案情"
        onClick={() => navigate("quest")}
      />
    );
  if (s.location === "dock" && s.quest.stage === "dock")
    return (
      <ActionRow
        icon="swords"
        title="拦下顾红绫"
        description="对话交锋，活捉目标"
        badge="案情"
        onClick={() => act({ type: "confront" })}
      />
    );
  return null;
}
