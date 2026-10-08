import type { GameState } from "../types";

export const commissions = [
  {
    id: "inn",
    title: "一盏归人茶",
    giver: "苏婉娘",
    npc: "suwan",
    locations: ["inn", "dock", "inn"],
    steps: [
      "在客栈接下送信委托",
      "到旧码头寻访迟归的船工",
      "返回客栈，将消息交给苏婉娘",
    ],
    story: "船工已三日未归。婉娘托你沿河打听，信中只是家人的一句平安。",
    reward: "40 两 · 修为 45 · 苏婉娘信任 · 追缉线索",
  },
  {
    id: "herb",
    title: "草木济人",
    giver: "白芷",
    npc: "baizhi",
    locations: ["herb", "lake", "herb"],
    steps: [
      "到药庐询问缺药之事",
      "在西湖湿地采集药草",
      "带回 3 份药草，交给白芷",
    ],
    story:
      "风雨将至，药庐急需三份止血草。白芷递给你一页手绘药谱，叮嘱切莫伤根。",
    reward: "金疮药 ×2 · 修为 50 · 白芷信任 · 疗伤优惠",
  },
  {
    id: "escort",
    title: "旧镖无言",
    giver: "邵远山",
    npc: "shao",
    locations: ["smith", "alley", "smith"],
    steps: [
      "到铁匠铺询问旧镖",
      "在后巷寻回遗失的镖记",
      "回铁匠铺决定旧事的归处",
    ],
    story: "一枚磨旧的镖记遗落雨巷。邵远山不肯多言，只请你查清上面的划痕。",
    reward: "铁料 ×3 · 修为 60 · 邵远山信任 · 案情佐证",
  },
] as const;
export function commissionStage(s: GameState, id: string) {
  return Number(s.flags[`side_${id}`] || 0);
}
export function introText(origin: string) {
  return (
    (
      {
        noble:
          "旧宅早已易主，你却记得堂前刻下的家训。家世可以散尽，行事的分寸仍握在自己手中。",
        escort:
          "离开镖局那日，师父只说：镖可失，人不可负。杭州的铁匠邵远山或许知道你身世中的旧事。",
        scholar:
          "书卷未能写尽世道人心。你收起行囊中的残卷，决定在烟雨杭州亲自求一个答案。",
        hunter:
          "山中听风辨兽，城中听话识人。你带着熟悉草木的本事下山，药庐也许正需要帮手。",
        monk: "山门外并无现成的答案。师父让你先看见别人的难处，再想明白手中的武艺为何而用。",
        mystery:
          "旧名已隐入来路，只余一封无款的信。信上写着杭州，还有西湖边那名负剑的人。",
      } as Record<string, string>
    )[origin] || "你沿着湖岸走来，杭州的第一阵风，翻开一段尚未写下的江湖。"
  );
}
