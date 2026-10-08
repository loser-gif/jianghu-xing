import type { GameState, Page } from "../types";
import { breakthroughNeeds } from "./cultivation";
import { derived } from "./game";
export type Recommendation = {
  title: string;
  text: string;
  button: string;
  page: Page;
  destination?: string;
  heal?: boolean;
};
export function recommend(s: GameState): Recommendation {
  if (s.life.ended)
    return {
      title: "此生已结卷，故事仍留存",
      text: "人物与行囊完整保留，可以回看手记、导出存档，或从主菜单开始新的人生。",
      button: "回看江湖经历",
      page: "journal",
    };
  if (
    [
      "prepare",
      "investigate",
      "trail",
      "dock",
      "defeated",
      "captured",
    ].includes(s.quest.stage)
  )
    return {
      title: "先推进手头的案子",
      text: "接案后有八个游戏日的时限。案卷会告诉你当前线索、所需道具和下一处地点。",
      button: "查看当前案卷",
      page: "quest",
    };
  if (s.player.hp < derived(s).maxHp * 0.4)
    return {
      title: "先疗伤，再闯荡",
      text: "气血偏低，贸然交锋容易落败。药庐可以恢复气血与内力，囊中羞涩也能免费静养。",
      button: s.location === "herb" ? "请白芷疗伤" : "前往药庐 · 两时辰",
      destination: s.location === "herb" ? undefined : "herb",
      heal: s.location === "herb",
      page: "jianghu",
    };
  if (!s.flags.guide_equip)
    return {
      title: "第一步 · 看看你带了什么",
      text: "开局兵器和布衣已穿好，不必先花钱。打开行囊，点击「检查行装」了解装备与药品。",
      button: "打开行囊",
      page: "inventory",
    };
  if (!s.flags.guide_practice)
    return {
      title: "第二步 · 练一次武学",
      text: "武学录中找到已学会的招式或归元心法，点击「静心修习」。熟练度强化武学，修为用于提升境界。",
      button: "前往武学录",
      page: "arts",
    };
  if (!s.trial.highest)
    return {
      title: "第三步 · 试炼塔初试身手",
      text: "第一层用初始装备即可尝试。进入后自动出招；均衡战术会守势用武学、蓄力时防御、抓住破绽反击。可暂停、倍速或撤离。",
      button: "查看试炼塔第一层",
      page: "trial",
    };
  if (breakthroughNeeds(s).ready)
    return {
      title: "修为已足，试试突破",
      text: "突破会提高人物属性。打开武学录查看全部条件，满足后点击突破，不会自动消耗修为。",
      button: "查看突破条件",
      page: "arts",
    };
  if (
    !(s.upgrades[s.equipped.weapon] > 0) &&
    s.inventory.iron >= 2 &&
    s.player.silver >= 20
  )
    return {
      title: "把首通奖励变成实力",
      text: "你已有精铁与银两。前往铁匠铺，在行囊打开兵器详情，首次强化消耗精铁2块、银两20，外功 +3。",
      button: s.location === "smith" ? "打开兵器行囊" : "前往铁匠铺 · 两时辰",
      destination: s.location === "smith" ? undefined : "smith",
      page: "inventory",
    };
  if (s.cultivation.realm === 0)
    return {
      title: "第五步 · 向九品迈出一步",
      text: `当前修为 ${s.cultivation.xp}/60。到武学录修习或凝神吐纳，达到60后点击「突破 · 九品」。境界与武学熟练度分别成长。`,
      button: "前往修习与破境",
      page: "arts",
    };
  return {
    title: "接下来，由你选择江湖路",
    text: "继续闯塔检验配装，采集制作做生活订单，结识人物，或入职捕快查案。卡关时先补给、修习和强化，不必反复硬打。",
    button: "选择一条玩法路线",
    page: "guide",
  };
}
