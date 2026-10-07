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

export const freshState = (): GameState => ({
  version: 1,
  started: false,
  player: {
    name: "沈辞",
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
  const gear = Object.values(s.equipped)
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean);
  const set = s.equipped.armor === "robe" && s.equipped.feet === "boots";
  return {
    maxHp:
      150 +
      s.player.stats.root * 2 +
      (s.player.talents.includes("strong") ? 40 : 0) +
      gear.reduce((n, g) => n + (g?.hp || 0), 0) +
      (set ? 30 : 0),
    maxQi: 60 + s.player.stats.spirit,
    attack:
      10 +
      Math.floor(s.player.stats.root / 5) +
      gear.reduce((n, g) => n + (g?.attack || 0), 0) +
      (s.upgrades[s.equipped.weapon] || 0) * 3 +
      (s.player.talents.includes("fierce") ? 4 : 0),
    defense:
      5 +
      Math.floor(s.player.stats.root / 12) +
      gear.reduce((n, g) => n + (g?.defense || 0), 0),
    set,
  };
}
export function meets(s: GameState, c: Condition = {}) {
  return (
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
): GameState {
  const s = freshState(),
    o = origins.find((x) => x.id === originId) || origins[0];
  s.started = true;
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
export function transition(current: GameState, action: Action): GameState {
  const s = structuredClone(current);
  if (!s.started) return s;
  const stage = s.quest.stage;
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
  switch (action.type) {
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
      note(s, c.result);
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
      s.player.hp = Math.min(s.player.hp, derived(s).maxHp);
      note(s, `已装备${item.name}，人物属性随之变化。`);
      break;
    }
    case "use": {
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
      if (s.location !== "smith" || !item?.attack || !(s.inventory[id] > 0))
        break;
      if (level >= 5) {
        note(s, "这柄兵器已强化至本篇上限。");
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
        `${item.name}强化至 +${level + 1}，攻击增加 3 点。邵远山为你稳妥重铸。`,
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
      s.arts[action.id] = Math.min(100, s.arts[action.id] + amount);
      if (action.id === "innerArt")
        s.player.qi = Math.min(derived(s).maxQi, s.player.qi + 20);
      note(
        s,
        `静心修习《${arts.find((a) => a.id === action.id)?.name}》，熟练度 +${amount}。`,
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
        s.identity.rank !== 1 ||
        s.identity.contribution < 40 ||
        s.identity.reputation < 25
      ) {
        note(s, "晋升需在官府交验：官府贡献 40，捕快声望 25。");
        break;
      }
      s.identity.rank = 2;
      s.player.fame += 10;
      note(
        s,
        "身份晋升 · 资深捕快。陆怀安郑重递来新腰牌，今后这座城，会记得你的名字。",
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
          "西巷足迹过于整齐，是故布疑阵。你绕路耗去两个时辰，气血 −12。仍可返回追踪。",
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
        s.flags.spars = Number(s.flags.spars || 0) + 1;
        s.quest.stage = "defeated";
        s.combat = null;
        note(
          s,
          "顾红绫的兵刃落地，已完全失去战力。你收住攻势，接下来由你决定如何处置。",
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
      s.flags.case_completed = true;
      relation(s, "lu", 12, 15);
      relation(s, "suwan", 5, 5);
      remember(s, "lu", "记得你破获烟雨楼盗案，活捉顾红绫");
      remember(s, "suwan", "你让烟雨楼失窃案有了交代");
      note(
        s,
        "烟雨楼盗案 · 结案。赏银 +300 两，捕快声望 +25，官府贡献 +40。街巷重新安宁，你可以向陆捕头申请晋升。",
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
      note(s, `客栈歇息，气血与内力恢复。花费 ${cost} 两，三个时辰过去。`);
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
        note(s, "白芷让你留在药庐免费静养。气血 +80，内力 +40，耗时三个时辰。");
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
      s.player.hp -= 20;
      s.flags.spars = Number(s.flags.spars || 0) + 1;
      s.player.stats.insight = Math.min(90, s.player.stats.insight + 2);
      relation(s, "swordsman", 2, 2);
      note(s, "与剑客切磋一式，气血 −20，悟性 +2，交手经历 +1。");
      advance(s);
      break;
    }
  }
  return s;
}
