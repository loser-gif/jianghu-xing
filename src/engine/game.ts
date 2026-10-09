import { initialLife, lifeInfo, timedCase } from "./calendar";
import { initialBattle, autoDecision } from "./autobattle";
import { initialLiving, livingAction } from "./living";
import { initialSect, sectAction, type SectAction } from "./sect";
import {
  initialCourt,
  courtAction,
  resolveCourtRound,
  expireCourt,
  officialNeeds,
  type CourtAction,
} from "./court";
import { officialRanks } from "../data/court";
import type { GameState, Condition, Effect, Stats } from "../types";
import {
  arts,
  origins,
  locations,
  npcs,
  items,
  npcLocation,
  shopStock,
} from "../data/world";
import { events } from "../data/events";

import {
  initialCultivation,
  realmBonus,
  breakthroughNeeds,
  earnCultivation,
  realms,
} from "./cultivation";
import { commissions, commissionStage, introText } from "./sidequests";
import { initialTrial, resolveTrialRound } from "./trial";
import { trialFloors, trialExchanges } from "../data/trial";

export const freshState = (): GameState => ({
  version: 1,
  started: false,
  cultivation: initialCultivation(),
  life: initialLife(),
  battle: initialBattle(),
  living: initialLiving(),
  sect: initialSect(),
  court: initialCourt(),
  trial: initialTrial(),
  player: {
    name: "沈辞",
    gender: "male",
    origin: "escort",
    talents: [],
    weapon: "剑",
    stats: { root: 60, insight: 62, agility: 60, spirit: 60 },
    hp: 250,
    qi: 100,
    silver: 80,
    fame: 0,
    morality: 0,
  },
  location: "lake",
  time: 2,
  inventory: {},
  equipped: {},
  upgrades: {},
  arts: {},
  activeArt: "swordArt",
  relationships: Object.fromEntries(
    npcs.map((n) => [n.id, { favor: 0, trust: 0, met: false, memories: [] }]),
  ),
  flags: {},
  identity: { rank: 0, reputation: 0, contribution: 0, wins: 0, losses: 0 },
  quest: {
    stage: "locked",
    acceptedAt: 0,
    clues: [],
    controls: [],
    failure: "",
  },
  combat: null,
  activeEvent: null,
  journal: [],
  lastMessage: "",
});
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function derived(s: GameState) {
  const bonus = realmBonus(s);
  const gear = Object.values(s.equipped)
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean);
  const set = s.equipped.armor === "robe" && s.equipped.feet === "boots";
  return {
    maxHp:
      bonus.hp +
      150 +
      s.player.stats.root * 2 +
      (s.player.talents.includes("strong") ? 40 : 0) +
      gear.reduce((n, g) => n + (g?.hp || 0), 0) +
      gear.reduce(
        (n, g) => n + (g?.slot !== "weapon" ? (s.upgrades[g!.id] || 0) * 5 : 0),
        0,
      ) +
      (set ? 30 : 0),
    maxQi: bonus.qi + 60 + s.player.stats.spirit,
    attack:
      bonus.attack +
      10 +
      Math.floor(s.player.stats.root / 5) +
      gear.reduce((n, g) => n + (g?.attack || 0), 0) +
      (s.upgrades[s.equipped.weapon] || 0) * 3 +
      (s.player.talents.includes("fierce") ? 4 : 0),
    defense:
      bonus.defense +
      5 +
      Math.floor(s.player.stats.root / 12) +
      gear.reduce(
        (n, g) =>
          n +
          (g?.defense || 0) +
          (g?.slot !== "weapon" ? (s.upgrades[g!.id] || 0) * 2 : 0),
        0,
      ),
    set,
  };
}
export function meets(s: GameState, c: Condition = {}) {
  return (
    (c.minRealm === undefined || s.cultivation.realm >= c.minRealm) &&
    (!c.flag || !!s.flags[c.flag]) &&
    (!c.notFlag || !s.flags[c.notFlag]) &&
    (!c.minStat || s.player.stats[c.minStat[0]] >= c.minStat[1]) &&
    (!c.item ||
      (c.item[0] === "silver"
        ? s.player.silver
        : s.inventory[c.item[0]] || 0) >= c.item[1]) &&
    (!c.relation || s.relationships[c.relation[0]].trust >= c.relation[1]) &&
    (!c.identity || s.identity.rank > 0) &&
    (!c.stage || s.quest.stage === c.stage) &&
    (!c.period || c.period.includes(s.time % 6))
  );
}
function note(s: GameState, text: string) {
  s.lastMessage = text;
  s.journal.unshift({ time: s.time, text });
  s.journal = s.journal.slice(0, 120);
}
function remember(s: GameState, id: string, text: string) {
  const r = s.relationships[id];
  if (r && !r.memories.includes(text)) r.memories.unshift(text);
}
function relation(s: GameState, id: string, favor: number, trust: number) {
  const r = s.relationships[id];
  r.met = true;
  r.favor = clamp(r.favor + favor, 0, 100);
  r.trust = clamp(r.trust + trust, 0, 100);
}
function add(s: GameState, id: string, n: number) {
  s.inventory[id] = Math.max(0, (s.inventory[id] || 0) + n);
}
export function applyEffect(s: GameState, e: Effect) {
  if (e.silver) s.player.silver = Math.max(0, s.player.silver + e.silver);
  if (e.hp) s.player.hp = clamp(s.player.hp + e.hp, 1, derived(s).maxHp);
  if (e.qi) s.player.qi = clamp(s.player.qi + e.qi, 0, derived(s).maxQi);
  if (e.fame) s.player.fame += e.fame;
  if (e.morality) s.player.morality += e.morality;
  if (e.item) add(s, ...e.item);
  if (e.flag) s.flags[e.flag[0]] = e.flag[1];
  if (e.relation) relation(s, ...e.relation);
  if (e.art)
    s.arts[e.art[0]] = Math.min(100, (s.arts[e.art[0]] || 0) + e.art[1]);
}
function fail(s: GameState, reason: string) {
  s.quest.stage = "failed";
  s.quest.failure = reason;
  s.combat = null;
  s.identity.losses++;
  s.flags.case_failed = true;
  s.quest.controls = [];
  remember(s, "lu", "记得你曾缉捕失利，仍愿给你机会");
  note(
    s,
    reason + " 这次失利已记入案卷。休整后可到官府领取新线索，世界仍在继续。",
  );
}
function advance(s: GameState, n = 1) {
  s.time += n;
  const expired = expireCourt(s);
  if (expired) note(s, expired);
  const stage = s.quest.stage;
  if (
    ["prepare", "investigate", "trail", "dock"].includes(stage) &&
    s.time - s.quest.acceptedAt >= 48
  )
    fail(s, "超过八日追缉时限，顾红绫暂时逃离了视线。");
}
export const relationLabel = (r: GameState["relationships"][string]) =>
  !r.met
    ? "未相识"
    : r.memories.some((m) => m.includes("欺骗")) && r.trust < 15
      ? "警惕"
      : r.trust >= 75
        ? "知己"
        : r.trust >= 55
          ? "亲近"
          : r.trust >= 35
            ? "信任"
            : r.favor >= 25
              ? "友善"
              : r.favor >= 12
                ? "结识"
                : "相识";
