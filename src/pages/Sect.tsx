import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import { Button, Icon, Modal } from "../components/UI";
import { arts, itemById } from "../data/world";
import { sects, sectRanks, sectExchanges } from "../data/sects";
import {
  sectInfo,
  sectTitle,
  sectBlocked,
  promotionNeeds,
  foundingNeeds,
} from "../engine/sect";

export function Sect({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const [name, setName] = useState("听风阁"),
    [confirm, setConfirm] = useState<"found" | "leave" | null>(null);
  const info = sectInfo(s),
    t = s.sect,
    blocked = sectBlocked(s);
  const at = info && s.location === info.location;
  const disabled = !!blocked || !at;
  const day = Math.floor(s.time / 6),
    done = (key: string) => t.daily[key] === day;
  const promotion = promotionNeeds(s),
    founding = foundingNeeds(s);
  const nextText = !at
    ? "先返回驻地，再办理下方事务。"
    : t.id === "own"
      ? t.disciples
        ? "为弟子准备一份鲜鱼汤，再安排济民事务；积累银两和精铁扩建驻地。"
        : "先花40两招收第一名弟子。每日只能招收一人，随后可安排济民事务。"
      : t.rank < 3 && promotion.every((n) => n.met)
        ? "晋升条件已经齐备，前往下方「师门晋升」申请新身份。"
        : s.trial.highest > t.claimedFloor
          ? "你有新的试炼功绩尚未录入，先点击「录入试炼功绩」领取贡献。"
          : done("drill") && done("supply")
            ? "今日演武和物资事务都已完成。可继续闯塔，或在岁时录安排一日闭关，明日再来。"
            : t.rank === 0
              ? "先完成宗门演武，再交一份物资。达到30功绩、九品并通关试炼1层，即可晋升内门；当天未足的功绩可通过新楼层或次日事务补齐。"
              : "完成每日事务积累贡献，在藏经处修习；继续闯塔并破境，为下次晋升做准备。";
  const validName =
    /^[\p{Script=Han}A-Za-z0-9]{2,8}$/u.test(name.trim()) &&
    !sects.some((x) => x.name === name.trim());
  const travel = (id: string) => act({ type: "move", id });
  const requirements = (needs: { text: string; met: boolean }[]) => (
    <ul className="sect-requirements">
      {needs.map((n) => (
        <li className={n.met ? "met" : ""} key={n.text}>
          <Icon name={n.met ? "check" : "circle"} size={15} />
          {n.text}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="sect-page">
      <section className="sect-intro">
        <div className="sect-seal" aria-hidden="true">
          {info?.mark || "缘"}
        </div>
        <div>
          <span className="eyebrow">杭州宗门 · 师承与薪火</span>
          <h2>{info?.name || "择一处山门，寻一段师缘"}</h2>
          <p>
            {info?.motto ||
              "可以拜师入门，也可以积蓄实力，自立门户。宗门与捕快、生活身份可并行。"}
          </p>
        </div>
      </section>
      {blocked && (
        <p className="selection-note" role="status">
          {blocked}
        </p>
      )}
      {!info ? (
        <>
          <section className="sect-guide">
            <h2>从外门到执事</h2>
            <p>
              选择门派 → 前往驻地免费拜入 → 每日演武、交付物资 → 闯塔录入功绩 →
              达到条件申请晋升。一次只能加入一个宗门。
            </p>
            <p>下列驻地均在现有杭州地图内；拜入耗时两时辰，查看不耗时。</p>
          </section>
          <div className="sect-choices">
            {sects.map((p) => (
              <article key={p.id}>
                <div className="sect-card-heading">
                  <span className="sect-seal small">{p.mark}</span>
                  <div>
                    <h2>{p.name}</h2>
                    <span>{p.place}驻地</span>
                  </div>
                </div>
                <p>{p.description}</p>
                <p className="sect-specialty">{p.specialty}</p>
                <p>
                  内门传承：{arts.find((a) => a.id === p.art)?.name}
                  <br />
                  日常物资：{itemById(p.supply).name} ×{p.count}
                </p>
                <Button
                  kind={s.location === p.location ? "ink" : "paper"}
                  disabled={!!blocked}
                  onClick={() =>
                    s.location === p.location
                      ? act({ type: "sectJoin", id: p.id })
                      : travel(p.location)
                  }
                >
                  {s.location === p.location
                    ? `拜入${p.name} · 免费`
                    : `前往${p.place} · 两时辰`}
                </Button>
              </article>
            ))}
          </div>
          <section className="sect-panel sect-founding">
            <span className="eyebrow">另一条江湖路</span>
            <h2>开宗立派</h2>
            <p>
              在悦来客栈租下别院，从一座小院、一名弟子开始。开宗消耗500两与一日，不要求先拜入其他门派。
            </p>
            {requirements(founding)}
            <label className="sect-name">
              宗门名
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setConfirm(null);
                }}
                maxLength={8}
                placeholder="2至8个汉字、字母或数字"
              />
            </label>
            {!validName && (
              <p>请输入2至8个汉字、字母或数字，且不与现有门派重名。</p>
            )}
            <p className="small muted">
              本版自创宗门支持建设与弟子事务，暂不支持转让或解散。
            </p>
            <div className="progression-buttons">
              {s.location !== "inn" && (
                <Button disabled={!!blocked} onClick={() => travel("inn")}>
                  前往悦来客栈 · 两时辰
                </Button>
              )}
              <Button
                kind="ink"
                disabled={
                  !!blocked || !validName || !founding.every((n) => n.met)
                }
                onClick={() => setConfirm("found")}
              >
                拟立「{name || "新宗门"}」
              </Button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="sect-overview">
            <dl>
              <div>
                <dt>当前身份</dt>
                <dd>{sectTitle(s)}</dd>
              </div>
              <div>
                <dt>可用贡献</dt>
                <dd>{t.contribution}</dd>
              </div>
              <div>
                <dt>累计功绩</dt>
                <dd>{t.merit}</dd>
              </div>
              <div>
                <dt>门派驻地</dt>
                <dd>{info.place}</dd>
              </div>
            </dl>
            <p>
              贡献可用于兑换与请教；累计功绩只增不减，兑换不影响晋升。
              {info.specialty}。
            </p>
            {!at && (
              <Button
                kind="ink"
                disabled={!!blocked}
                onClick={() => travel(info.location)}
              >
                返回{info.place} · 两时辰
              </Button>
            )}
          </section>
          <section className="sect-guide">
            <h2>现在可以做什么</h2>
            <p>{nextText}</p>
            <div className="progression-buttons">
              <Button onClick={() => navigate("living")}>采集与制作物资</Button>
              <Button onClick={() => navigate("trial")}>闯塔积累功绩</Button>
              <Button onClick={() => navigate("calendar")}>
                查看年历与闭关
              </Button>
            </div>
          </section>
          <div className="sect-columns">
            <section className="sect-panel">
              <h2>宗门事务</h2>
              <p className="small muted">
                每日次数随游戏日更新，离线不会刷新。需在驻地办理。
              </p>
              <article className="sect-task">
                <h3>同门演武</h3>
                <p>
                  贡献与功绩 +10，修为 +{t.id === "qinglan" ? 30 : 20} ·
                  两时辰。与同门拆解招式，不损耗气血。
                </p>
                <Button
                  disabled={disabled || done("drill")}
                  onClick={() => act({ type: "sectDrill" })}
                >
                  {done("drill") ? "今日已演武" : "参加宗门演武"}
                </Button>
              </article>
              <article className="sect-task">
                <h3>宗库补给</h3>
                <p>
                  交付{itemById(info.supply).name} ×{info.count}（现有
                  {s.inventory[info.supply] || 0}）；贡献与功绩 +
                  {t.id === "baiyao" ? 24 : 18}，银两 +
                  {t.id === "tiegui" ? 24 : 12}，不耗时。
                </p>
                <Button
                  disabled={
                    disabled ||
                    done("supply") ||
                    (s.inventory[info.supply] || 0) < info.count
                  }
                  onClick={() => act({ type: "sectSupply" })}
                >
                  {done("supply") ? "今日已交付" : "交付宗门物资"}
                </Button>
              </article>
              <article className="sect-task">
                <h3>试炼报功</h3>
                <p>
                  入门后每新通关一层，贡献与功绩 +8；可申报
                  {Math.max(0, s.trial.highest - t.claimedFloor)}
                  层。历史已通关层不追补，重复挑战不重复记功。
                </p>
                <Button
                  disabled={disabled || s.trial.highest <= t.claimedFloor}
                  onClick={() => act({ type: "sectClaim" })}
                >
                  录入试炼功绩
                </Button>
              </article>
            </section>
            <section className="sect-panel">
              <h2>{t.id === "own" ? "掌门司簿" : "师门晋升"}</h2>
              {t.id === "own" ? (
                <>
                  <p>
                    驻地等级 {t.estate}/3 · 弟子 {t.disciples}/{t.estate * 3}人
                  </p>
                  <p>
                    一级别院可容3人，每升一级增加3个名额。招收每人40两、两时辰，每游戏日一次。
                  </p>
                  <Button
                    disabled={
                      disabled ||
                      done("recruit") ||
                      t.disciples >= t.estate * 3 ||
                      s.player.silver < 40
                    }
                    onClick={() => act({ type: "sectRecruit" })}
                  >
                    {done("recruit") ? "今日已招徒" : "招收弟子 · 40两"}
                  </Button>
                  <article className="sect-task">
                    <h3>建设驻地</h3>
                    {t.estate < 3 ? (
                      <>
                        <p>
                          升至{t.estate + 1}级：银两{s.player.silver}/
                          {t.estate * 200}，精铁{s.inventory.iron || 0}/
                          {t.estate * 6} · 一日。
                        </p>
                        <Button
                          disabled={
                            disabled ||
                            s.player.silver < t.estate * 200 ||
                            (s.inventory.iron || 0) < t.estate * 6
                          }
                          onClick={() => act({ type: "sectBuild" })}
                        >
                          扩建驻地
                        </Button>
                      </>
                    ) : (
                      <p>三级驻地已建成，可容纳9名弟子。</p>
                    )}
                  </article>
                  <article className="sect-task">
                    <h3>弟子协力济民</h3>
                    <p>
                      消耗鲜鱼汤1份（现有{s.inventory.soup || 0}）·
                      四时辰。按现有弟子获得银两{t.disciples * 8}、贡献与功绩
                      {t.disciples * 5}。每游戏日一次，需主动安排。
                    </p>
                    <Button
                      disabled={
                        disabled ||
                        done("outreach") ||
                        !t.disciples ||
                        !(s.inventory.soup > 0)
                      }
                      onClick={() => act({ type: "sectOutreach" })}
                    >
                      {done("outreach") ? "今日已济民" : "安排弟子济民"}
                    </Button>
                  </article>
                </>
              ) : (
                <>
                  <ol className="sect-ranks">
                    {sectRanks.map((r, i) => (
                      <li className={i <= t.rank ? "reached" : ""} key={r}>
                        {i <= t.rank ? "✓" : i + 1} {r}
                      </li>
                    ))}
                  </ol>
                  {t.rank < 3 ? (
                    <>
                      <h3>下一阶 · {sectRanks[t.rank + 1]}</h3>
                      {requirements(promotion)}
                      <Button
                        kind="ink"
                        disabled={disabled || !promotion.every((n) => n.met)}
                        onClick={() => act({ type: "sectPromote" })}
                      >
                        申请晋升 · 两时辰
                      </Button>
                      <p className="small muted">
                        不扣贡献与功绩；内门起开放传承与藏书。执事为本版最高门内身份。
                      </p>
                    </>
                  ) : (
                    <p>
                      已成为执事，可继续修行与贡献师门。若准备自创宗门，可先确认离门，再查看开宗条件。
                    </p>
                  )}
                  <details className="sect-leave">
                    <summary>离门与另投师承</summary>
                    <p>
                      离门清空本门身份、贡献与功绩，保留武学、装备和境界；耗时两时辰。当天事务不会重置。
                    </p>
                    <Button
                      disabled={disabled}
                      onClick={() => setConfirm("leave")}
                    >
                      商议离门
                    </Button>
                  </details>
                </>
              )}
            </section>
            <section className="sect-panel">
              <h2>藏经与传承</h2>
              <p>
                {t.rank < 1
                  ? "内门后开放，需要贡献；已学会的武学无需重购。"
                  : "请教不改变出战招式，武学录中可继续修习。"}
              </p>
              <article className="sect-task">
                <h3>{arts.find((a) => a.id === info.art)?.name}</h3>
                <p>30贡献 · 初始熟练10 · 两时辰。</p>
                <Button
                  disabled={
                    disabled ||
                    t.rank < 1 ||
                    t.contribution < 30 ||
                    (s.arts[info.art] || 0) > 0
                  }
                  onClick={() => act({ type: "sectLearn" })}
                >
                  {s.arts[info.art] ? "已习得传承" : "请教门中传承"}
                </Button>
              </article>
              <article className="sect-task">
                <h3>研读归元心法</h3>
                <p>
                  10贡献 · 熟练提升至多6点（当前{s.arts.innerArt || 0}/100）·
                  两时辰，每游戏日一次。
                </p>
                <Button
                  disabled={
                    disabled ||
                    t.rank < 1 ||
                    t.contribution < 10 ||
                    done("study") ||
                    s.arts.innerArt >= 100
                  }
                  onClick={() => act({ type: "sectStudy" })}
                >
                  {done("study") ? "今日已研读" : "研读藏书"}
                </Button>
              </article>
              <Button onClick={() => navigate("arts")}>查看武学与突破</Button>
            </section>
            <section className="sect-panel">
              <h2>宗库兑换</h2>
              <p>花费贡献换取补给与强化材料，不消耗时间。</p>
              {sectExchanges.map((e) => (
                <article className="sect-task" key={e.id}>
                  <h3>
                    {e.name} ×{e.count}
                  </h3>
                  <p>
                    {e.cost}贡献 · 已有{s.inventory[e.id] || 0}
                  </p>
                  <Button
                    disabled={disabled || t.contribution < e.cost}
                    onClick={() => act({ type: "sectExchange", id: e.id })}
                  >
                    兑换{e.name}
                  </Button>
                </article>
              ))}
              <Button onClick={() => navigate("inventory")}>打开行囊</Button>
            </section>
          </div>
        </>
      )}
      {confirm && (
        <Modal
          title={confirm === "found" ? "立派之前" : "辞别师门"}
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm === "found"
              ? `以「${name.trim()}」之名开宗，支出500两，耗时一日。驻地设于悦来客栈别院；本版暂不支持转让或解散。`
              : `辞别${info?.name}，清空身份、${t.contribution}贡献与${t.merit}累计功绩。已学武学、装备和境界保留。`}
          </p>
          <div className="progression-buttons">
            <Button
              kind="ink"
              disabled={!!blocked}
              onClick={() => {
                act(
                  confirm === "found"
                    ? { type: "sectFound", name }
                    : { type: "sectLeave" },
                );
                setConfirm(null);
              }}
            >
              {confirm === "found" ? "确认开宗 · 500两" : "确认离门"}
            </Button>
            <Button onClick={() => setConfirm(null)}>再想一想</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
