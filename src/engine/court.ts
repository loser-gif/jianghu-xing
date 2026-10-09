import type { GameState } from "../types";
import { courtCase, officialRanks, salaries } from "../data/court";
import { arts } from "../data/world";
import { earnCultivation, realms } from "./cultivation";
export const initialCourt = (): GameState["court"] => ({
  active: null,
  completed: {},
  attempted: {},
  salaryDay: -1,
  result: null,
});
export type CourtAction =
  | { type: "courtAccept" | "courtInvestigate"; id: string }
  | { type: "courtConfront" | "courtAbandon" | "courtSalary" }
  | { type: "courtResolve"; choice: "treasury" | "relief" };
export function officialNeeds(s: GameState) {
  const rank = s.identity.rank;
  if (rank < 1 || rank >= 4) return [];
  const reputation = [0, 25, 60, 110][rank],
    contribution = [0, 40, 100, 180][rank];
  const needs = [
    {
      text: `身份声望 ${s.identity.reputation}/${reputation}`,
      met: s.identity.reputation >= reputation,
    },
    {
      text: `官府贡献 ${s.identity.contribution}/${contribution}`,
      met: s.identity.contribution >= contribution,
    },
  ];
  if (rank > 1) {
    const realm = rank === 2 ? 3 : 5,
      id = rank === 2 ? "silver" : "edict";
    needs.push({
      text: `达到${realms[realm]}（当前${realms[s.cultivation.realm]}）`,
      met: s.cultivation.realm >= realm,
    });
    needs.push({
      text: `办结《${courtCase(id)!.title}》`,
      met: !!s.court.completed[id],
    });
  }
  return needs;
}
export function courtClose(
  s: GameState,
  outcome: "loss" | "expired" | "abandoned",
  text: string,
) {
  const a = s.court.active;
  if (!a) return text;
  s.court.result = { id: a.id, outcome, text };
  s.court.active = null;
  if (s.combat?.kind === "court") s.combat = null;
  s.identity.losses++;
  // Retry on the following game day, including a case that ran for multiple days.
  s.court.attempted[a.id] = Math.floor(s.time / 6);
  return text;
}
export function expireCourt(s: GameState) {
  const a = s.court?.active;
  if (
    a &&
    ["investigate", "ready"].includes(a.stage) &&
    s.time - a.acceptedAt >= 48
  )
    return courtClose(
      s,
      "expired",
      "八日调查期限已过，目标转移。案卷保留，下一游戏日可在官府重新接案。",
    );
  return "";
}
export function courtAction(s: GameState, a: CourtAction, maxHp: number) {
  const result = (text: string, ticks = 0) => ({ text, ticks });
  const active = s.court.active,
    c = courtCase(active?.id),
    day = Math.floor(s.time / 6);
  if (a.type === "courtSalary") {
    if (s.location !== "office" || s.identity.rank < 1)
      return result("请到官府，以在职身份领取俸银。");
    if (s.court.salaryDay === day)
      return result("本游戏日已领取俸银，离线不会刷新。");
    const amount = salaries[s.identity.rank];
    s.player.silver += amount;
    s.court.salaryDay = day;
    return result(
      `领取${officialRanks[s.identity.rank]}俸银${amount}两。每游戏日一次，晋升不会重置当日领取次数。`,
    );
  }
  if (a.type === "courtAccept") {
    const target = courtCase(a.id);
    if (
      !target ||
      s.location !== "office" ||
      s.identity.rank < target.rank ||
      s.quest.stage !== "completed"
    )
      return result("需办结烟雨楼盗案，并以对应官阶在官府接案。");
    if (active) return result("请先处理当前案卷，一次只能接一桩新案。");
    if (s.court.completed[a.id])
      return result("此案已经办结，不能重复领取结案奖励。");
    if (s.court.attempted[a.id] === day)
      return result("本游戏日已办过此案，下一游戏日可重整再接。");
    s.court.active = {
      id: a.id,
      stage: "investigate",
      acceptedAt: s.time,
      evidence: [],
    };
    s.court.attempted[a.id] = day;
    s.court.result = null;
    return result(
      `接取《${target.title}》。八日内查齐两份证据并拦截目标；调查地点与下一步已列入案卷。`,
    );
  }
  if (!active || !c) return result("当前没有在办案卷，请先到官府接取。");
  if (a.type === "courtAbandon")
    return result(
      courtClose(
        s,
        "abandoned",
        "你暂时撤回案卷，记录一次失利。下一游戏日可回官府重新接案，已用补给不返还。",
      ),
    );
  if (a.type === "courtInvestigate") {
    const clue = c.clues.find((x) => x.id === a.id);
    if (active.stage !== "investigate" || !clue || s.location !== clue.location)
      return result("请到案卷指定地点调查。");
    if (active.evidence.includes(a.id))
      return result("这份证据已经录入，无需重复调查。");
    active.evidence.push(a.id);
    if (active.evidence.length === c.clues.length) active.stage = "ready";
    return result(
      clue.text +
        (active.stage === "ready"
          ? " 证据齐备，可以拦截目标。"
          : " 已录入证据，继续调查另一处。"),
      1,
    );
  }
  if (a.type === "courtConfront") {
    if (active.stage !== "ready" || s.location !== c.location)
      return result("查齐两份证据后，到目标所在地拦截。");
    if (s.player.hp < Math.ceil(maxHp * 0.3))
      return result("气血不足三成，先去药庐疗伤再行动。");
    active.stage = "combat";
    s.combat = {
      kind: "court",
      hp: c.hp,
      maxHp: c.hp,
      round: 1,
      guarded: false,
      logs: [`${c.target}拒绝交出赃证，非致命交锋开始。`],
    };
    return result(
      `拦下${c.target}，自动交锋开始。战胜后仍需返回官府选择结案处置。`,
    );
  }
  if (a.type === "courtResolve") {
    if (active.stage !== "verdict" || s.location !== "office")
      return result("战胜后返回官府办理结案。");
    if (!["treasury", "relief"].includes(a.choice) || s.court.completed[c.id])
      return result("请选择有效的结案处置。");
    const relief = a.choice === "relief",
      silver = c.silver - (relief ? 60 : 0);
    s.player.silver += silver;
    s.player.morality += relief ? 4 : 1;
    s.player.fame += 3;
    s.identity.reputation += c.reputation;
    s.identity.contribution += c.contribution;
    s.identity.wins++;
    const xp = earnCultivation(s, c.xp);
    s.cultivation.insights += c.insights;
    s.court.completed[c.id] = a.choice;
    s.court.active = null;
    const text = `《${c.title}》结案。${c.ending}${relief ? " 你从赏银中拨出60两，先行救助受害百姓，侠义 +4。" : " 证赃依律归档，侠义 +1。"} 获银两${silver}、声望${c.reputation}、官府贡献${c.contribution}、修为${xp}、感悟${c.insights}。`;
    s.court.result = { id: c.id, outcome: "win", text };
    return result(text, 1);
  }
  return result("当前案卷阶段不支持此操作。");
}
export function resolveCourtRound(
  s: GameState,
  id: string,
  d: { attack: number; defense: number; maxHp: number; maxQi: number },
) {
  const c = s.combat!,
    a = s.court.active!,
    f = courtCase(a.id)!;
  if (id === "escape")
    return courtClose(
      s,
      "loss",
      "你撤出交锋，目标趁机转移。保留物品和官阶，下一游戏日可重新接案。",
    );
  if (!["attack", "art", "defend", "light", "medicine"].includes(id))
    return "无效交锋行动。";
  const art = arts.find((x) => x.id === s.activeArt)!;
  let damage = 0,
    defend = false,
    evade = false;
  if (id === "medicine") {
    if (!(s.inventory.medicine > 0) || s.player.hp >= d.maxHp)
      return "无需用药或金疮药不足。";
    s.inventory.medicine--;
    s.player.hp = Math.min(d.maxHp, s.player.hp + 65);
    c.logs.unshift("服下金疮药，气血恢复至多65。对手仍会行动。");
  } else if (id === "defend") {
    defend = true;
    s.player.qi = Math.min(d.maxQi, s.player.qi + 14);
    c.logs.unshift("收势防御，内力恢复至多14。");
  } else {
    damage = d.attack;
    if (id === "art") {
      if (!(s.arts[art.id] > 0) || s.player.qi < art.cost)
        return "武学未学会或内力不足。";
      s.player.qi -= art.cost;
      damage +=
        art.power +
        Math.floor(s.arts[art.id] / 8) +
        (s.flags[`break_${art.id}`] ? 10 : 0);
      s.arts[art.id] = Math.min(100, s.arts[art.id] + 2);
    }
    if (id === "light") {
      if (!(s.arts.lightArt > 0) || s.player.qi < 8)
        return "需学会追云步并留有8内力。";
      s.player.qi -= 8;
      evade = true;
      damage *= 0.55;
    }
    damage = Math.max(1, Math.floor(damage - f.defense));
    c.hp = Math.max(0, c.hp - damage);
    c.logs.unshift(
      `${id === "art" ? art.name : id === "light" ? "追云步" : "普通攻击"}造成${damage}点伤害。`,
    );
  }
  if (c.hp === 0) {
    a.stage = "verdict";
    s.combat = null;
    return `${f.target}失去战力，随行差役将其控制，证赃齐全。返回官府结案，奖励将在确认处置后发放。`;
  }
  const incoming = evade
    ? 0
    : Math.max(
        1,
        Math.floor(
          (f.attack * (c.round % 3 === 0 ? 1.4 : 1) - d.defense) *
            (defend ? 0.35 : 1),
        ),
      );
  s.player.hp = Math.max(1, s.player.hp - incoming);
  c.logs.unshift(
    evade
      ? "轻功避开了这一击。"
      : `${f.target}${c.round % 3 === 0 ? "蓄力重击" : "出招"}，你受到${incoming}点伤害。`,
  );
  c.round++;
  c.logs = c.logs.slice(0, 25);
  if (s.player.hp === 1)
    return courtClose(
      s,
      "loss",
      "交锋失利，随行差役护你退下。气血剩1，官阶与物品保留；先疗伤，下一游戏日可重接。",
    );
  return c.logs.slice(0, 2).join(" ");
}