export function createCharacter(
  name: string,
  originId: string,
  talents: string[],
  weapon: string,
  gender: "male" | "female" = "male",
): GameState {
  const s = freshState(),
    o = origins.find((x) => x.id === originId) || origins[0];
  s.started = true;
  s.player.gender = gender;
  s.flags.appearance_chosen = true;
  s.player.name = name.trim().slice(0, 12) || "沈辞";
  s.player.origin = o.id;
  s.player.talents = [...new Set(talents)].slice(0, 2);
  s.player.weapon = weapon;
  s.player.silver = o.silver;
  for (const key of Object.keys(o.stats) as (keyof Stats)[])
    s.player.stats[key] += o.stats[key] || 0;
  const w =
    weapon === "刀"
      ? "saber"
      : weapon === "拳掌"
        ? "glove"
        : weapon === "奇门"
          ? "fan"
          : "oldSword";
  s.inventory = { [w]: 1, robe: 1, medicine: 2, herb: 2, iron: 2 };
  s.equipped = { weapon: w, armor: "robe" };
  s.activeArt =
    weapon === "刀"
      ? "saberArt"
      : weapon === "拳掌"
        ? "fistArt"
        : weapon === "奇门"
          ? "fanArt"
          : "swordArt";
  s.arts = { [s.activeArt]: 10, innerArt: 5 };
  s.flags["origin_" + o.id] = true;
  if (o.id === "escort") relation(s, "shao", 10, 8);
  if (o.id === "mystery") relation(s, "swordsman", 8, 5);
  if (o.id === "monk") relation(s, "baizhi", 5, 5);
  s.player.hp = derived(s).maxHp;
  s.player.qi = derived(s).maxQi;
  note(s, "大胤十二年，九月。你携一身风尘来到杭州，自己的江湖，从此落笔。");
  return s;
}
export type Action =
  | CourtAction
  | SectAction
  | { type: "autoRound" }
  | {
      type: "battlePlan";
      strategy?: GameState["battle"]["strategy"];
      medicine?: boolean;
      speed?: 1 | 2 | 4;
    }
  | { type: "seclusion"; days: number }
  | { type: "gather" | "craft" | "order" | "sell"; id: string }
  | { type: "attribute"; id: keyof Stats }
  | { type: "trialEnter"; floor: number }
  | { type: "trialExchange"; id: string }
  | { type: "guideCheck" }
  | { type: "meditate" | "ascend" | "skipGuide" }
  | { type: "appearance"; gender: "male" | "female" }
  | { type: "prologue"; id: "help" | "seek" | "skip" }
  | { type: "commission"; id: string; choice?: "honest" | "reward" }
  | { type: "move"; id: string }
  | { type: "explore" }
  | { type: "choice"; id: string }
  | { type: "talk"; id: string }
  | { type: "gift"; id: string }
  | { type: "buy"; id: string }
  | { type: "use"; id: string }
  | { type: "equip"; id: string }
  | { type: "upgrade"; id: string }
  | { type: "learn"; id: string }
  | { type: "practice"; id: string }
  | { type: "breakthrough"; id: string }
  | { type: "art"; id: string }
  | { type: "join" }
  | { type: "promote" }
  | { type: "accept" }
  | { type: "prepare" }
  | { type: "investigate" }
  | { type: "track"; id: string }
  | { type: "confront" }
  | { type: "fight"; id: string }
  | { type: "control"; id: string }
  | { type: "dispose"; id: string }
  | { type: "turnin" }
  | { type: "rest" }
  | { type: "heal" }
  | { type: "wait" }
  | { type: "retry" }
  | { type: "spar" };
