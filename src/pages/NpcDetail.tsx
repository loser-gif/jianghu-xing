import { useState } from "react";
import { useGame } from "../store";
import { locations, items, npcLocation } from "../data/world";
import {
  Icon,
  Portrait,
  Button,
  Section,
  Meter,
  Modal,
} from "../components/UI";
import type { NPC, GameState, Page } from "../types";
import { relationLabel } from "../engine/game";

export function NpcDetail({
  npc: n,
  s,
  onClose,
  navigate,
}: {
  npc: NPC;
  s: GameState;
  onClose: () => void;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const r = s.relationships[n.id];
  const here = npcLocation(n, s.time) === s.location;
  const [tab, setTab] = useState("资料");
  return (
    <Modal title="故人一面" onClose={onClose} wide>
      <div className="npc-hero">
        <Portrait index={n.portrait} size="hero" />
        <div>
          <div className="eyebrow">
            {n.faction} · {n.age} 岁
          </div>
          <h1>
            {n.name}
            <span className={`gender ${n.gender === "女" ? "red" : ""}`}>
              {n.gender}
            </span>
          </h1>
          <p>{n.role}</p>
          <blockquote>“{n.quote}”</blockquote>
          <span className="relation-tag green">{relationLabel(r)}</span>
        </div>
      </div>
      <div className="tabs">
        {["资料", "关系", "往事"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "资料" ? (
        <>
          <p className="prose">{n.description}</p>
          <div className="person-tags">
            {n.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="npc-detail-grid">
            <Section title="相处之间">
              <Meter label="好感度" value={r.favor} max={100} color="red" />
              <Meter label="信任度" value={r.trust} max={100} />
            </Section>
            <Section title="此刻所在">
              <p>
                <Icon name="compass" size={16} />{" "}
                {n.id === "gu" && s.quest.stage === "completed"
                  ? "官府 · 在押"
                  : locations.find((l) => l.id === npcLocation(n, s.time))
                      ?.name}
              </p>
              <p className="small muted">
                {n.nightLocation
                  ? "深夜会前往" +
                    locations.find((l) => l.id === n.nightLocation)?.name
                  : "通常可在此处找到"}
              </p>
            </Section>
          </div>
          {n.id === "gu" ? (
            <p className="selection-note">
              {s.quest.stage === "completed"
                ? "顾红绫已归案，你们之间的往事仍被记住。"
                : "先循案卷中的线索找到她，再决定如何面对这场相逢。"}
            </p>
          ) : (
            <div className="npc-actions">
              <Button
                kind="ink"
                disabled={!here}
                onClick={() => act({ type: "talk", id: n.id })}
              >
                <Icon name="feather" size={16} />
                交谈
              </Button>
              <Button
                disabled={!here || !(s.inventory[n.gift] > 0)}
                onClick={() => act({ type: "gift", id: n.id })}
              >
                <Icon name="bag" size={16} />赠
                {items.find((i) => i.id === n.gift)?.name}
              </Button>
              <Button
                onClick={() =>
                  navigate(
                    n.id === "lu"
                      ? "identity"
                      : n.id === "suwan"
                        ? "jianghu"
                        : n.id === "shao"
                          ? "inventory"
                          : "arts",
                  )
                }
              >
                <Icon name={n.id === "lu" ? "shield" : "book"} size={16} />
                {n.id === "lu"
                  ? "身份司簿"
                  : n.id === "suwan"
                    ? "客栈歇脚"
                    : n.id === "shao"
                      ? "锻造装备"
                      : "请教武学"}
              </Button>
            </div>
          )}
          {!here && (
            <Button
              className="full"
              onClick={() => {
                act({ type: "move", id: npcLocation(n, s.time) });
                onClose();
                navigate("jianghu");
              }}
            >
              前往寻访 <Icon name="right" size={15} />
            </Button>
          )}
        </>
      ) : tab === "关系" ? (
        <>
          <Meter label="好感度" value={r.favor} max={100} color="red" />
          <Meter label="信任度" value={r.trust} max={100} />
          <p className="prose">
            好感来自相处，信任来自行动。交谈与送礼可拉近距离，关键事件中的选择会留下更深的记忆。
          </p>
          <p className="selection-note">
            信任达到 35
            后，熟悉的商人会给你八五折。部分消息只会向曾经相助的人透露。
          </p>
        </>
      ) : (
        <div className="memory-list">
          {r.memories.length ? (
            r.memories.map((m, i) => (
              <p key={i}>
                <span>◇</span>
                {m}
              </p>
            ))
          ) : (
            <div className="empty-state">
              <Icon name="feather" size={26} />
              <p>你们的故事，还未落笔。</p>
            </div>
          )}
        </div>
      )}
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
    </Modal>
  );
}
