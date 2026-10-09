export const trialFloors = Array.from({ length: 30 }, (_, index) => {
  const floor = index + 1;
  const boss = floor % 5 === 0;
  const style = ["稳守", "迅攻", "蓄势"][(floor - 1) % 3];
  return {
    floor,
    boss,
    style,
    name: boss
      ? [
          "守门拳师",
          "听风刀客",
          "磐石武师",
          "逐月剑客",
          "藏锋宗师",
          "问心守阁人",
        ][floor / 5 - 1]
      : `${style}试炼者`,
    hp: 68 + floor * 17 + (boss ? 65 : 0),
    attack: 17 + floor * 2 + (boss ? 7 : 0),
    defense: 2 + Math.floor(floor / 2),
    xp: 24 + floor * 8,
    silver: 16 + floor * 4,
    marks: boss ? 3 : 1,
    hint:
      style === "稳守"
        ? "对手守势时，用武学破守。"
        : style === "迅攻"
          ? "先观察意图；连击可用轻功完全避开。"
          : "防住蓄力重击，下一招可乘隙反击。",
  };
});
export const trialExchanges = [
  {
    id: "medicine",
    cost: 1,
    count: 2,
    name: "金疮药 ×2",
    description: "随身补给；战斗用药占一回合。",
  },
  {
    id: "iron",
    cost: 2,
    count: 4,
    name: "精铁 ×4",
    description: "可在铁匠铺强化两次装备。",
  },
  {
    id: "sword",
    cost: 4,
    count: 1,
    name: "青锋剑",
    description: "外功 +18；适配清风十三剑。",
  },
  {
    id: "boots",
    cost: 3,
    count: 1,
    name: "行云靴",
    description: "防御 +3；与初始布衣组成两件套。",
  },
  {
    id: "lightArt",
    cost: 5,
    count: 1,
    name: "追云步传习",
    description: "学会轻功；消耗 8 内力避开当前回合进攻。",
  },
];
export const weaponFits: Record<string, string[]> = {
  swordArt: ["oldSword", "sword", "deepSword"],
  saberArt: ["saber", "tideSaber"],
  fistArt: ["glove", "steelGlove"],
  fanArt: ["fan", "darkFan"],
};
