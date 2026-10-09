import type { GameState } from "../types";
import { sects, sectRankNeeds, sectRanks, sectExchanges } from "../data/sects";
import { arts } from "../data/world";
import { earnCultivation, realms } from "./cultivation";
import { timedCase } from "./calendar";

export const initialSect = (floor = 0): GameState["sect"] => ({
  id: null,
  name: "",
  rank: 0,
  contribution: 0,
  merit: 0,
  daily: {},
  claimedFloor: floor,
  estate: 0,
  disciples: 0,
});
export type SectAction =
  | { type: "sectJoin"; id: string }
  | { type: "sectFound"; name: string }
  | {
      type:
        | "sectLeave"
        | "sectPromote"
        | "sectDrill"
        | "sectSupply"
        | "sectClaim"
        | "sectLearn"
        | "sectStudy"
        | "sectBuild"
        | "sectRecruit"
        | "sectOutreach";
    }
  | { type: "sectExchange"; id: string };
export function sectInfo(s: GameState) {
  return s.sect.id === "own"
    ? {
        id: "own",
        name: s.sect.name,
        mark: "宗",
        location: "inn",
        place: "悦来客栈别院",
        motto: "自立门户，薪火相传",
        description: "以客栈别院为驻地，亲自招徒、建设与传艺。",
        art: "lightArt",
        supply: "soup",
        count: 2,
        specialty: "招徒建设，弟子出力",
      }
    : sects.find((x) => x.id === s.sect.id);
}
export const sectTitle = (s: GameState) =>
  s.sect.id === "own"
    ? "掌门"
    : s.sect.id
      ? sectRanks[s.sect.rank]
      : "无门无派";
