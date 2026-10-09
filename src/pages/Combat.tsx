import { autoDecision } from "../engine/autobattle";
import { realms } from "../engine/cultivation";
import { trialFloors } from "../data/trial";
import { courtCase } from "../data/court";
import { trialIntent } from "../engine/trial";
import { useGame } from "../store";
import { Icon, Portrait, Button, Meter, Modal } from "../components/UI";
import type { GameState } from "../types";
import { derived } from "../engine/game";
import { useEffect, useRef, useState } from "react";

function CombatPortrait({
  gender,
  index = 6,
  delta = 0,
  round,
}: {
  gender?: "male" | "female";
  index?: number;
  delta?: number;
  round: number;
}) {
  return (
    <div className="combat-portrait">
      <Portrait index={index} gender={gender} />
      {delta !== 0 && (
        <div
          key={round}
          className={`combat-impact ${delta > 0 ? "restoring" : "struck"}`}
          aria-hidden="true"
        >
          <i className="impact-mark" />
          <span className="impact-number">
            {delta > 0 ? "+" : "−"}
            {Math.abs(delta)}
          </span>
        </div>
      )}
    </div>
  );
}

export function Combat({ s }: { s: GameState }) {
  const act = useGame((x) => x.act);
  const storageError = useGame((x) => x.storageError);
  const c = s.combat!,
    d = derived(s);
  const trial = c.kind === "trial" ? trialFloors[c.floor! - 1] : null;
  const court = c.kind === "court" ? courtCase(s.court.active?.id) : null;
  const intent = trial ? trialIntent(trial.floor, c.round) : null;
  const [paused, setPaused] = useState(c.round > 1 || document.hidden);
  const decision = autoDecision(s, d.maxHp);
  useEffect(() => {
    if (storageError) setPaused(true);
  }, [storageError]);
  useEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => document.removeEventListener("visibilitychange", pauseHidden);
  }, []);
  useEffect(() => {
    if (paused || document.hidden || storageError) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) act({ type: "autoRound" });
    }, 1600 / s.battle.speed);
    return () => window.clearTimeout(timer);
  }, [paused, c.round, c.hp, s.battle, s.player.hp, storageError, act]);
  const previous = useRef({ round: c.round, player: s.player.hp, enemy: c.hp });
  const [pulse, setPulse] = useState<{
    round: number;
    player: number;
    enemy: number;
  } | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = { round: c.round, player: s.player.hp, enemy: c.hp };
    if (before.round === c.round) return;
    setPulse({
      round: c.round,
      player: s.player.hp - before.player,
      enemy: c.hp - before.enemy,
    });
    const timer = window.setTimeout(() => setPulse(null), 1200);
    return () => window.clearTimeout(timer);
  }, [c.round, c.hp, s.player.hp]);
  return (
    <Modal
      title={
        trial
          ? `问心试炼 · 第${trial.floor}层`
          : court
            ? `${court.title} · 交锋`
            : "旧码头 · 交锋"
      }
      wide
    >
      <div className="combat-round">
        第 {c.round} 回合{" "}
        <span>{trial ? "切磋 · 可随时撤离" : "活捉 · 非致命交锋"}</span>
      </div>
      <div className="combatants">
        <div>
          <CombatPortrait
            gender={s.player.gender}
            delta={pulse?.player}
            round={pulse?.round ?? c.round}
          />
          <h3>
            {s.player.name} · {realms[s.cultivation.realm]}
          </h3>
          <Meter label="气血" value={s.player.hp} max={d.maxHp} color="red" />
          <Meter label="内力" value={s.player.qi} max={d.maxQi} />
        </div>
        <span className="versus">
          交<br />锋
        </span>
        <div>
          {trial || court ? (
            <div
              className="trial-opponent"
              aria-label={court?.target || trial?.name}
            >
              <Icon name={court || trial?.boss ? "shield" : "swords"} />
              <span>{court ? "缉捕" : trial?.boss ? "守关" : "试剑"}</span>
            </div>
          ) : (
            <CombatPortrait
              index={5}
              delta={pulse?.enemy}
              round={pulse?.round ?? c.round}
            />
          )}
          <h3>{trial ? trial.name : court ? court.target : "顾红绫 · 八品"}</h3>
          <Meter label="气血" value={c.hp} max={c.maxHp} color="red" />
          <p className="small muted">
            {court
              ? `拒捕交锋 · 防御 ${court.defense}`
              : trial
                ? `${trial.style} · 防御 ${trial.defense}`
                : "身轻如燕 · 每三回合使出燕返"}
          </p>
        </div>
      </div>
      <p className="combat-intent">
        {court
          ? `敌方意图：${c.round % 3 === 0 ? "蓄力重击" : "试探进攻"}（基础伤害 ${Math.floor(court.attack * (c.round % 3 === 0 ? 1.4 : 1))}）· 重击宜防御或轻功闪避`
          : intent
            ? `敌方意图：${intent.label}（基础伤害 ${intent.power}）· ${intent.hint}`
            : c.round % 3 === 0
              ? "敌方意图：燕返重击（基础 44）· 宜防守或轻功闪避"
              : "敌方意图：试探进攻（基础 32）· 防御会抵消部分伤害"}
      </p>
      {c.advantage && (
        <p className="trial-advantage">反击机会已就绪 · 下一次攻击伤害 +50%</p>
      )}
      <section className="auto-battle-panel" aria-label="自动战斗设置">
        {storageError && (
          <p role="alert">{storageError} 自动战斗已暂停；请先处理保存问题。</p>
        )}
        <div className="auto-battle-status">
          <strong>{paused ? "自动战斗已暂停" : "自动交锋中"}</strong>
          <span>下一步：{decision.reason}</span>
        </div>
        <div className="auto-battle-controls">
          <label>
            战术
            <select
              aria-label="战斗策略"
              value={s.battle.strategy}
              onChange={(e) =>
                act({
                  type: "battlePlan",
                  strategy: e.target.value as GameState["battle"]["strategy"],
                })
              }
            >
              <option value="balanced">均衡 · 看破进退</option>
              <option value="offense">强攻 · 招式优先</option>
              <option value="guarded">谨慎 · 预留内力</option>
            </select>
          </label>
          <label>
            速度
            <select
              aria-label="战斗速度"
              value={s.battle.speed}
              onChange={(e) =>
                act({
                  type: "battlePlan",
                  speed: Number(e.target.value) as 1 | 2 | 4,
                })
              }
            >
              <option value={1}>1倍</option>
              <option value={2}>2倍</option>
              <option value={4}>4倍</option>
            </select>
          </label>
        </div>
        <label className="auto-medicine">
          <input
            type="checkbox"
            checked={s.battle.medicine}
            onChange={(e) =>
              act({ type: "battlePlan", medicine: e.target.checked })
            }
          />{" "}
          气血≤35%时自动用金疮药（余{s.inventory.medicine || 0}）
        </label>
        <div className="progression-buttons">
          <Button kind="ink" onClick={() => setPaused(!paused)}>
            {paused ? "继续自动战斗" : "暂停战斗"}
          </Button>
          <Button
            kind="danger"
            onClick={() => act({ type: "fight", id: "escape" })}
          >
            {trial ? "撤离 · 保留进度" : "撤离 · 本案失利"}
          </Button>
        </div>
        <p className="small muted">
          每回合自动保存。切到后台会暂停；刷新后从主菜单继续，非首回合需手动恢复。不会自动挑战下一层。
        </p>
      </section>
      <div className="combat-log" aria-live="polite">
        {c.logs.slice(0, 5).map((l, i) => (
          <p key={`${c.round}-${i}`} className={i === 0 ? "latest" : ""}>
            {l}
          </p>
        ))}
      </div>
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
    </Modal>
  );
}
