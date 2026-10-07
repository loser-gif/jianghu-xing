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
import {
  ReferenceArt,
  ReferenceNavIcon,
  InkEdges,
} from "../components/Reference";
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
  const act = useGame((x) => x.act),
    r = s.relationships[n.id],
    here = npcLocation(n, s.time) === s.location;
  const [tab, setTab] = useState("资料");
  const place =
    n.id === "gu" && s.quest.stage === "completed"
      ? "官府 · 在押"
      : locations.find((l) => l.id === npcLocation(n, s.time))?.name;
  const visit = () => {
    act({ type: "move", id: npcLocation(n, s.time) });
    onClose();
    navigate("jianghu");
  };
  const service = () =>
    navigate(
      n.id === "lu"
        ? "identity"
        : n.id === "suwan"
          ? "jianghu"
          : n.id === "shao"
            ? "inventory"
            : "arts",
    );
  return (
    <Modal title="人物谱" onClose={onClose} wide>
      <div className="npc-hero">
        <Portrait index={n.portrait} size="hero" />
        <div>
          <h1>
            {n.name}
            <span className={`gender ${n.gender === "女" ? "red" : ""}`}>
              {n.gender}
            </span>
          </h1>
          <p>{n.role}</p>
          <blockquote>“{n.quote}”</blockquote>
          <div className="npc-location">
            <Icon name="compass" size={12} />
            杭州 · {place}
          </div>
          <div className="person-tags">
            {n.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
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
        <div className="npc-columns">
          <div>
            <Section title="基本信息">
              <dl className="profile-facts">
                {[
                  ["姓名", n.name],
                  ["性别", n.gender],
                  ["身份", n.role],
                  ["所在", `杭州 · ${place}`],
                  ["门派", n.faction],
                  ["年龄", `${n.age} 岁`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
            <Section title="可提供功能">
              <div className="profile-functions">
                <button
                  disabled={!here || n.id === "gu"}
                  onClick={() => act({ type: "talk", id: n.id })}
                >
                  <Icon name="feather" />
                  <b>交谈问候</b>
                  <small>
                    江湖消息
                    <br />
                    市井传闻
                  </small>
                </button>
                <button
                  disabled={
                    !here || n.id === "gu" || !(s.inventory[n.gift] > 0)
                  }
                  onClick={() => act({ type: "gift", id: n.id })}
                >
                  <Icon name="wine" />
                  <b>赠送心意</b>
                  <small>
                    {items.find((i) => i.id === n.gift)?.name}
                    <br />
                    结交故人
                  </small>
                </button>
                <button onClick={service}>
                  <Icon
                    name={
                      n.id === "shao"
                        ? "hammer"
                        : n.id === "lu"
                          ? "shield"
                          : "book"
                    }
                  />
                  <b>
                    {n.id === "lu"
                      ? "身份司簿"
                      : n.id === "suwan"
                        ? "客栈歇脚"
                        : n.id === "shao"
                          ? "锻造装备"
                          : "请教武学"}
                  </b>
                  <small>
                    各有所长
                    <br />
                    相助江湖
                  </small>
                </button>
              </div>
            </Section>
            <Section title="人物小传">
              <p className="npc-biography">
                {n.name}，{n.role}。{n.description}
              </p>
              <p className="npc-biography">
                {n.nightLocation
                  ? `入夜之后，常可在${locations.find((l) => l.id === n.nightLocation)?.name}寻到这位故人。`
                  : `行走杭州，不妨去${place}坐坐。`}
                每一次相逢，每一份心意，都会留在彼此的往事里。
              </p>
            </Section>
          </div>
          <div>
            <Section title="性情标签">
              <div className="person-tags">
                {n.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </Section>
            <Section title="好感度">
              <Meter
                label="相处渐深，情谊自来"
                value={r.favor}
                max={100}
                color="red"
              />
            </Section>
            <Section title="信任等级">
              <div className="trust-scale">
                <span className="relation-tag green">{relationLabel(r)}</span>
                <span>
                  {[0, 20, 40, 60, 80].map((v) => (
                    <i key={v} className={r.trust >= v ? "lit" : ""} />
                  ))}
                </span>
              </div>
              <p className="small muted">多来坐坐，或许会有新的话与你分享。</p>
            </Section>
            <Section title="近期传闻">
              <div className="profile-rumors">
                <p>◇ {n.description}</p>
                {r.memories.length ? (
                  r.memories.slice(0, 3).map((m, i) => <p key={i}>◇ {m}</p>)
                ) : (
                  <p>◇ 故人的来处，尚待你亲自问起。</p>
                )}
                <p>◇ 此刻可往{place}寻访，江湖上的人，总有自己的行程。</p>
              </div>
            </Section>
            <ReferenceArt
              figure={9}
              rect={[434, 1185, 416, 205]}
              className="wine-vignette"
            />
          </div>
        </div>
      ) : tab === "关系" ? (
        <>
          <Section title="相处之间">
            <Meter label="好感度" value={r.favor} max={100} color="red" />
            <Meter label="信任度" value={r.trust} max={100} />
          </Section>
          <p className="prose">
            交谈与送礼可拉近距离，关键事件中的选择会留下更深的记忆。信任达到 35
            后，熟悉的商人会给你八五折。
          </p>
        </>
      ) : (
        <Section title="与故人的往事">
          <div className="memory-list">
            {r.memories.length ? (
              r.memories.map((m, i) => <p key={i}>◇ {m}</p>)
            ) : (
              <p>你们的故事，还未落笔。</p>
            )}
          </div>
        </Section>
      )}
      {!here && (
        <Button className="full" onClick={visit}>
          前往{place}寻访 <Icon name="right" size={14} />
        </Button>
      )}
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
      <nav className="mobile-nav detail-nav" aria-label="详情导航">
        <InkEdges />
        {(
          [
            ["inventory", "行囊"],
            ["npc", "人物"],
            ["jianghu", "江湖"],
            ["arts", "武学"],
            ["map", "地图"],
          ] as [Page, string][]
        ).map(([p, label], index) => (
          <button
            key={p}
            className={p === "npc" ? "active" : ""}
            onClick={() => {
              onClose();
              navigate(p);
            }}
          >
            <ReferenceNavIcon index={index} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </Modal>
  );
}
