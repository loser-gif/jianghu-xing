import type { GameState } from "../types";
import { forgeRecipes, forgedItems } from "../data/forge";
import { items } from "../data/world";
import { professionRank, rankNames } from "../data/living";
import { realms } from "./cultivation";
import { timedCase } from "./calendar";

export type ForgeAction =
  | { type: "forgeCraft"; id: string }
  | { type: "forgeTransfer"; from: string; to: string };
export function forgeBlocked(s: GameState) {
  return s.life.ended
    ? "此生已结卷，可回看器甲。"
    : s.combat
      ? "请先结束交锋。"
      : s.activeEvent
        ? "请先回应际遇。"
        : timedCase(s)
          ? "请先办结当前案件，再开炉锻造。"
          : s.location !== "smith"
            ? "请先前往铁匠铺。"
            : "";
}
export function forgeNeeds(s: GameState, id: string) {
  const r = forgeRecipes.find((r) => r.id === id);
  if (!r) return [{ text: "未知配方", met: false }];
  return [
    {
      text: `铁匠${rankNames[r.rank]} · 熟练 ${s.living.xp.smithing}/${r.rank === 3 ? 120 : 60}`,
      met: professionRank(s.living.xp.smithing) >= r.rank,
    },
    {
      text: `${realms[r.realm]}境界 · 当前${realms[s.cultivation.realm]}`,
      met: s.cultivation.realm >= r.realm,
    },
    {
      text: `试炼通关 ${s.trial.highest}/${r.floor}层`,
      met: s.trial.highest >= r.floor,
    },
    {
      text: `铁矿石 ${s.inventory.ore || 0}/${r.ore}`,
      met: (s.inventory.ore || 0) >= r.ore,
    },
    {
      text: `精铁 ${s.inventory.iron || 0}/${r.iron}`,
      met: (s.inventory.iron || 0) >= r.iron,
    },
    {
      text: `工本银两 ${s.player.silver}/${r.silver}`,
      met: s.player.silver >= r.silver,
    },
  ];
}
export function transferReason(s: GameState, from: string, to: string) {
  const a = items.find((i) => i.id === from),
    b = items.find((i) => i.id === to);
  if (!a?.slot || !b?.slot || a.slot !== b.slot || from === to)
    return "请选择不同的同部位装备。";
  if (!(s.inventory[from] > 0) || !(s.inventory[to] > 0))
    return "两件装备都需持有。";
  const level = s.upgrades[from] || 0;
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5 ||
    level <= (s.upgrades[to] || 0)
  )
    return "来源强化必须高于目标；等级不叠加。";
  if (s.player.silver < 50 || (s.inventory.iron || 0) < 2)
    return "需要50两和精铁2块。";
  return "";
}
export function forgeAction(s: GameState, a: ForgeAction) {
  const blocked = forgeBlocked(s);
  if (blocked) return { text: blocked, ticks: 0 };
  if (a.type === "forgeCraft") {
    const r = forgeRecipes.find((r) => r.id === a.id),
      item = forgedItems.find((i) => i.id === a.id);
    if (!r || !item) return { text: "没有这份图谱。", ticks: 0 };
    if (s.inventory[a.id] > 0)
      return {
        text: "已持有此器甲，可直接装备或传承强化，无需重复锻造。",
        ticks: 0,
      };
    const missing = forgeNeeds(s, a.id).find((n) => !n.met);
    if (missing) return { text: `尚未满足：${missing.text}`, ticks: 0 };
    s.player.silver -= r.silver;
    s.inventory.ore -= r.ore;
    s.inventory.iron -= r.iron;
    s.inventory[a.id] = 1;
    s.upgrades[a.id] = 0;
    s.living.xp.smithing += 12;
    s.living.crafted++;
    return {
      text: `${item.name}锻成，铁匠熟练+12，耗时四时辰。成品已入行囊，强化为+0，请查看对比后装备。`,
      ticks: 2,
    };
  }
  const reason = transferReason(s, a.from, a.to);
  if (reason) return { text: reason, ticks: 0 };
  const level = s.upgrades[a.from];
  s.player.silver -= 50;
  s.inventory.iron -= 2;
  s.upgrades[a.to] = level;
  s.upgrades[a.from] = 0;
  return {
    text: `强化传承完成：${items.find((i) => i.id === a.from)!.name}回到+0，${items.find((i) => i.id === a.to)!.name}达到+${level}。两件装备均保留，穿戴不变，耗时两时辰。`,
    ticks: 1,
  };
}