export function sectBlocked(s: GameState) {
  return s.life.ended
    ? "此生已结卷，可回看宗门记录。"
    : s.combat
      ? "请先结束当前交锋。"
      : timedCase(s)
        ? "请先处理当前缉捕案，再办理宗门事务。"
        : s.activeEvent
          ? "请先回应眼前际遇。"
          : "";
}
export function promotionNeeds(s: GameState) {
  const n = sectRankNeeds[s.sect.rank + 1];
  return !n
    ? []
    : [
        {
          text: `累计功绩 ${s.sect.merit}/${n.merit}`,
          met: s.sect.merit >= n.merit,
        },
        {
          text: `境界 ${realms[n.realm]}（当前${realms[s.cultivation.realm]}）`,
          met: s.cultivation.realm >= n.realm,
        },
        {
          text: `试炼通关 ${s.trial.highest}/${n.floor}层`,
          met: s.trial.highest >= n.floor,
        },
      ];
}
export function foundingNeeds(s: GameState) {
  return [
    { text: "当前无门无派", met: !s.sect.id },
    {
      text: `七品境界（当前${realms[s.cultivation.realm]}）`,
      met: s.cultivation.realm >= 3,
    },
    { text: `试炼通关 ${s.trial.highest}/5层`, met: s.trial.highest >= 5 },
    { text: `开宗银两 ${s.player.silver}/500`, met: s.player.silver >= 500 },
    { text: "身处悦来客栈", met: s.location === "inn" },
  ];
}
export function sectAction(s: GameState, a: SectAction) {
  const result = (text: string, ticks = 0) => ({ text, ticks });
  const blocked = sectBlocked(s);
  if (blocked) return result(blocked);
  const t = s.sect,
    info = sectInfo(s),
    day = Math.floor(s.time / 6);
  const award = (n: number) => {
    t.contribution += n;
    t.merit += n;
  };
  const done = (key: string) => t.daily[key] === day;
  if (a.type === "sectJoin") {
    const p = sects.find((x) => x.id === a.id);
    if (t.id) return result("已有师门，需先确认离门，才能另投门派。");
    if (!p || s.location !== p.location)
      return result("请先前往该门派在杭州的驻地。");
    t.id = p.id;
    t.name = p.name;
    t.claimedFloor = Math.max(t.claimedFloor, s.trial.highest);
    return result(
      `拜入${p.name}，成为外门弟子。先做演武或物资事务；贡献可花，累计功绩不因兑换减少。`,
      1,
    );
  }
  if (a.type === "sectFound") {
    const name = a.name.trim();
    if (
      !/^[\p{Script=Han}A-Za-z0-9]{2,8}$/u.test(name) ||
      sects.some((x) => x.name === name)
    )
      return result("宗门名需2至8个汉字、字母或数字，且不能与现有门派重名。");
    if (!foundingNeeds(s).every((n) => n.met))
      return result("尚不满足开宗条件，请查看开宗立派清单。");
    s.player.silver -= 500;
    t.id = "own";
    t.name = name;
    t.rank = 3;
    t.estate = 1;
    t.claimedFloor = Math.max(t.claimedFloor, s.trial.highest);
    return result(
      `「${name}」正式立派！支出500两，租下客栈别院。你成为掌门，先招收弟子，再安排济民事务。`,
      6,
    );
  }
  if (!info) return result("请先加入门派，或达到条件自创宗门。");
  if (s.location !== info.location)
    return result(`请先前往${info.place}办理宗门事务。`);
  switch (a.type) {
    case "sectLeave":
      if (t.id === "own")
        return result("自创宗门当前不支持转让或解散，弟子与驻地继续保留。");
      s.sect = { ...initialSect(t.claimedFloor), daily: { ...t.daily } };
      return result(
        `你辞别${info.name}。身份、贡献与累计功绩清零；已学武学、装备、境界保留。今日事务次数不会重置。`,
        1,
      );
    case "sectPromote":
      if (t.id === "own" || t.rank >= 3)
        return result("已达到当前宗门身份的最高阶。");
      if (!promotionNeeds(s).every((n) => n.met))
        return result("晋升条件尚未齐备，请查看境界、功绩和试炼层数。");
      t.rank++;
      return result(
        `晋升${sectRanks[t.rank]}！累计功绩不扣除，内门起可研读藏书并请教传承。`,
        1,
      );
    case "sectDrill": {
      if (done("drill")) return result("本游戏日已完成宗门演武。");
      t.daily.drill = day;
      award(10);
      const xp = earnCultivation(s, 20 + (t.id === "qinglan" ? 10 : 0));
      return result(
        `完成宗门演武，贡献与累计功绩 +10，修为 +${xp}。耗时两时辰。`,
        1,
      );
    }
    case "sectSupply": {
      if (done("supply")) return result("本游戏日已交付宗门物资。");
      if ((s.inventory[info.supply] || 0) < info.count)
        return result("物资不足，先在百业生活采集制作，或购买所需物品。");
      s.inventory[info.supply] -= info.count;
      const points = 18 + (t.id === "baiyao" ? 6 : 0),
        silver = 12 + (t.id === "tiegui" ? 12 : 0);
      award(points);
      s.player.silver += silver;
      t.daily.supply = day;
      return result(
        `物资已入宗库，贡献与累计功绩 +${points}，银两 +${silver}。每游戏日一次。`,
      );
    }
    case "sectClaim": {
      const floors = s.trial.highest - t.claimedFloor;
      if (floors <= 0)
        return result("还没有入门后新通关的试炼层数，同一层功绩不会重复记取。");
      award(floors * 8);
      t.claimedFloor = s.trial.highest;
      return result(
        `录入${floors}层新试炼功绩，贡献与累计功绩 +${floors * 8}。`,
      );
    }
    case "sectLearn":
      if (t.rank < 1) return result("晋升内门后方可请教传承。");
      if (s.arts[info.art] > 0)
        return result("已经学会这门武学，可在武学录继续修习。");
      if (t.contribution < 30) return result("请教传承需要30贡献。");
      t.contribution -= 30;
      s.arts[info.art] = 10;
      return result(
        `消耗30贡献，学会${arts.find((x) => x.id === info.art)!.name}，熟练10。请到武学录查看。`,
        1,
      );
    case "sectStudy":
      if (t.rank < 1 || t.contribution < 10)
        return result("内门起可研读，每次需10贡献。");
      if (done("study")) return result("本游戏日已研读藏书。");
      if ((s.arts.innerArt || 0) >= 100)
        return result("归元心法熟练已满，无需再消耗贡献。");
      t.daily.study = day;
      t.contribution -= 10;
      s.arts.innerArt = Math.min(100, (s.arts.innerArt || 0) + 6);
      return result(
        "消耗10贡献研读藏书，归元心法熟练提升至多6点，耗时两时辰。",
        1,
      );
    case "sectExchange": {
      const e = sectExchanges.find((x) => x.id === a.id);
      if (!e || t.contribution < e.cost)
        return result("贡献不足，先完成宗门事务。");
      t.contribution -= e.cost;
      s.inventory[e.id] = (s.inventory[e.id] || 0) + e.count;
      return result(
        `消耗${e.cost}贡献，兑换${e.name} ×${e.count}；累计功绩不变。`,
      );
    }
    case "sectBuild":
      if (t.id !== "own" || t.estate >= 3)
        return result("只有掌门可建设驻地，当前最高三级。");
      if (
        s.player.silver < t.estate * 200 ||
        (s.inventory.iron || 0) < t.estate * 6
      )
        return result("建设需要银两与精铁，请查看用料清单。");
      s.player.silver -= t.estate * 200;
      s.inventory.iron -= t.estate * 6;
      t.estate++;
      return result(
        `驻地升至${t.estate}级，弟子容量增至${t.estate * 3}人，耗时一日。`,
        6,
      );
    case "sectRecruit":
      if (t.id !== "own") return result("只有掌门可招收弟子。");
      if (done("recruit")) return result("本游戏日已经招收一名弟子。");
      if (t.disciples >= t.estate * 3)
        return result("驻地已满，先建设扩大容量。");
      if (s.player.silver < 40) return result("安置一名弟子需40两。");
      t.disciples++;
      s.player.silver -= 40;
      t.daily.recruit = day;
      return result(
        `招收一名弟子，支出40两，现有${t.disciples}人。耗时两时辰。`,
        1,
      );
    case "sectOutreach": {
      if (t.id !== "own" || t.disciples < 1)
        return result("先招收至少一名弟子，再安排济民事务。");
      if (done("outreach")) return result("弟子本游戏日已出力，明日再安排。");
      if (!(s.inventory.soup > 0))
        return result("需鲜鱼汤1份作为随行补给，可在百业生活制作。");
      s.inventory.soup--;
      t.daily.outreach = day;
      award(t.disciples * 5);
      s.player.silver += t.disciples * 8;
      return result(
        `弟子协力济民，消耗鲜鱼汤1份，获得银两${t.disciples * 8}、贡献与累计功绩${t.disciples * 5}。耗时四时辰。`,
        2,
      );
    }
  }
}