function applyAction(current: GameState, action: Action): GameState {
  const s = structuredClone(current);
  if (!s.started) return s;
  const stage = s.quest.stage;
  if (action.type === "battlePlan") {
    if (
      action.strategy &&
      ["balanced", "offense", "guarded"].includes(action.strategy)
    )
      s.battle.strategy = action.strategy;
    if (typeof action.medicine === "boolean")
      s.battle.medicine = action.medicine;
    if (action.speed && [1, 2, 4].includes(action.speed))
      s.battle.speed = action.speed;
    return s;
  }
  if (action.type === "autoRound") {
    if (!s.combat) return s;
    if (s.combat.round > 300) {
      const result = applyAction(s, { type: "fight", id: "escape" });
      note(
        result,
        "交锋超过300回合仍未分胜负，自动撤离。请调整配装与修为后再战。",
      );
      return result;
    }
    return applyAction(s, {
      type: "fight",
      id: autoDecision(s, derived(s).maxHp).id,
    });
  }
  if (s.combat && action.type !== "fight") {
    note(s, "交锋尚未结束，请先完成当前回合。");
    return s;
  }
  if (stage === "defeated" && !["control", "dispose"].includes(action.type)) {
    note(s, "请先决定如何处置失去战力的目标。");
    return s;
  }
  if (stage === "captured" && !["turnin", "move"].includes(action.type)) {
    note(s, "目标已被安全控制，请先押送至官府归案。");
    return s;
  }
  if (s.activeEvent && action.type !== "choice") {
    note(s, "请先回应眼前这段际遇。");
    return s;
  }
  if (action.type.startsWith("sect")) {
    const result = sectAction(s, action as SectAction);
    note(s, result.text);
    if (result.ticks) advance(s, result.ticks);
    return s;
  }
  if (action.type.startsWith("court")) {
    const result = courtAction(s, action as CourtAction, derived(s).maxHp);
    note(s, result.text);
    if (result.ticks) advance(s, result.ticks);
    return s;
  }
  switch (action.type) {
    case "gather":
    case "craft":
    case "order":
    case "sell": {
      const result = livingAction(s, action.type, action.id);
      note(s, result.text);
      if (result.ticks) advance(s, result.ticks);
      break;
    }
    case "seclusion": {
      if (![1, 7, 30, 360].includes(action.days)) break;
      if (timedCase(s)) {
        note(s, "请先完成正在推进的案件，再安排长期闭关。");
        break;
      }
      const days = action.days;
      const gained = earnCultivation(
        s,
        Math.floor((days * 20) / (1 + Math.floor(s.cultivation.realm / 3))),
      );
      advance(s, days * 6);
      s.player.qi = derived(s).maxQi;
      note(
        s,
        `闭关${days}日，修为 +${gained}，内力恢复。岁月同步流逝，境界仍需手动突破。`,
      );
      break;
    }
    case "attribute":
      if (
        !["root", "insight", "agility", "spirit"].includes(action.id) ||
        s.trial.potential < 1 ||
        s.player.stats[action.id] >= 100
      )
        break;
      s.trial.potential--;
      s.player.stats[action.id]++;
      note(
        s,
        "已消耗 1 点潜能，基础属性 +1。潜能分配不可撤回；提升上限不会自动恢复气血与内力。",
      );
      break;
    case "guideCheck":
      s.flags.guide_equip = true;
      note(
        s,
        "行装已检查。初始兵器与布衣已装备；下一步到武学录修习，再挑战试炼塔第一层。",
      );
      break;
    case "trialEnter": {
      const f = trialFloors.find((f) => f.floor === action.floor);
      if (!f || f.floor > s.trial.highest + 1) {
        note(s, "需先通关前一层。已通关楼层可随时复战。");
        break;
      }
      if (s.location !== "lake") {
        note(s, "试炼塔在西湖畔，请先前往西湖。");
        break;
      }
      if (timedCase(s)) {
        note(s, "缉捕正在计时，请先处理当前案件，再来试炼。");
        break;
      }
      if (s.player.hp < Math.ceil(derived(s).maxHp * 0.3)) {
        note(s, "气血低于三成，请先去青山药庐疗伤。试炼不消耗门票。");
        break;
      }
      advance(s);
      s.trial.result = null;
      s.combat = {
        kind: "trial",
        floor: f.floor,
        advantage: false,
        hp: f.hp,
        maxHp: f.hp,
        round: 1,
        guarded: false,
        logs: [
          `第 ${f.floor} 层 · ${f.name}。自动交锋已就绪，可调整战术或暂停。`,
        ],
      };
      note(
        s,
        `登上试炼塔第 ${f.floor} 层，消耗两时辰。可随时撤离，保留已通关进度。`,
      );
      break;
    }
    case "trialExchange": {
      const e = trialExchanges.find((e) => e.id === action.id);
      if (!e || s.location !== "lake") {
        note(s, "请到西湖试炼塔兑换奖励。");
        break;
      }
      if (
        (e.id === "lightArt" && s.arts.lightArt) ||
        (["sword", "boots"].includes(e.id) && s.inventory[e.id])
      ) {
        note(s, "已经拥有，无需重复兑换。");
        break;
      }
      if (s.trial.marks < e.cost) {
        note(
          s,
          `需要试炼印 ${e.cost}，当前 ${s.trial.marks}。首通楼层可获得。`,
        );
        break;
      }
      s.trial.marks -= e.cost;
      if (e.id === "lightArt") s.arts.lightArt = 10;
      else add(s, e.id, e.count);
      note(
        s,
        `已兑换${e.name}。${e.id === "lightArt" ? "战斗中可施展轻功。" : "可在行囊查看；新装备需要手动装备。"}`,
      );
      break;
    }
    case "appearance":
      s.player.gender = action.gender;
      s.flags.appearance_chosen = true;
      note(s, "人物画像已更新，你的江湖经历悉数保留。");
      break;
    case "skipGuide":
      s.flags.guide_dismissed = true;
      break;
    case "prologue": {
      if (s.flags.prologue_done) break;
      s.flags.prologue_done = true;
      if (action.id !== "skip") {
        s.flags.prologue_choice = action.id;
        earnCultivation(s, 10);
        if (action.id === "help") {
          s.player.morality++;
          relation(s, "baizhi", 2, 2);
        } else {
          relation(
            s,
            s.player.origin === "escort" ? "shao" : "swordsman",
            2,
            2,
          );
        }
      }
      note(
        s,
        action.id === "skip"
          ? "你收起来时旧事，独自行入杭州。"
          : introText(s.player.origin) + " 初心已记，修为 +10。",
      );
      break;
    }
    case "meditate": {
      const amount = earnCultivation(s, 12, true);
      s.player.qi = Math.min(derived(s).maxQi, s.player.qi + 15);
      note(
        s,
        `凝神吐纳，修为 +${amount}，内力恢复 15。同日反复基础修行收益递减。`,
      );
      advance(s);
      break;
    }
    case "ascend": {
      const b = breakthroughNeeds(s);
      if (!b.ready) {
        note(
          s,
          b.next
            ? "破境尚欠：" +
                b.needs
                  .filter((x) => !x.met)
                  .map((x) => x.label)
                  .join("、")
            : "太朴归真，境界已臻圆满。",
        );
        break;
      }
      s.cultivation.xp -= b.cost;
      s.cultivation.realm++;
      s.player.hp = Math.min(derived(s).maxHp, s.player.hp + 18);
      s.player.qi = Math.min(derived(s).maxQi, s.player.qi + 8);
      note(
        s,
        `气息贯通，晋入${realms[s.cultivation.realm]}。气血上限 +18，内力上限 +8，外功 +3，防御 +2。`,
      );
      advance(s);
      break;
    }
    case "commission": {
      const q = commissions.find((x) => x.id === action.id);
      if (!q) break;
      const step = commissionStage(s, q.id);
      if (step >= 3 || s.location !== q.locations[step]) break;
      if (step === 0) {
        s.flags[`side_${q.id}`] = 1;
        relation(s, q.npc, 1, 1);
        note(s, q.story);
      } else if (step === 1) {
        s.flags[`side_${q.id}`] = 2;
        if (q.id === "herb") add(s, "herb", 3);
        note(
          s,
          q.id === "herb"
            ? "循药谱辨认叶脉，采得药草 ×3。留下根茎，来年仍可生长。"
            : q.id === "inn"
              ? "船工躲在码头避雨，托你带回平安话。他还提起一道绯影曾向东而去。"
              : "镖记藏在砖缝。划痕是旧镖局的暗号，旁边还有通向码头的足印。",
        );
      } else {
        if (q.id === "herb" && (s.inventory.herb || 0) < 3) {
          note(s, "交付需要药草 ×3，可在药庐购回短缺药材。");
          break;
        }
        if (action.choice !== "honest" && action.choice !== "reward") break;
        const honest = action.choice === "honest";
        s.flags[`side_${q.id}`] = 3;
        s.flags[`side_${q.id}_choice`] = action.choice;
        relation(s, q.npc, honest ? 10 : 4, honest ? 12 : 4);
        s.cultivation.insights++;
        const amount = earnCultivation(
          s,
          q.id === "inn" ? 45 : q.id === "herb" ? 50 : 60,
        );
        if (q.id === "inn") {
          s.player.silver += 40;
          s.flags.trusted_clue = true;
        }
        if (q.id === "herb") {
          add(s, "herb", -3);
          add(s, "medicine", 2);
          s.flags.helped_baizhi = true;
        }
        if (q.id === "escort") {
          add(s, "iron", 3);
          s.flags.trusted_clue = true;
        }
        if (!honest) s.player.silver += 20;
        else s.player.morality += 2;
        remember(
          s,
          q.npc,
          honest
            ? `你在「${q.title}」中看重情义，未取额外酬银`
            : `你办妥「${q.title}」，按约收下额外酬银`,
        );
        note(
          s,
          `「${q.title}」已了结。${q.reward}。${honest ? "你珍重这份相逢，善恶 +2，信任 +12。" : "额外酬银 +20，信任 +4。"}修为实得 ${amount}，江湖感悟 +1。`,
        );
      }
      advance(s);
      break;
    }
    case "move": {
      const l = locations.find((x) => x.id === action.id);
      if (!l || l.id === s.location) break;
      s.location = l.id;
      advance(s);
      if (s.quest.stage === "failed" && stage !== "failed") break;
      note(s, `你来到${l.name}。${l.subtitle}。`);
      break;
    }
    case "explore": {
      const event = events.find(
        (e) => e.location === s.location && meets(s, e.conditions),
      );
      if (event) {
        s.activeEvent = event.id;
      } else {
        advance(s);
        if (s.quest.stage === "failed" && stage !== "failed") break;
        const lucky =
          s.player.talents.includes("lucky") &&
          !s.flags["lucky_" + Math.floor(s.time / 6)];
        if (lucky) {
          s.player.silver += 8;
          s.flags["lucky_" + Math.floor(s.time / 6)] = true;
        }
        note(
          s,
          lucky
            ? "路边拾得一只无人认领的钱袋，获得 8 两银子。"
            : "你在附近走了走，看过市井烟火。暂时没有新的际遇，时辰悄然向前。",
        );
      }
      break;
    }
    case "choice": {
      const event = events.find((e) => e.id === s.activeEvent);
      const c = event?.choices.find((c) => c.id === action.id);
      if (!event || !c || !meets(s, c.requirements)) break;
      const firstEncounter = !s.flags[event.id];
      if (firstEncounter) {
        earnCultivation(s, 18);
        s.cultivation.insights++;
      }
      s.flags.guide_explore = true;
      c.effects.forEach((e) => applyEffect(s, e));
      s.flags[event.id] = true;
      s.activeEvent = c.nextEvent || null;
      for (const e of c.effects)
        if (e.relation)
          remember(
            s,
            e.relation[0],
            event.id === "inn_guest" && c.id === "lie"
              ? "记得你曾以虚言欺骗醉客"
              : c.result,
          );
      note(s, c.result + (firstEncounter ? " 修为 +18，江湖感悟 +1。" : ""));
      advance(s);
      break;
    }
    case "talk": {
      const n = npcs.find((n) => n.id === action.id);
      if (!n) break;
      if (npcLocation(n, s.time) !== s.location) {
        note(s, `${n.name}此刻不在这里，可在人物谱查看所在。`);
        break;
      }
      if (n.id === "gu" && !["dock", "completed"].includes(stage)) {
        note(s, "这里只剩旧日的足迹。先循案卷中的线索找到她。");
        break;
      }
      s.flags.guide_talk = true;
      relation(s, n.id, 0, 0);
      const key = `talk_${n.id}_${Math.floor(s.time / 6)}`;
      if (!s.flags[key]) {
        relation(s, n.id, 3, 2);
        s.flags[key] = true;
      }
      if (n.id === "suwan" && s.flags.helped_suwan) {
        s.flags.trusted_clue = true;
        note(
          s,
          "苏婉娘记得你替她解围，低声告诉你：“绯衣姑娘走的是东边水路。西巷的脚印是假的。” 获得可信线索。",
        );
        remember(s, n.id, "曾在你调查时提供关键线索");
      } else if (n.id === "baizhi" && s.flags.helped_child)
        note(
          s,
          "白芷认出了你：“那孩子提起过你。多谢你帮他找回药钱。” 她的语气亲近了许多。",
        );
      else note(s, n.name + "：“" + n.greeting + "”");
      advance(s);
      break;
    }
    case "gift": {
      const n = npcs.find((n) => n.id === action.id);
      if (!n || npcLocation(n, s.time) !== s.location || n.id === "gu") break;
      if (!(s.inventory[n.gift] > 0)) {
        note(s, `行囊里没有${items.find((i) => i.id === n.gift)?.name}。`);
        break;
      }
      const key = `gift_${n.id}_${Math.floor(s.time / 6)}`;
      if (s.flags[key]) {
        note(s, "今日已赠过礼，情谊还需慢慢相处。");
        break;
      }
      add(s, n.gift, -1);
      relation(s, n.id, 8, 4);
      s.flags[key] = true;
      remember(
        s,
        n.id,
        `记得你赠过${items.find((i) => i.id === n.gift)?.name}`,
      );
      note(s, `${n.name}收下礼物，与你又亲近了些。好感 +8，信任 +4。`);
      advance(s);
      break;
    }
    case "buy": {
      const item = items.find((i) => i.id === action.id);
      const shop = shopStock(s.location);
      if (!item || !shop.includes(item.id)) break;
      if (s.time % 6 === 5 && !["office", "herb"].includes(s.location)) {
        note(s, "此刻已是深夜，店家已经打烊。");
        break;
      }
      const merchant =
        s.location === "smith"
          ? "shao"
          : s.location === "herb"
            ? "baizhi"
            : s.location === "inn"
              ? "suwan"
              : "lu";
      const price = Math.ceil(
        item.price * (s.relationships[merchant].trust >= 35 ? 0.85 : 1),
      );
      if (s.player.silver < price) {
        note(s, "银两不足，改日再来。");
        break;
      }
      s.player.silver -= price;
      add(s, item.id, 1);
      note(s, `购得${item.name}，花费 ${price} 两。`);
      break;
    }
    case "equip": {
      const item = items.find((i) => i.id === action.id);
      if (!item?.slot || !(s.inventory[item.id] > 0)) break;
      s.equipped[item.slot] = item.id;
      s.flags.guide_equip = true;
      s.player.hp = Math.min(s.player.hp, derived(s).maxHp);
      note(s, `已装备${item.name}，人物属性随之变化。`);
      break;
    }
    case "use": {
      if (["soup", "tonic"].includes(action.id) && s.inventory[action.id] > 0) {
        const d = derived(s),
          hp = action.id === "soup" ? 45 : 0,
          qi = action.id === "soup" ? 30 : 60;
        if ((hp === 0 || s.player.hp >= d.maxHp) && s.player.qi >= d.maxQi) {
          note(s, "当前状态无需使用这份补给。");
          break;
        }
        s.inventory[action.id]--;
        s.player.hp = Math.min(d.maxHp, s.player.hp + hp);
        s.player.qi = Math.min(d.maxQi, s.player.qi + qi);
        note(
          s,
          `使用${action.id === "soup" ? "鲜鱼汤" : "凝神散"}，恢复至多${hp}气血、${qi}内力。`,
        );
        break;
      }
      if (action.id === "medicine" && s.inventory.medicine > 0) {
        if (s.player.hp >= derived(s).maxHp) {
          note(s, "当前气血充盈，无需用药。");
          break;
        }
        add(s, "medicine", -1);
        s.player.hp = Math.min(derived(s).maxHp, s.player.hp + 65);
        note(s, "服下金疮药，气血恢复 65 点。");
      }
      break;
    }
    case "upgrade": {
      const id = action.id;
      const item = items.find((i) => i.id === id);
      const level = s.upgrades[id] || 0;
      if (s.location !== "smith" || !item?.slot || !(s.inventory[id] > 0))
        break;
      if (level >= 5) {
        note(s, "这件装备已强化至本篇上限 +5。");
        break;
      }
      const cost = 20 + level * 15;
      if ((s.inventory.iron || 0) < 2 || s.player.silver < cost) {
        note(s, `材料不足：需要精铁 2 块、银两 ${cost} 两。`);
        break;
      }
      s.player.silver -= cost;
      add(s, "iron", -2);
      s.upgrades[id] = level + 1;
      note(
        s,
        `${item.name}强化至 +${level + 1}，${item.slot === "weapon" ? "外功增加 3 点" : "防御增加 2 点，气血上限增加 5 点"}。邵远山为你稳妥重铸。`,
      );
      advance(s);
      break;
    }
    case "art": {
      if (
        s.arts[action.id] > 0 &&
        ["swordArt", "saberArt", "fistArt", "fanArt"].includes(action.id)
      ) {
        s.activeArt = action.id;
        note(s, "已调整出战武学。");
      }
      break;
    }
    case "learn": {
      const art = arts.find((a) => a.id === action.id);
      if (!art || s.arts[art.id]) break;
      const teacher = npcs.find((n) => n.id === art.teacher)!;
      if (npcLocation(teacher, s.time) !== s.location) {
        note(s, `需当面向${teacher.name}请教。`);
        break;
      }
      const requirement =
        art.type === "剑法" && s.player.talents.includes("sword")
          ? 50
          : s.player.origin === "scholar"
            ? 52
            : 60;
      if (s.player.stats.insight < requirement) {
        note(s, `悟性需达到 ${requirement}。`);
        break;
      }
      s.arts[art.id] = 5;
      relation(s, teacher.id, 3, 3);
      remember(s, teacher.id, "曾传授你" + art.name);
      note(
        s,
        `${teacher.name}传授你《${art.name}》。江湖路上，又多了一分底气。`,
      );
      advance(s);
      break;
    }
    case "practice": {
      if (!s.arts[action.id]) break;
      const amount = s.player.talents.includes("bright") ? 12 : 10;
      s.flags.guide_practice = true;
      const gained = earnCultivation(
        s,
        action.id === "innerArt" ? 16 : 8,
        true,
      );
      s.arts[action.id] = Math.min(100, s.arts[action.id] + amount);
      if (action.id === "innerArt")
        s.player.qi = Math.min(derived(s).maxQi, s.player.qi + 20);
      note(
        s,
        `静心修习《${arts.find((a) => a.id === action.id)?.name}》，熟练度 +${amount}，修为 +${gained}。`,
      );
      advance(s);
      break;
    }
    case "breakthrough": {
      const experience =
        Number(s.flags.spars || 0) + (s.flags.sparred_lake ? 1 : 0);
      if (
        (s.arts[action.id] || 0) < 80 ||
        s.player.stats.insight < 70 ||
        experience < 3 ||
        s.flags["break_" + action.id]
      ) {
        note(s, "突破需要悟性 70、熟练度 80，以及三次交手经历。");
        break;
      }
      s.flags["break_" + action.id] = true;
      s.player.stats.spirit += 3;
      note(s, "一念通达，旧招新生。武学突破，心性 +3，出战伤害 +10。");
      advance(s);
      break;
    }
    case "join": {
      if (s.location !== "office" || s.identity.rank) break;
      s.identity.rank = 1;
      s.quest.stage = "available";
      relation(s, "lu", 5, 5);
      note(s, "你接过捕快腰牌。从今日起，这座城的安宁，也与你有关。");
      break;
    }
    case "promote": {
      if (
        s.location !== "office" ||
        s.identity.rank < 1 ||
        s.identity.rank >= 4 ||
        timedCase(s) ||
        !officialNeeds(s).every((n) => n.met)
      ) {
        note(
          s,
          "请先处理当前案件，再在官府交验晋升条件；身份司簿列出了全部缺口。",
        );
        break;
      }
      s.identity.rank++;
      s.player.fame += 10;
      note(
        s,
        `身份晋升 · ${officialRanks[s.identity.rank]}。新腰牌已交付，可在朝廷案牍查看新案与俸银。`,
      );
      s.flags.promoted = true;
      break;
    }
    case "accept": {
      if (s.location !== "office" || stage !== "available" || !s.identity.rank)
        break;
      s.quest = {
        stage: "prepare",
        acceptedAt: s.time,
        clues: [],
        controls: [],
        failure: "",
      };
      note(
        s,
        "已接取《烟雨楼盗案》。八日内追缉顾红绫，务必活捉。先准备绳索两条、布条一条。",
      );
      break;
    }
    case "prepare": {
      if (stage !== "prepare") break;
      if ((s.inventory.rope || 0) < 2 || (s.inventory.cloth || 0) < 1) {
        note(s, "尚缺拘捕工具：绳索 2 条、布条 1 条。可在官府军需处购置。");
        break;
      }
      s.quest.stage = "investigate";
      note(s, "行前准备妥当。先到烟雨楼调查，留意证词与遗留物。");
      break;
    }
    case "investigate": {
      if (stage !== "investigate" || s.location !== "tower") break;
      s.quest.clues = ["窗棂上的绯红丝线", "后门向东的足迹"];
      s.quest.stage = "trail";
      note(s, "你在窗棂找到绯红丝线，又在后门发现足迹。线索指向后巷。");
      advance(s);
      break;
    }
    case "track": {
      if (stage !== "trail" || s.location !== "alley") break;
      const reliable =
        s.cultivation.realm >= 2 ||
        s.player.origin === "hunter" ||
        s.player.talents.includes("careful") ||
        s.flags.trusted_clue ||
        s.flags.helped_boatman;
      if (action.id === "charm") {
        if (!(s.inventory.charm > 0)) {
          note(s, "需要一枚追踪符。");
          break;
        }
        add(s, "charm", -1);
      }
      if (action.id === "west") {
        s.player.hp = Math.max(1, s.player.hp - 12);
        s.flags.false_trail = true;
        note(
          s,
          "西巷足迹过于整齐，是故布疑阵。你绕路耗去四个时辰，气血 −12。仍可返回追踪。",
        );
        advance(s, 2);
        break;
      }
      if (action.id === "observe" && !reliable) {
        s.quest.clues.push("水边的湿绳与新鲜船痕");
        s.flags.trusted_clue = true;
        note(
          s,
          "你耐心对照足迹，在东侧发现湿绳与船痕。已辨明水路，再次选择追踪即可。",
        );
        advance(s);
        break;
      }
      s.quest.stage = "dock";
      s.quest.clues.push("东侧水路通往旧码头");
      note(s, "线索终于连在一起。顾红绫去了旧码头，沿水路追上她。");
      advance(s);
      break;
    }
    case "confront": {
      if (stage !== "dock" || s.location !== "dock") break;
      relation(s, "gu", 0, 0);
      s.quest.stage = "combat";
      s.combat = {
        hp: 180,
        maxHp: 180,
        round: 1,
        guarded: false,
        logs: [
          "顾红绫按住刀柄，身形如燕。你拦住去路：“随我回官府，把事情说清楚。”",
        ],
      };
      note(s, "交锋开始。活捉任务需要先使目标失去战力，再进行拘捕。");
      break;
    }
    case "fight": {
      const c = s.combat;
      if (!c) break;
      if (c.kind === "trial") {
        note(s, resolveTrialRound(s, action.id, derived(s)));
        break;
      }
      if (c.kind === "court") {
        note(s, resolveCourtRound(s, action.id, derived(s)));
        break;
      }
      const d = derived(s);
      let damage = 0,
        defend = false,
        evade = false;
      const art = arts.find((a) => a.id === s.activeArt)!;
      if (action.id === "escape") {
        s.player.hp = Math.max(1, s.player.hp);
        fail(s, "你退出交锋，顾红绫趁机离开旧码头。");
        break;
      }
      if (action.id === "medicine") {
        if (!(s.inventory.medicine > 0)) {
          note(s, "金疮药已经用完。");
          break;
        }
        if (s.player.hp >= d.maxHp) {
          note(s, "气血充盈，不必浪费药物。");
          break;
        }
        add(s, "medicine", -1);
        s.player.hp = Math.min(d.maxHp, s.player.hp + 65);
        c.logs.unshift("你服下金疮药，恢复 65 点气血。");
      } else if (action.id === "defend") {
        defend = true;
        s.player.qi = Math.min(d.maxQi, s.player.qi + 14);
        c.logs.unshift("你收势招架，调匀呼吸。内力 +14。");
      } else if (action.id === "light") {
        if (!s.arts.lightArt || s.player.qi < 8) {
          note(s, "需学会《追云步》，并留有 8 点内力。");
          break;
        }
        s.player.qi -= 8;
        evade = true;
        damage = Math.floor(d.attack * 0.55);
        c.logs.unshift(`你踏出追云步，避实击虚，造成 ${damage} 点伤害。`);
      } else if (action.id === "art") {
        if (s.player.qi < art.cost) {
          note(s, "内力不足，可防御调息。");
          break;
        }
        s.player.qi -= art.cost;
        const synergy =
          s.activeArt === "swordArt" && s.equipped.weapon === "sword"
            ? 8
            : s.activeArt === "saberArt" && s.equipped.weapon === "saber"
              ? 6
              : (s.activeArt === "fistArt" && s.equipped.weapon === "glove") ||
                  (s.activeArt === "fanArt" && s.equipped.weapon === "fan")
                ? 5
                : 0;
        damage =
          d.attack +
          art.power +
          Math.floor(s.arts[art.id] / 10) +
          synergy +
          (s.player.talents.includes("sword") && art.type === "剑法" ? 6 : 0) +
          (s.flags["break_" + art.id] ? 10 : 0);
        s.arts[art.id] = Math.min(100, s.arts[art.id] + 3);
        c.logs.unshift(
          `你使出「${art.name}」，造成 ${damage} 点伤害${synergy ? "，兵器与武学相得益彰" : ""}。`,
        );
      } else {
        damage = d.attack;
        c.logs.unshift(`你稳住身形，普通攻击造成 ${damage} 点伤害。`);
      }
      c.hp = Math.max(0, c.hp - damage);
      if (c.hp === 0) {
        const firstWin = !s.flags.gu_defeated;
        if (firstWin) earnCultivation(s, 40);
        s.flags.gu_defeated = true;
        s.flags.guide_spar = true;
        s.flags.spars = Number(s.flags.spars || 0) + 1;
        s.quest.stage = "defeated";
        s.combat = null;
        note(
          s,
          `顾红绫的兵刃落地，已完全失去战力。${firstWin ? "初次实战获胜，修为 +40。" : ""}你收住攻势，接下来由你决定如何处置。`,
        );
        break;
      }
      const incoming = evade
        ? 0
        : Math.max(
            3,
            32 + (c.round % 3 === 0 ? 12 : 0) - d.defense - (defend ? 19 : 0),
          );
      s.player.hp = Math.max(0, s.player.hp - incoming);
      c.logs.unshift(
        evade
          ? "顾红绫的刀锋擦过衣角，被你避开。"
          : `顾红绫${c.round % 3 === 0 ? "使出燕返" : "回身出招"}，你受到 ${incoming} 点伤害。`,
      );
      c.round++;
      c.logs = c.logs.slice(0, 25);
      if (s.player.hp === 0) {
        s.player.hp = 1;
        s.location = "herb";
        fail(s, "你在交锋中负伤倒下，被路人送到药庐。");
      }
      break;
    }
    case "control": {
      if (
        stage !== "defeated" ||
        !["hands", "legs", "alert"].includes(action.id) ||
        s.quest.controls.includes(action.id)
      )
        break;
      const item = action.id === "alert" ? "cloth" : "rope";
      if (!(s.inventory[item] > 0)) {
        note(
          s,
          `缺少${item === "rope" ? "绳索" : "布条"}。无法完成这一项控制，可放走目标后重整。`,
        );
        break;
      }
      add(s, item, -1);
      s.quest.controls.push(action.id);
      note(
        s,
        `${action.id === "hands" ? "手部" : action.id === "legs" ? "腿部" : "示警"}控制完成。`,
      );
      if (s.quest.controls.length === 3) {
        s.quest.stage = "captured";
        note(s, "三项控制完成，已安全拘捕。可以押送至官府归案。");
      }
      break;
    }
    case "dispose": {
      if (stage !== "defeated") break;
      if (action.id === "heal") {
        if (!(s.inventory.medicine > 0) || s.flags.healed_gu) {
          note(s, "需要金疮药，且每次缉捕只能救治一次。");
          break;
        }
        add(s, "medicine", -1);
        relation(s, "gu", 8, 10);
        remember(s, "gu", "记得你在交锋后为她疗伤");
        s.flags.healed_gu = true;
        s.player.morality += 3;
        note(s, "你先为顾红绫包扎伤处。她低声道谢，仍可继续拘捕。");
      } else if (action.id === "search") {
        if (s.flags.searched_gu) break;
        s.flags.searched_gu = true;
        s.quest.clues.push("追回失窃的玉佩");
        note(s, "你找到烟雨楼失窃的玉佩，将其收作物证。");
      } else if (action.id === "escortPartial") {
        if (s.quest.controls.length < 3)
          fail(s, "拘捕控制未完成，顾红绫在押送途中挣脱逃离。");
      } else if (action.id === "release") {
        s.flags.released_gu = true;
        relation(s, "gu", 10, 10);
        remember(s, "gu", "记得你曾放她一条生路");
        fail(s, "你放走了顾红绫，活捉任务未能完成。");
      }
      break;
    }
    case "turnin": {
      if (stage !== "captured" || s.quest.controls.length !== 3) break;
      s.location = "office";
      advance(s, 2);
      s.quest.stage = "completed";
      s.player.silver += 300;
      s.player.fame += 5;
      s.identity.reputation += 25;
      s.identity.contribution += 40;
      s.identity.wins++;
      if (!s.flags.case_completed) {
        earnCultivation(s, 150);
        s.cultivation.insights += 2;
      }
      s.flags.case_completed = true;
      relation(s, "lu", 12, 15);
      relation(s, "suwan", 5, 5);
      remember(s, "lu", "记得你破获烟雨楼盗案，活捉顾红绫");
      remember(s, "suwan", "你让烟雨楼失窃案有了交代");
      note(
        s,
        "烟雨楼盗案 · 结案。赏银 +300 两，捕快声望 +25，官府贡献 +40；初次结案另获修为 150、感悟 2。街巷重新安宁，你可以向陆捕头申请晋升。",
      );
      break;
    }
    case "retry": {
      if (stage !== "failed" || s.location !== "office") break;
      if (s.player.silver < 5) {
        note(s, "重新追缉需要 5 两文书费，可先巡街赚取盘缠。");
        break;
      }
      s.player.silver -= 5;
      s.quest = {
        stage: "prepare",
        acceptedAt: s.time,
        clues: [],
        controls: [],
        failure: "",
      };
      delete s.flags.healed_gu;
      delete s.flags.searched_gu;
      note(
        s,
        "陆捕头递来新的行踪消息。曾经的失利留在案卷里，而你又有了一次机会。",
      );
      break;
    }
    case "rest": {
      if (s.location !== "inn") break;
      const cost = s.flags.helped_suwan ? 4 : 8;
      if (s.player.silver < cost) {
        note(s, `住店需要 ${cost} 两银子。也可到药庐免费静养。`);
        break;
      }
      s.player.silver -= cost;
      s.player.hp = derived(s).maxHp;
      s.player.qi = derived(s).maxQi;
      note(s, `客栈歇息，气血与内力恢复。花费 ${cost} 两，六个时辰过去。`);
      advance(s, 3);
      break;
    }
    case "heal": {
      if (s.location !== "herb") break;
      const cost = s.flags.helped_baizhi ? 5 : 10;
      if (s.player.silver >= cost) {
        s.player.silver -= cost;
        s.player.hp = derived(s).maxHp;
        s.player.qi = derived(s).maxQi;
        note(s, `白芷为你疗伤，气血与内力恢复。诊金 ${cost} 两。`);
        advance(s);
      } else {
        s.player.hp = Math.min(derived(s).maxHp, s.player.hp + 80);
        s.player.qi = Math.min(derived(s).maxQi, s.player.qi + 40);
        note(s, "白芷让你留在药庐免费静养。气血 +80，内力 +40，耗时六个时辰。");
        advance(s, 3);
      }
      relation(s, "baizhi", 1, 1);
      break;
    }
    case "wait": {
      const daily = Number(s.flags["patrol_" + Math.floor(s.time / 6)] || 0);
      if (s.location === "office" && s.identity.rank && daily < 2) {
        s.player.silver += 8;
        s.flags["patrol_" + Math.floor(s.time / 6)] = daily + 1;
        note(s, "你巡过两条街巷，领取值勤银 8 两。今日最多两次。");
      } else {
        note(s, "你暂歇片刻，听风过檐。时辰向前，人物也有各自的去处。");
      }
      advance(s);
      break;
    }
    case "spar": {
      if (s.location !== "lake") break;
      if (s.player.hp <= 25) {
        note(s, "伤势未愈，先去疗伤吧。");
        break;
      }
      const gained = earnCultivation(s, 20, true);
      s.flags.guide_spar = true;
      s.player.hp -= 20;
      s.flags.spars = Number(s.flags.spars || 0) + 1;
      s.player.stats.insight = Math.min(90, s.player.stats.insight + 2);
      relation(s, "swordsman", 2, 2);
      note(
        s,
        `与剑客切磋一式，气血 −20，悟性 +2，交手经历 +1，修为 +${gained}。`,
      );
      advance(s);
      break;
    }
  }
  return s;
}

