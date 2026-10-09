import { describe, expect, it } from "vitest";
import { createCharacter, derived, transition } from "../src/engine/game";
import { courtCases } from "../src/data/court";
import { lifeInfo, timedCase } from "../src/engine/calendar";
import { initialCourt } from "../src/engine/court";
import { parseSave, validState } from "../src/engine/storage";
import type { GameState } from "../src/types";
const senior = () => {
  const s = createCharacter("案牍", "escort", [], "剑");
  s.location = "office";
  s.quest.stage = "completed";
  s.flags.case_completed = true;
  s.identity = {
    rank: 2,
    reputation: 25,
    contribution: 40,
    wins: 1,
    losses: 0,
  };
  s.cultivation.realm = 3;
  s.arts.swordArt = 60;
  s.arts.innerArt = 55;
  s.arts.lightArt = 10;
  s.inventory.sword = 1;
  s.equipped.weapon = "sword";
  s.upgrades.sword = 3;
  s.inventory.medicine = 6;
  s.player.hp = derived(s).maxHp;
  s.player.qi = derived(s).maxQi;
  return s;
};
const investigate = (s: GameState, id: string) => {
  const f = courtCases.find((x) => x.id === id)!;
  for (const clue of [...f.clues].reverse()) {
    s = transition(s, { type: "move", id: clue.location });
    s = transition(s, { type: "courtInvestigate", id: clue.id });
  }
  return s;
};
const win = (s: GameState, id: string) => {
  const f = courtCases.find((x) => x.id === id)!;
  s = investigate(s, id);
  s = transition(s, { type: "move", id: f.location });
  s = transition(s, { type: "courtConfront" });
  for (let n = 0; n < 100 && s.combat; n++)
    s = transition(s, { type: "autoRound" });
  expect(s.court.active?.stage).toBe("verdict");
  return transition(s, { type: "move", id: "office" });
};
describe("朝廷案卷", () => {
  it.each(courtCases)(
    "$title 可任意顺序取证，自动交锋后结算且不重复发奖",
    (f) => {
      let s = senior();
      s.identity.rank = f.rank;
      s.cultivation.realm = f.realm;
      s.player.hp = derived(s).maxHp;
      s.player.qi = derived(s).maxQi;
      s = transition(s, { type: "courtAccept", id: f.id });
      expect(timedCase(s)).toBe(true);
      const gold = s.player.silver,
        rep = s.identity.reputation,
        con = s.identity.contribution;
      s = win(s, f.id);
      expect(s.player.silver).toBe(gold);
      expect(validState(s)).toBe(true);
      s = transition(s, { type: "courtResolve", choice: "treasury" });
      expect(s.player.silver).toBe(gold + f.silver);
      expect(s.identity.reputation).toBe(rep + f.reputation);
      expect(s.identity.contribution).toBe(con + f.contribution);
      expect(s.court.completed[f.id]).toBe("treasury");
      expect(timedCase(s)).toBe(false);
      expect(validState(s)).toBe(true);
      expect(
        transition(s, { type: "courtResolve", choice: "treasury" }).player
          .silver,
      ).toBe(s.player.silver);
      expect(
        transition(s, { type: "courtAccept", id: f.id }).court.active,
      ).toBe(null);
    },
  );
  it("在办限制、地点、官阶、证据和低气血不能被跳过", () => {
    let s = senior();
    s.location = "lake";
    expect(
      transition(s, { type: "courtAccept", id: "silver" }).court.active,
    ).toBe(null);
    s.location = "office";
    expect(
      transition(s, { type: "courtAccept", id: "edict" }).court.active,
    ).toBe(null);
    s = transition(s, { type: "courtAccept", id: "silver" });
    expect(
      transition(s, { type: "courtAccept", id: "silver" }).court.active,
    ).toEqual(s.court.active);
    expect(transition(s, { type: "courtConfront" }).combat).toBe(null);
    expect(
      transition(s, { type: "courtInvestigate", id: "seal" }).court.active
        ?.evidence,
    ).toEqual([]);
    s.location = "dock";
    s = transition(s, { type: "courtInvestigate", id: "seal" });
    const time = s.time;
    expect(transition(s, { type: "courtInvestigate", id: "seal" }).time).toBe(
      time,
    );
    s.location = "inn";
    s = transition(s, { type: "courtInvestigate", id: "ledger" });
    s.location = "dock";
    s.player.hp = 1;
    expect(transition(s, { type: "courtConfront" }).combat).toBe(null);
  });
  it("调查期不能闭关、闯塔、办宗门事务或申请晋升", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    expect(transition(s, { type: "seclusion", days: 360 }).time).toBe(s.time);
    s.location = "lake";
    expect(transition(s, { type: "trialEnter", floor: 1 }).combat).toBe(null);
    expect(transition(s, { type: "sectJoin", id: "qinglan" }).sect.id).toBe(
      null,
    );
    s.location = "office";
    s.court.completed.edict = "treasury";
    s.identity.contribution = 999;
    s.identity.reputation = 999;
    expect(transition(s, { type: "promote" }).identity.rank).toBe(2);
  });
  it("八日期限精确触发，次日可重接并清空本案证据", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    s.time = s.court.active!.acceptedAt + 47;
    s = transition(s, { type: "wait" });
    expect(s.court.active).toBe(null);
    expect(s.court.result?.outcome).toBe("expired");
    expect(s.identity.losses).toBe(1);
    expect(
      transition(s, { type: "courtAccept", id: "silver" }).court.active,
    ).toBe(null);
    s.time = (Math.floor(s.time / 6) + 1) * 6;
    s = transition(s, { type: "courtAccept", id: "silver" });
    expect(s.court.active?.evidence).toEqual([]);
    expect(validState(s)).toBe(true);
  });
  it("调查最后时段仍会超时，不会先授予可交锋状态", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    s.court.active!.evidence = ["ledger"];
    s.time = s.court.active!.acceptedAt + 47;
    s.location = "dock";
    s = transition(s, { type: "courtInvestigate", id: "seal" });
    expect(s.court.active).toBe(null);
    expect(s.court.result?.outcome).toBe("expired");
  });
  it("战斗存档恢复，撤离与落败保留官阶并能重新调查", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    s = investigate(s, "silver");
    s.location = "dock";
    s = transition(s, { type: "courtConfront" });
    s = transition(s, { type: "autoRound" });
    const c = s.combat;
    s = parseSave(
      JSON.stringify({ version: 1, savedAt: "test", state: s }),
    ).state;
    expect(s.combat).toEqual(c);
    const retreat = transition(s, { type: "fight", id: "escape" });
    expect(retreat.court.active).toBe(null);
    expect(retreat.identity.rank).toBe(2);
    expect(retreat.identity.losses).toBe(1);
    expect(validState(retreat)).toBe(true);
    s.player.hp = 2;
    const loss = transition(s, { type: "fight", id: "defend" });
    expect(loss.player.hp).toBe(1);
    expect(loss.court.result?.outcome).toBe("loss");
  });
  it("救助分支扣60赏银并增加侠义，两种处置都计入晋升", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    s = win(s, "silver");
    const gold = s.player.silver;
    s = transition(s, { type: "courtResolve", choice: "relief" });
    expect(s.player.silver).toBe(gold + 180);
    expect(s.player.morality).toBe(4);
    s = transition(s, { type: "promote" });
    expect(s.identity.rank).toBe(3);
    s.cultivation.realm = 5;
    s.player.hp = derived(s).maxHp;
    s.player.qi = derived(s).maxQi;
    s = transition(s, { type: "courtAccept", id: "edict" });
    s = win(s, "edict");
    s = transition(s, { type: "courtResolve", choice: "treasury" });
    s = transition(s, { type: "promote" });
    expect(s.identity.rank).toBe(4);
    expect(transition(s, { type: "promote" }).identity.rank).toBe(4);
  });
  it("俸银每日一次，晋升不能再领，且必须在职并身处官府", () => {
    let s = senior();
    const gold = s.player.silver;
    s = transition(s, { type: "courtSalary" });
    expect(s.player.silver).toBe(gold + 16);
    s.identity.rank = 4;
    expect(transition(s, { type: "courtSalary" }).player.silver).toBe(
      s.player.silver,
    );
    s.time += 6;
    s.location = "inn";
    expect(transition(s, { type: "courtSalary" }).player.silver).toBe(
      s.player.silver,
    );
    s.location = "office";
    s = transition(s, { type: "courtSalary" });
    expect(s.player.silver).toBe(gold + 60);
  });
  it("撤案先记录失败，结算跨寿尽回滚奖励并封存案卷", () => {
    let s = senior();
    s = transition(s, { type: "courtAccept", id: "silver" });
    const abandoned = transition(s, { type: "courtAbandon" });
    expect(abandoned.court.result?.outcome).toBe("abandoned");
    expect(abandoned.identity.losses).toBe(1);
    s = win(s, "silver");
    s.time = lifeInfo(s).endAt - 1;
    const gold = s.player.silver;
    s = transition(s, { type: "courtResolve", choice: "treasury" });
    expect(s.life.ended).toBe(true);
    expect(s.player.silver).toBe(gold);
    expect(s.court.completed.silver).toBeUndefined();
    expect(s.court.active).toBe(null);
    expect(validState(s)).toBe(true);
  });
  it("旧档原案和宗门不变，新字段严格校验", () => {
    const old = senior() as Partial<GameState>;
    delete old.court;
    const s = parseSave(
      JSON.stringify({ version: 1, savedAt: "old", state: old }),
    ).state;
    expect(s.court).toEqual(initialCourt());
    expect(s.quest).toEqual(old.quest);
    expect(s.sect).toEqual(old.sect);
    for (const patch of [
      { salaryDay: 1.5 },
      { salaryDay: 999 },
      { completed: { silver: "bad" } },
      { completed: { unknown: "treasury" } },
      { attempted: { silver: 999 } },
      {
        active: { id: "silver", stage: "combat", acceptedAt: 2, evidence: [] },
      },
    ])
      expect(validState({ ...s, court: { ...s.court, ...patch } })).toBe(false);
  });
});
