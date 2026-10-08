import { useState, useRef, useEffect } from "react";
import { useGame } from "../store";
import { locations, items } from "../data/world";
import { currentNpcLocation, npcService } from "../engine/people";
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
    position = currentNpcLocation(n, s),
    here = position === s.location;
  const [tab, setTab] = useState("资料");
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedback) feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [feedback]);
  const serviceInfo = npcService(n, s);
  const servicePlace = locations.find(
    (l) => l.id === serviceInfo.location,
  )?.name;
  const needsTravel =
    !!serviceInfo.location && serviceInfo.location !== s.location;
  const giftName = items.find((i) => i.id === n.gift)?.name;
  const place =
    n.id === "gu" && s.quest.stage === "completed"
      ? "官府 · 在押"
      : locations.find((l) => l.id === position)?.name;
  const visit = () => {
    act({ type: "move", id: position });
    onClose();
    navigate("jianghu");
  };
  const service = () => {
    if (needsTravel) act({ type: "move", id: serviceInfo.location! });
    onClose();
    navigate(serviceInfo.page);
  };
  const interact = (type: "talk" | "gift") => {
    act({ type, id: n.id });
    setFeedback(useGame.getState().game.lastMessage);
  };
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
                  onClick={() => interact("talk")}
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
                  onClick={() => interact("gift")}
                >
                  <Icon name="wine" />
                  <b>赠送心意</b>
                  <small>
                    {giftName}
                    <br />
                    持有 ×{s.inventory[n.gift] || 0}
                  </small>
                </button>
                <button onClick={service}>
                  <Icon name={serviceInfo.icon} />
                  <b>{serviceInfo.label}</b>
                  <small>
                    {needsTravel ? `前往${servicePlace}` : "查看详情"}
                    <br />
                    {needsTravel ? "行程两时辰" : "此处可办"}
                  </small>
                </button>
              </div>
              <p className="service-hint">
                {n.id === "gu"
                  ? "案中人物，交谈与赠礼暂不可用，请查看案情。"
                  : !here
                    ? `交谈与赠礼需当面进行，此刻可往${place}寻访。`
                    : !(s.inventory[n.gift] > 0)
                      ? `赠礼还需${giftName}，可先去商铺置办。`
                      : "可交谈或赠礼，每次相处会推进两个时辰。"}
              </p>
              {feedback && (
                <div
                  className="inline-feedback npc-feedback"
                  ref={feedbackRef}
                  role="status"
                >
                  {feedback}
                </div>
              )}
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
                <p>
                  ◇{" "}
                  {n.id === "gu" && s.quest.stage === "completed"
                    ? "此案已结，顾红绫已押送官府。"
                    : `此刻可往${place}寻访，江湖上的人，总有自己的行程。`}
                </p>
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
