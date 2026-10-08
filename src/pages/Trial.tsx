import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import { derived } from "../engine/game";
import { trialReward } from "../engine/trial";
import { trialFloors, trialExchanges, weaponFits } from "../data/trial";
import { arts, items } from "../data/world";
import { Button, Icon } from "../components/UI";
export function Trial({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const [selected, select] = useState(Math.min(30, s.trial.highest + 1));
  const act = useGame((x) => x.act),
    f = trialFloors[selected - 1],
    reward = trialReward({ ...s, time: s.time + 1 }, selected),
    d = derived(s);
  const art = arts.find((a) => a.id === s.activeArt)!;
  const fit = weaponFits[art.id]?.includes(s.equipped.weapon);
  const busy = !["locked", "available", "completed", "failed"].includes(
    s.quest.stage,
  );
  const reason = s.life.ended
    ? "此生已结卷，可回看人物与手记"
    : selected > s.trial.highest + 1
      ? "先通关前一层"
      : busy
        ? "先处理计时中的缉捕案"
        : s.location !== "lake"
          ? "先前往西湖"
          : s.player.hp < Math.ceil(d.maxHp * 0.3)
            ? "气血低于三成，先去疗伤"
            : "";
  return (
    <div className="trial-page">
      <section className="trial-intro">
        <span className="eyebrow">西湖畔 · 问心试炼</span>
        <h2>三十层，一步一试剑</h2>
        <p>
          战前配装，自动交锋。每5层遇守关人；战斗可暂停、倍速或撤离，已通关进度永久保留。
        </p>
        <div className="trial-totals">
          <span>
            最高通关 <b>{s.trial.highest} / 30</b>
          </span>
          <span>
            试炼印 <b>{s.trial.marks}</b>
          </span>
          <span>
            获胜 <b>{s.trial.wins} 次</b>
          </span>
        </div>
      </section>
      {s.trial.result && (
        <section
          className={`trial-result ${s.trial.result.outcome}`}
          role="status"
        >
          <h2>
            {s.trial.result.outcome === "win"
              ? "此层已过"
              : s.trial.result.outcome === "loss"
                ? "收势休整"
                : "暂别试炼"}
          </h2>
          <p>{s.trial.result.text}</p>
          <div className="progression-buttons">
            {s.trial.result.outcome === "win" && s.trial.highest < 30 && (
              <Button onClick={() => select(s.trial.highest + 1)}>
                查看下一层
              </Button>
            )}
            <Button onClick={() => navigate("arts")}>修习 / 突破</Button>
            <Button
              onClick={() => {
                act({ type: "move", id: "herb" });
                navigate("jianghu");
              }}
            >
              前往药庐 · 两时辰
            </Button>
          </div>
        </section>
      )}
      <div className="trial-layout">
        <section className="trial-floors">
          <h2>选择楼层</h2>
          <p className="small muted">
            ✓ 已通关 · 印章为守关层。未解锁楼层可提前查看。
          </p>
          <div className="floor-grid">
            {trialFloors.map((x) => (
              <button
                key={x.floor}
                aria-label={`第${x.floor}层${x.boss ? "守关" : ""}`}
                aria-pressed={selected === x.floor}
                className={`${x.boss ? "boss" : ""} ${x.floor > s.trial.highest + 1 ? "locked" : ""}`}
                onClick={() => select(x.floor)}
              >
                <b>{String(x.floor).padStart(2, "0")}</b>
                <small>
                  {x.floor <= s.trial.highest
                    ? "已过"
                    : x.boss
                      ? "守关"
                      : x.floor === s.trial.highest + 1
                        ? "可挑战"
                        : "未解锁"}
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="trial-preparation">
          <span className="eyebrow">
            第 {selected} 层 · {f.boss ? "守关之战" : "切磋试炼"}
          </span>
          <h2>{f.name}</h2>
          <p>
            气血 {f.hp} · 外功 {f.attack} · 防御 {f.defense}
          </p>
          <p className="combat-intent">{f.hint}</p>
          <dl>
            <dt>你的状态</dt>
            <dd>
              气血 {s.player.hp}/{d.maxHp} · 内力 {s.player.qi}/{d.maxQi}
            </dd>
            <dt>当前配合</dt>
            <dd>
              {items.find((i) => i.id === s.equipped.weapon)?.name ||
                "未持兵器"}{" "}
              + {art.name}
              <strong>
                {fit
                  ? " · 适配：试炼武学伤害 +20%"
                  : " · 未适配，可调整装备或出战武学"}
              </strong>
            </dd>
            <dt>{reward.first ? "首通奖励" : "复战奖励"}</dt>
            <dd>
              修为 {reward.xp} · 银两 {reward.silver} · 试炼印 {reward.marks} ·
              精铁 {reward.iron}
              {reward.first && f.boss ? " · 感悟1 / 潜能4" : ""}
            </dd>
          </dl>
          <div className="progression-buttons">
            <Button onClick={() => navigate("inventory")}>调整装备</Button>
            <Button onClick={() => navigate("arts")}>调整武学</Button>
          </div>
          {s.location !== "lake" && (
            <Button onClick={() => act({ type: "move", id: "lake" })}>
              前往西湖 · 两时辰
            </Button>
          )}
          <Button
            kind="ink"
            disabled={!!reason}
            onClick={() => act({ type: "trialEnter", floor: selected })}
          >
            挑战第 {selected} 层 · 两时辰
          </Button>
          <p className="small muted">
            {reason || "无需门票。气血不会自动补满；战斗每回合自动保存。"}
          </p>
        </section>
      </div>
      <section className="trial-exchange">
        <h2>试炼印兑换</h2>
        <p>首通普通层获1枚、守关层获3枚。重复挑战不再产出试炼印。</p>
        <div className="guide-routes">
          {trialExchanges.map((e) => {
            const owned =
              e.id === "lightArt"
                ? !!s.arts.lightArt
                : ["sword", "boots"].includes(e.id) && !!s.inventory[e.id];
            return (
              <article key={e.id}>
                <Icon name={e.id === "lightArt" ? "wind" : "bag"} />
                <h3>{e.name}</h3>
                <p>{e.description}</p>
                <Button
                  disabled={
                    owned || s.location !== "lake" || s.trial.marks < e.cost
                  }
                  onClick={() => act({ type: "trialExchange", id: e.id })}
                >
                  {owned ? "已拥有" : `兑换 · ${e.cost}枚试炼印`}
                </Button>
              </article>
            );
          })}
        </div>
        {s.location !== "lake" && <p>兑换需身处西湖。</p>}
      </section>
      <details className="trial-rules">
        <summary>奖励、失败与战斗规则</summary>
        <p>
          每层首通奖励只发一次。已通关层每个游戏日可领取一次较少的修为与银两；其余挑战仅练习。新一天由游戏中的时辰推进，不需要现实签到。每次入塔消耗两时辰。
        </p>
        <p>
          敌人依次切换守势、重击和换气。守势削弱普通攻击，武学可破守；防御或轻功化解重击后获得一次反击加成；换气回合是进攻机会。内功熟练度提高试炼中的防御回气。落败保留进度与物品，气血剩1；撤离没有额外惩罚。
        </p>
      </details>
    </div>
  );
}
