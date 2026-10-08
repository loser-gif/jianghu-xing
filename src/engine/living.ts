import type { GameState } from "../types";
import { professions, recipes, orders, professionRank } from "../data/living";
export const initialLiving = (): GameState["living"] => ({
  xp: { herbalism: 0, smithing: 0, fishing: 0 },
  orders: {},
  gathered: 0,
  crafted: 0,
  delivered: 0,
});
export function livingAction(
  s: GameState,
  type: "gather" | "craft" | "order" | "sell",
  id: string,
) {
  const day = Math.floor(s.time / 6);
  if (type === "gather") {
    const p = professions.find((p) => p.id === id);
    if (!p || s.location !== p.location)
      return { text: "请先前往对应地点。", ticks: 0 };
    const count = 2 + professionRank(s.living.xp[p.id]);
    s.inventory[p.material] = (s.inventory[p.material] || 0) + count;
    s.living.xp[p.id] += 3;
    s.living.gathered++;
    return {
      text: `${p.action}获得${p.materialName} ×${count}，${p.name}熟练 +3，耗时两时辰。`,
      ticks: 1,
    };
  }
  if (type === "craft") {
    const r = recipes.find((r) => r.id === id);
    const p = professions.find((p) => p.id === r?.job);
    if (!r || !p || s.location !== p.location)
      return { text: "请先前往对应工坊。", ticks: 0 };
    if (professionRank(s.living.xp[r.job]) < r.rank)
      return { text: "技艺等级不足，先采集或制作基础配方。", ticks: 0 };
    if (
      s.player.silver < r.cost ||
      Object.entries(r.need).some(([k, n]) => (s.inventory[k] || 0) < n)
    )
      return { text: "银两或材料不足，请查看配方缺口。", ticks: 0 };
    for (const [k, n] of Object.entries(r.need)) s.inventory[k] -= n;
    s.player.silver -= r.cost;
    const bonus =
      professionRank(s.living.xp[r.job]) >= 2 && r.id !== "boots" ? 1 : 0;
    s.inventory[r.output] = (s.inventory[r.output] || 0) + r.count + bonus;
    s.living.xp[r.job] += 6;
    s.living.crafted++;
    return {
      text: `制成${r.name} ×${r.count + bonus}${bonus ? "（熟手技艺额外产出）" : ""}，技艺熟练 +6，耗时两时辰。`,
      ticks: 1,
    };
  }
  if (type === "order") {
    const o = orders.find((o) => o.id === id);
    const p = professions.find((p) => p.id === o?.job);
    if (!o || !p || s.location !== p.location)
      return { text: "请在对应地点交付订单。", ticks: 0 };
    if (s.living.orders[id] === day)
      return { text: "本游戏日已交付这笔订单。", ticks: 0 };
    if ((s.inventory[o.item] || 0) < o.count)
      return { text: "订单所需成品不足，先采集并制作。", ticks: 0 };
    s.inventory[o.item] -= o.count;
    s.player.silver += o.silver;
    s.living.xp[o.job] += 8;
    s.living.orders[id] = day;
    s.living.delivered++;
    return {
      text: `「${o.title}」交付完成，银两 +${o.silver}，技艺熟练 +8。每游戏日可交付一次。`,
      ticks: 0,
    };
  }
  const prices: Record<string, number> = {
    herb: 2,
    ore: 2,
    fish: 2,
    medicine: 6,
    iron: 4,
    soup: 6,
    tonic: 8,
  };
  if (s.location !== "inn" || !prices[id] || !(s.inventory[id] > 0))
    return { text: "前往客栈市集，并准备可出售物品。", ticks: 0 };
  s.inventory[id]--;
  s.player.silver += prices[id];
  return { text: `售出一件物品，银两 +${prices[id]}。`, ticks: 0 };
}
