import { useGame } from "../store";
import type { GameState, Page } from "../types";
import { realms, breakthroughNeeds, realmBonus } from "../engine/cultivation";
import { commissions, commissionStage, introText } from "../engine/sidequests";
import { locations } from "../data/world";
import { Button, Meter, Section, Seal } from "./UI";

export function CultivationPanel({ s }: { s: GameState }) {
  const act = useGame((x) => x.act),
    b = breakthroughNeeds(s),
    bonus = realmBonus(s);
  return (
    <section className="cultivation-panel" aria-label="修为境界">
      <div className="cultivation-heading">
        <div>
          <span className="eyebrow">修身 · 养气 · 问道</span>
          <h2 key={s.cultivation.realm}>
            {realms[s.cultivation.realm]} <Seal>境</Seal>
          </h2>
        </div>
        <span>江湖感悟 {s.cultivation.insights}</span>
      </div>
      {b.next ? (
        <>
          <Meter
            label={`修为 · 下一境 ${b.next}`}
            value={s.cultivation.xp}
            max={b.cost}
          />
          <ul className="realm-needs">
            {b.needs.map((n) => (
              <li key={n.label} className={n.met ? "met" : ""}>
                {n.met ? "✓" : "○"} {n.label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>太朴归真，万法自然。境界已臻圆满。</p>
      )}
      <p className="small">
        境界加成：气血 +{bonus.hp} · 内力 +{bonus.qi} · 外功 +{bonus.attack} ·
        防御 +{bonus.defense}
      </p>
      <div className="progression-buttons">
        <Button onClick={() => act({ type: "meditate" })}>
          凝神吐纳 · 一时辰
        </Button>
        {b.next && (
          <Button
            kind="ink"
            disabled={!b.ready}
            onClick={() => act({ type: "ascend" })}
          >
            突破 · {b.next}
          </Button>
        )}
      </div>
      <details>
        <summary>修行之路与收益规则</summary>
        <p>
          修为用于突破；内力用于招式；熟练度用于武学。基础修行每日前两次收益完整，此后降至四分之一。境界越高，基础功法的收益越低；际遇、委托与破案提供更多修为和感悟。八品起可听声辨出后巷的水路，不必额外搜寻。
        </p>
        <p>{realms.join(" → ")}</p>
        <p className="small muted">
          本卷发生在杭州。高境界可持续修行，后续地域与同阶强敌尚未开放。
        </p>
      </details>
    </section>
  );
}

export function Arrival({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  if (!s.flags.prologue_done)
    return (
      <section className="arrival-prologue">
        <span className="eyebrow">第一卷 · 你的来路</span>
        <h2>风起杭州</h2>
        <p className="prose">{introText(s.player.origin)}</p>
        <p>湖边一个孩子正搬动沉重的药篓，桥头剑客却似乎认出了你的兵器。</p>
        <div className="progression-buttons">
          <Button
            kind="ink"
            onClick={() => act({ type: "prologue", id: "help" })}
          >
            先帮孩子 · 善恶 +1
          </Button>
          <Button onClick={() => act({ type: "prologue", id: "seek" })}>
            拜问来路 · 结识故人
          </Button>
          <button
            className="text-button"
            onClick={() => act({ type: "prologue", id: "skip" })}
          >
            跳过序章
          </button>
        </div>
        <p className="small muted">
          两种选择均获修为 10，改变相识关系；不影响后续主线。
        </p>
      </section>
    );
  return null;
}

export function CommissionBoard({
  s,
  navigate,
  local = false,
}: {
  s: GameState;
  navigate: (p: Page) => void;
  local?: boolean;
}) {
  const act = useGame((x) => x.act);
  const rows = commissions.filter(
    (q) =>
      !local ||
      (commissionStage(s, q.id) < 3 &&
        q.locations[commissionStage(s, q.id)] === s.location),
  );
  if (!rows.length) return null;
  return (
    <Section title="江湖委托">
      <div className="commission-list">
        {rows.map((q) => {
          const step = commissionStage(s, q.id),
            here = q.locations[Math.min(step, 2)] === s.location;
          return (
            <article className="commission-card" key={q.id}>
              <div>
                <span className="eyebrow">
                  {q.giver} · {step === 3 ? "已了结" : `第 ${step + 1}/3 步`}
                </span>
                <h3>{q.title}</h3>
                <p>{step === 3 ? "此事已写入彼此的记忆。" : q.steps[step]}</p>
                <p className="small muted">{q.reward}</p>
              </div>
              {step < 3 && (
                <div className="progression-buttons">
                  {!here ? (
                    <Button
                      onClick={() => {
                        act({ type: "move", id: q.locations[step] });
                        navigate("jianghu");
                      }}
                    >
                      前往
                      {locations.find((l) => l.id === q.locations[step])?.name}
                    </Button>
                  ) : step === 2 ? (
                    <>
                      <Button
                        kind="ink"
                        onClick={() =>
                          act({
                            type: "commission",
                            id: q.id,
                            choice: "honest",
                          })
                        }
                      >
                        重情义 · 信任 +12
                      </Button>
                      <Button
                        onClick={() =>
                          act({
                            type: "commission",
                            id: q.id,
                            choice: "reward",
                          })
                        }
                      >
                        按约收酬 · 额外 20 两
                      </Button>
                    </>
                  ) : (
                    <Button
                      kind="ink"
                      onClick={() => act({ type: "commission", id: q.id })}
                    >
                      {step === 0 ? "问起此事" : "循迹寻访"}
                    </Button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