export function transition(current: GameState, action: Action): GameState {
  if (current.life.ended) {
    const stopped = structuredClone(current);
    stopped.lastMessage =
      "此生已结卷。可回看人物与手记、导出存档，或返回主菜单开启新的江湖。";
    return stopped;
  }
  const s = applyAction(current, action);
  if (!s.started) return s;
  const info = lifeInfo(s);
  if (s.time >= info.endAt) {
    // Crossing the lifespan boundary settles before granting the unfinished action's rewards.
    const ended = structuredClone(current);
    ended.time = lifeInfo(current).endAt;
    ended.life.ended = true;
    ended.combat = null;
    ended.activeEvent = null;
    if (ended.court.active) {
      ended.court.result = {
        id: ended.court.active.id,
        outcome: "abandoned",
        text: "人生结卷，未竟案卷留待后来人。",
      };
      ended.court.active = null;
    }
    if (timedCase(ended)) {
      ended.quest.stage = "failed";
      ended.quest.failure = "人生结卷，未竟的案卷留待后来人。";
    }
    note(
      ended,
      `享年${lifeInfo(ended).lifespan}岁，江湖一生于此结卷。存档完整保留，可回看经历或导出留念。`,
    );
    return ended;
  }
  const before = lifeInfo(current);
  if (info.age > before.age)
    note(
      s,
      `${s.lastMessage} 岁序更迭，你已${info.age}岁，寿元上限${info.lifespan}岁。`,
    );
  return s;
}
