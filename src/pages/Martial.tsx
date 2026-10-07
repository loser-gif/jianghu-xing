import { ReferenceArt } from "../components/Reference";
import { useState } from "react";
import { useGame } from "../store";
import { arts, npcs, locations, npcLocation } from "../data/world";
import { Icon, Button, Seal, Meter } from "../components/UI";
import type { GameState, Page } from "../types";

export function Martial({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const [filter, setFilter] = useState("全部");
  return (
    <>
      <div className="martial-intro">
        <Icon name="book" size={34} />
        <p>
          “纸上得来终觉浅，绝知此事要躬行。”
          <small>武学的精进，藏在每一次修习与交锋里。</small>
        </p>
        <span className="tag">已习得 {Object.keys(s.arts).length} 门</span>
      </div>
      <div className="tabs">
        {["全部", "剑法", "刀法", "拳掌", "奇门", "轻功", "内功"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="arts-list">
        {arts
          .filter((a) => filter === "全部" || a.type === filter)
          .map((a, index) => {
            const learned = !!s.arts[a.id],
              teacher = npcs.find((n) => n.id === a.teacher)!;
            const experience =
              Number(s.flags.spars || 0) + (s.flags.sparred_lake ? 1 : 0);
            return (
              <article className="art-card" key={a.id}>
                <div className="book-cover">
                  <span>{a.name}</span>
                  <small>武学秘笈</small>
                  <Icon name={a.icon} size={32} />
                  <i>卷 {["壹", "贰", "叁", "肆", "伍", "陆"][index]}</i>
                </div>
                <div className="art-info">
                  <div className="art-title">
                    <h2>{a.name}</h2>
                    <span className="tag">{a.rank}</span>
                    {s.activeArt === a.id && (
                      <span className="relation-tag green">出战中</span>
                    )}
                    {s.flags["break_" + a.id] && <Seal>已突破</Seal>}
                  </div>
                  <p>{a.description}</p>
                  {learned ? (
                    <>
                      <Meter label="熟练度" value={s.arts[a.id]} max={100} />
                      <div className="art-buttons">
                        <Button
                          onClick={() => act({ type: "practice", id: a.id })}
                        >
                          静心修习
                        </Button>
                        {a.power > 0 && (
                          <Button
                            disabled={s.activeArt === a.id}
                            onClick={() => act({ type: "art", id: a.id })}
                          >
                            设为出战
                          </Button>
                        )}
                        <Button
                          disabled={
                            s.arts[a.id] < 80 ||
                            s.player.stats.insight < 70 ||
                            experience < 3 ||
                            !!s.flags["break_" + a.id]
                          }
                          onClick={() =>
                            act({ type: "breakthrough", id: a.id })
                          }
                        >
                          领悟突破
                        </Button>
                      </div>
                      <p className="breakthrough-note">
                        突破：悟性 {s.player.stats.insight}/70 · 熟练度{" "}
                        {s.arts[a.id]}/80 · 交手 {experience}/3
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="muted small">
                        可向{teacher.name}请教 ·{" "}
                        {
                          locations.find(
                            (l) => l.id === npcLocation(teacher, s.time),
                          )?.name
                        }
                      </p>
                      <Button
                        disabled={npcLocation(teacher, s.time) !== s.location}
                        onClick={() => act({ type: "learn", id: a.id })}
                      >
                        当面请教
                      </Button>
                      {npcLocation(teacher, s.time) !== s.location && (
                        <button
                          className="text-button learn-travel"
                          onClick={() => {
                            act({
                              type: "move",
                              id: npcLocation(teacher, s.time),
                            });
                            navigate("jianghu");
                          }}
                        >
                          前往寻访 <Icon name="right" size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </>
  );
}
