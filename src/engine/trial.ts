import type { GameState } from "../types";
import { arts } from "../data/world";
import { trialFloors, weaponFits } from "../data/trial";
import { earnCultivation } from "./cultivation";

export const initialTrial = (): GameState["trial"] => ({
  highest: 0,
  wins: 0,
  marks: 0,
  potential: 0,
  rewarded: {},
  result: null,
});
export function trialIntent(floor: number, round: number) {
  const f = trialFloors[floor - 1];
  const phase = (round - 1 + ((floor - 1) % 3)) % 3;
  if (phase === 0)
    return {
      kind: "guard",
      label: "守势试探",
      power: Math.floor(f.attack * 0.65),
      hint: "普通攻击易被挡下；武学更适合破守。",
    };
  if (phase === 1)
    return {
      kind: "heavy",
      label: "蓄力重击",
      power: Math.floor(f.attack * 1.5),
      hint: "防御或轻功化解后，下一次攻击伤害 +50%。",
    };
  return {
    kind: "open",
    label: "收势换气",
    power: Math.floor(f.attack * 0.8),
    hint: "对手露出破绽，本回合受到伤害 +25%。",
  };
}
export function trialReward(s: GameState, floor: number) {
  const f = trialFloors[floor - 1];
  const first = floor > s.trial.highest;
  const eligible = first || s.trial.rewarded[floor] !== Math.floor(s.time / 6);
  return {
    first,
    eligible,
    xp:
      eligible && s.cultivation.realm < 14
        ? first
          ? f.xp
          : Math.floor(f.xp / 4)
        : 0,
    silver: eligible ? (first ? f.silver : Math.floor(f.silver / 4)) : 0,
    marks: first ? f.marks : 0,
    iron: first ? (f.boss ? 4 : 1) : 0,
  };
}
export function resolveTrialRound(
  s: GameState,
  id: string,
  d: { attack: number; defense: number; maxHp: number; maxQi: number },
) {
  const c = s.combat!;
  const f = trialFloors[c.floor! - 1];
  const intent = trialIntent(f.floor, c.round);
  const art = arts.find((a) => a.id === s.activeArt)!;
  const finish = (outcome: "win" | "loss" | "retreat", text: string) => {
    s.trial.result = { floor: f.floor, outcome, text };
    s.combat = null;
    return text;
  };
  if (id === "escape")
    return finish(
      "retreat",
      "你退出本层，已通关层数保留。没有扣除银两与试炼印，休整后可重新挑战。",
    );
  if (!["attack", "art", "defend", "light", "medicine"].includes(id))
    return "请选择一种战斗行动。";
  let damage = 0,
    defending = false,
    evading = false;
  if (id === "medicine") {
    if (!(s.inventory.medicine > 0) || s.player.hp >= d.maxHp)
      return "无需用药或金疮药不足，本回合未消耗。";
    s.inventory.medicine--;
    s.player.hp = Math.min(d.maxHp, s.player.hp + 65);
    c.logs.unshift("服下金疮药，气血恢复至多 65 点；对手仍会行动。");
  } else if (id === "defend") {
    defending = true;
    const recovery = 14 + Math.floor((s.arts.innerArt || 0) / 20);
    s.player.qi = Math.min(d.maxQi, s.player.qi + recovery);
    c.logs.unshift(
      `收势防御，内力恢复至多 ${recovery}。归元心法越熟练，调息越有效。`,
    );
  } else {
    if (id === "art" && (!(s.arts[art.id] > 0) || s.player.qi < art.cost))
      return "出战武学未学会或内力不足，请防御调息。";
    if (id === "light" && (!(s.arts.lightArt > 0) || s.player.qi < 8))
      return "需学会追云步，并留有 8 点内力。";
    damage = d.attack;
    if (id === "art") {
      s.player.qi -= art.cost;
      damage +=
        art.power +
        Math.floor(s.arts[art.id] / 8) +
        (s.player.talents.includes("sword") && art.type === "剑法" ? 6 : 0) +
        (s.flags[`break_${art.id}`] ? 10 : 0);
      if (weaponFits[art.id]?.includes(s.equipped.weapon)) damage *= 1.2;
      s.arts[art.id] = Math.min(100, s.arts[art.id] + 2);
    }
    if (id === "light") {
      s.player.qi -= 8;
      evading = true;
      damage *= 0.55;
    }
    if (c.advantage) {
      damage *= 1.5;
      c.advantage = false;
      c.logs.unshift("乘隙反击！本次伤害 +50%。");
    }
    if (intent.kind === "guard") damage *= id === "art" ? 0.75 : 0.35;
    if (intent.kind === "open") damage *= 1.25;
    damage = Math.max(1, Math.floor(damage - f.defense));
    c.hp = Math.max(0, c.hp - damage);
    c.logs.unshift(
      `${id === "art" ? art.name : id === "light" ? "追云步" : "普通攻击"}造成 ${damage} 点伤害。`,
    );
  }
  if (c.hp === 0) {
    const r = trialReward(s, f.floor);
    const xp = earnCultivation(s, r.xp);
    s.player.silver += r.silver;
    s.trial.marks += r.marks;
    s.inventory.iron = (s.inventory.iron || 0) + r.iron;
    if (r.first && f.boss) {
      s.cultivation.insights++;
      s.player.fame += 2;
      s.trial.potential += 4;
    }
    if (r.first) {
      s.flags.spars = Number(s.flags.spars || 0) + 1;
      s.flags.guide_trial = true;
    }
    s.trial.highest = Math.max(s.trial.highest, f.floor);
    s.trial.wins++;
    s.trial.rewarded[f.floor] = Math.floor(s.time / 6);
    return finish(
      "win",
      `第 ${f.floor} 层${r.first ? "首次通关" : "复战获胜"}：修为 +${xp}，银两 +${r.silver}，试炼印 +${r.marks}，精铁 +${r.iron}。${r.first && f.boss ? "守关历练：江湖感悟 +1，潜能 +4，可在人物页分配。" : ""}${!r.eligible ? "本层本游戏日奖励已领取。" : ""}`,
    );
  }
  const incoming = evading
    ? 0
    : Math.max(
        defending ? 1 : 3,
        Math.floor((intent.power - d.defense) * (defending ? 0.3 : 1)),
      );
  s.player.hp = Math.max(1, s.player.hp - incoming);
  c.logs.unshift(
    evading
      ? "轻功避开了这一轮进攻。"
      : `${f.name}${intent.label}，你受到 ${incoming} 点伤害。`,
  );
  if ((defending || evading) && intent.kind === "heavy") {
    c.advantage = true;
    c.logs.unshift("化解重击，获得反击机会。下一次攻击伤害 +50%。");
  }
  c.round++;
  c.logs = c.logs.slice(0, 25);
  if (s.player.hp === 1)
    return finish(
      "loss",
      "本层挑战失利，守阁人收住攻势。保留已通关层数与物品，气血剩 1；先去药庐疗伤，再调整装备和武学。",
    );
  return c.logs.slice(0, 2).join(" ");
}
