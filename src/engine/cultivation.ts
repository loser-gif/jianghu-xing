import type { GameState } from "../types";

export const realms = [
  "入不流",
  "九品",
  "八品",
  "七品",
  "六品",
  "五品",
  "四品",
  "三品",
  "二品",
  "一品",
  "宗师",
  "大宗师",
  "陆地神仙",
  "天人",
  "太朴",
] as const;
// Costs are spent on each breakthrough. Lifetime cultivation remains in total.
const costs = [
  60, 110, 180, 280, 420, 600, 850, 1200, 1700, 2500, 3600, 5200, 7500, 10800,
];
export type Cultivation = {
  realm: number;
  xp: number;
  total: number;
  insights: number;
  day: number;
  sessions: number;
};
export const initialCultivation = (): Cultivation => ({
  realm: 0,
  xp: 0,
  total: 0,
  insights: 0,
  day: -1,
  sessions: 0,
});
export function realmBonus(s: GameState) {
  const n = s.cultivation.realm;
  return { hp: n * 18, qi: n * 8, attack: n * 3, defense: n * 2 };
}
export function breakthroughNeeds(s: GameState) {
  const n = s.cultivation.realm,
    cost = costs[n] || 0;
  const needs = [
    {
      label: `积累修为 ${s.cultivation.xp}/${cost}`,
      met: s.cultivation.xp >= cost,
    },
  ];
  if (n >= 2)
    needs.push({
      label: `归元心法 ${s.arts.innerArt || 0}/${Math.min(100, 20 + n * 5)}`,
      met: (s.arts.innerArt || 0) >= Math.min(100, 20 + n * 5),
    });
  if (n >= 3)
    needs.push({
      label: `江湖感悟 ${s.cultivation.insights}/${n - 1}`,
      met: s.cultivation.insights >= n - 1,
    });
  if (n >= 6)
    needs.push({ label: "完成烟雨楼盗案", met: s.quest.stage === "completed" });
  if (n >= 9)
    needs.push({
      label: "三段江湖委托皆已了结",
      met: ["inn", "herb", "escort"].every((id) => s.flags[`side_${id}`] === 3),
    });
  if (n >= 11)
    needs.push({
      label: `心性 ${s.player.stats.spirit}/75`,
      met: s.player.stats.spirit >= 75,
    });
  return {
    cost,
    next: realms[n + 1],
    needs,
    ready: n < realms.length - 1 && needs.every((x) => x.met),
  };
}
export function earnCultivation(
  s: GameState,
  amount: number,
  repeated = false,
) {
  const c = s.cultivation;
  if (repeated) {
    const day = Math.floor(s.time / 6);
    if (c.day !== day) {
      c.day = day;
      c.sessions = 0;
    }
    // Easy practice gives less insight once one's foundation outgrows it.
    amount = Math.max(
      1,
      Math.floor(
        (amount / (1 + Math.floor(c.realm / 3))) * (c.sessions < 2 ? 1 : 0.25),
      ),
    );
    c.sessions++;
  }
  if (c.realm === realms.length - 1) return 0;
  c.xp += amount;
  c.total += amount;
  return amount;
}
export const npcRealms: Record<string, string> = {
  suwan: "入不流",
  baizhi: "九品",
  shao: "七品",
  swordsman: "三品",
  lu: "六品",
  gu: "八品",
};
