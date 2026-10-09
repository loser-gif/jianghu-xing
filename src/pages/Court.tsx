import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import { courtCases, courtCase, officialRanks, salaries } from "../data/court";
import { realms } from "../engine/cultivation";
import { locations } from "../data/world";
import { Button, Modal, Icon } from "../components/UI";
const place = (id: string) => locations.find((l) => l.id === id)?.name;
export function Court({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act),
    [abandon, setAbandon] = useState(false);
  const active = s.court.active,
    c = courtCase(active?.id),
    day = Math.floor(s.time / 6);
  const blocked = s.life.ended || !!s.combat || !!s.activeEvent;
  const travel = (id: string) => act({ type: "move", id });
  return (
    <div className="court-page">
      <section className="sect-intro">
        <div className="sect-seal" aria-hidden="true">
          牍
        </div>
        <div>
          <span className="eyebrow">杭州官署 · 察事明理</span>
          <h2>{officialRanks[s.identity.rank]} · 朝廷案牍</h2>
          <p>凭证据追查，依案卷晋升。官阶与宗门、生活身份可以并行。</p>
        </div>
      </section>
      <section className="sect-overview">
        <dl>
          <div>
            <dt>身份声望</dt>
            <dd>{s.identity.reputation}</dd>
          </div>
          <div>
            <dt>官府贡献</dt>
            <dd>{s.identity.contribution}</dd>
          </div>
          <div>
            <dt>新案办结</dt>
            <dd>{Object.keys(s.court.completed).length}/3</dd>
          </div>
          <div>
            <dt>每日俸银</dt>
            <dd>{salaries[s.identity.rank]}两</dd>
          </div>
        </dl>
        <div className="progression-buttons">
          <Button onClick={() => navigate("identity")}>
            查看官阶与晋升条件
          </Button>
          {s.location !== "office" ? (
            <Button disabled={blocked} onClick={() => travel("office")}>
              前往官府 · 两时辰
            </Button>
          ) : (
            <Button
              disabled={
                blocked || !s.identity.rank || s.court.salaryDay === day
              }
              onClick={() => act({ type: "courtSalary" })}
            >
              {s.court.salaryDay === day
                ? "今日俸银已领"
                : `领取俸银 · ${salaries[s.identity.rank]}两`}
            </Button>
          )}
        </div>
        <p className="small muted">
          俸银需在官府主动领取，每游戏日一次，不累计离线收益；晋升不重置当日次数。
        </p>
      </section>
      {s.life.ended && (
        <p className="selection-note">此生已结卷，案牍仅供回看。</p>
      )}
      {s.court.result && (
        <section className="court-result" role="status">
          <h2>
            {courtCase(s.court.result.id)?.title} ·{" "}
            {s.court.result.outcome === "win" ? "已结案" : "留待再查"}
          </h2>
          <p>{s.court.result.text}</p>
          <Button onClick={() => navigate("journal")}>回看江湖手记</Button>
        </section>
      )}
      {active && c ? (
        <>
          <section className="sect-guide">
            <span className="eyebrow">在办案卷</span>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
            <ol className="court-steps">
              {["调查取证", "拦截目标", "自动交锋", "回府结案"].map((x, i) => (
                <li
                  className={
                    ["investigate", "ready", "combat", "verdict"].indexOf(
                      active.stage,
                    ) >= i
                      ? "reached"
                      : ""
                  }
                  key={x}
                >
                  {i + 1} · {x}
                </li>
              ))}
            </ol>
            <p>
              {["investigate", "ready"].includes(active.stage)
                ? `调查与拦截剩余 ${Math.max(0, 48 - (s.time - active.acceptedAt))} 时段（每段两时辰）。期限内开始交锋即停止倒计时。`
                : active.stage === "verdict"
                  ? "目标已由随行差役控制。现在回官府选择结案处置；奖励尚未发放。"
                  : "交锋正在进行，自动战斗可暂停、倍速与撤离。"}
            </p>
          </section>
          <div className="sect-columns">
            <section className="sect-panel">
              <h2>证据手札 · {active.evidence.length}/2</h2>
              {c.clues.map((clue) => {
                const done = active.evidence.includes(clue.id);
                return (
                  <article className="sect-task" key={clue.id}>
                    <h3>
                      <Icon name={done ? "check" : "search"} size={18} />{" "}
                      {clue.name}
                    </h3>
                    <p>
                      {done
                        ? clue.text
                        : `前往${place(clue.location)}调查，耗时两时辰。证据可按任意顺序收集。`}
                    </p>
                    <Button
                      disabled={
                        blocked || done || active.stage !== "investigate"
                      }
                      onClick={() =>
                        s.location === clue.location
                          ? act({ type: "courtInvestigate", id: clue.id })
                          : travel(clue.location)
                      }
                    >
                      {done
                        ? "证据已录入"
                        : s.location === clue.location
                          ? clue.name
                          : `前往${place(clue.location)}`}
                    </Button>
                  </article>
                );
              })}
            </section>
            <section className="sect-panel">
              <h2>下一步行动</h2>
              {active.stage === "investigate" ? (
                <p>
                  先查齐左侧（手机上方）的两份证据，才能依法拦截；不会把无关人牵入案件。
                </p>
              ) : active.stage === "ready" ? (
                <>
                  <h3>拦截{c.target}</h3>
                  <p>
                    目标位于{place(c.location)}。气血{c.hp}、外功{c.attack}
                    、防御{c.defense}，每三回合重击。建议{realms[c.realm]}
                    左右、备好药物，气血至少三成。
                  </p>
                  <Button
                    kind="ink"
                    disabled={blocked}
                    onClick={() =>
                      s.location === c.location
                        ? act({ type: "courtConfront" })
                        : travel(c.location)
                    }
                  >
                    {s.location === c.location
                      ? "拦截目标 · 自动交锋"
                      : `前往${place(c.location)}`}
                  </Button>
                  <Button onClick={() => navigate("inventory")}>
                    整理随身补给
                  </Button>
                </>
              ) : active.stage === "verdict" ? (
                <>
                  <p>
                    赃证将一并归档，两个选择都可结案并计入晋升；区别在赏银和侠义。
                  </p>
                  {s.location !== "office" ? (
                    <Button
                      kind="ink"
                      disabled={blocked}
                      onClick={() => travel("office")}
                    >
                      押送回官府 · 两时辰
                    </Button>
                  ) : (
                    <div className="court-verdict">
                      <Button
                        disabled={blocked}
                        onClick={() =>
                          act({ type: "courtResolve", choice: "treasury" })
                        }
                      >
                        依律归档 · 赏银{c.silver}两 / 侠义+1
                      </Button>
                      <Button
                        disabled={blocked}
                        onClick={() =>
                          act({ type: "courtResolve", choice: "relief" })
                        }
                      >
                        拨银救助 · 赏银{c.silver - 60}两 / 侠义+4
                      </Button>
                    </div>
                  )}
                  <p>
                    共同奖励：声望{c.reputation}、贡献{c.contribution}、修为
                    {c.xp}、感悟{c.insights}。结案耗时两时辰。
                  </p>
                </>
              ) : (
                <p>请先结束交锋。</p>
              )}
              <details className="sect-leave">
                <summary>暂时撤回案卷</summary>
                <p>
                  记一次失利，保留官阶与物品，下一游戏日可重接。已消耗的补给不返还。
                </p>
                <Button disabled={blocked} onClick={() => setAbandon(true)}>
                  申请撤案
                </Button>
              </details>
            </section>
          </div>
        </>
      ) : (
        <>
          <section className="sect-guide">
            <h2>从一城捕快，到朝廷任事</h2>
            <p>
              先办结烟雨楼盗案并晋升资深捕快，再接漕运失银案；升任总捕后查伪诏，进入锦衣卫后追查江南密函。
            </p>
            <p>
              每案两处调查 → 证据齐全 → 拦截目标自动交锋 →
              回官府结案。一次一案，结案奖励只发一次；失利后下一游戏日可重接。
            </p>
            <Button onClick={() => navigate("quest")}>查看烟雨楼盗案</Button>
          </section>
          <div className="court-cases">
            {courtCases.map((f) => {
              const complete = s.court.completed[f.id];
              const reason = complete
                ? `已结案 · ${complete === "relief" ? "拨银救助" : "依律归档"}`
                : s.identity.rank < f.rank
                  ? `需${officialRanks[f.rank]}身份`
                  : s.quest.stage !== "completed"
                    ? "先办结烟雨楼盗案"
                    : s.court.attempted[f.id] === day
                      ? "下一游戏日可重接"
                      : "可接取 · 八日调查期限";
              return (
                <article className="sect-panel" key={f.id}>
                  <span className="eyebrow">{officialRanks[f.rank]}案卷</span>
                  <h2>{f.title}</h2>
                  <p>{f.intro}</p>
                  <p>
                    对手：{f.target} · 建议{realms[f.realm]}
                    <br />
                    奖励：赏银{f.silver}、声望{f.reputation}、贡献
                    {f.contribution}、感悟{f.insights}
                  </p>
                  <p className="selection-note">{reason}</p>
                  <Button
                    kind="ink"
                    disabled={
                      blocked ||
                      !!complete ||
                      s.identity.rank < f.rank ||
                      s.quest.stage !== "completed" ||
                      s.court.attempted[f.id] === day
                    }
                    onClick={() =>
                      s.location !== "office"
                        ? travel("office")
                        : act({ type: "courtAccept", id: f.id })
                    }
                  >
                    {s.location !== "office"
                      ? "前往官府接案"
                      : `接取《${f.title}》`}
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      )}
      {abandon && (
        <Modal title="确认撤回案卷" onClose={() => setAbandon(false)}>
          <p>
            撤案会记录一次失利，已用补给不返还。下一游戏日可在官府重新接案。
          </p>
          <div className="progression-buttons">
            <Button
              kind="danger"
              onClick={() => {
                act({ type: "courtAbandon" });
                setAbandon(false);
              }}
            >
              确认撤案
            </Button>
            <Button onClick={() => setAbandon(false)}>继续办理</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
