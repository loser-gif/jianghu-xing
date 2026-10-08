import type { GameState } from "../types";
import { arts } from "../data/world";
import { trialIntent } from "./trial";
export const initialBattle = (): GameState["battle"] => ({
  strategy: "balanced",
  medicine: false,
  speed: 1,
});
export function autoDecision(s: GameState, maxHp: number) {
  const c = s.combat;
  if (!c) return { id: "attack", reason: "交锋已结束" };
  const heavy =
    c.kind === "trial"
      ? trialIntent(c.floor!, c.round).kind === "heavy"
      : c.round % 3 === 0;
  const art = arts.find((a) => a.id === s.activeArt)!;
  if (
    s.battle.medicine &&
    s.inventory.medicine > 0 &&
    s.player.hp <= maxHp * 0.35
  )
    return { id: "medicine", reason: "气血低于35%，自动服用金疮药" };
  if (heavy && s.battle.strategy !== "offense")
    return s.arts.lightArt > 0 && s.player.qi >= 8
      ? { id: "light", reason: "对手蓄力，施展轻功避让" }
      : { id: "defend", reason: "对手蓄力，防御调息后寻找反击" };
  if (s.battle.strategy === "guarded" && s.player.qi < art.cost + 8)
    return { id: "defend", reason: "谨慎策略：留足内力再进攻" };
  if (s.arts[art.id] > 0 && s.player.qi >= art.cost)
    return { id: "art", reason: `施展${art.name}，消耗${art.cost}内力` };
  if (s.player.qi < art.cost && c.round % 2 === 0)
    return { id: "defend", reason: "内力不足，先调息恢复" };
  return { id: "attack", reason: "普通攻击，不消耗内力" };
}
