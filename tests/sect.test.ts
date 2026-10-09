import { describe, it, expect } from "vitest";
import { createCharacter, transition } from "../src/engine/game";
import { sects } from "../src/data/sects";
import { initialSect, type SectAction } from "../src/engine/sect";
import { lifeInfo } from "../src/engine/calendar";
import { parseSave, validState } from "../src/engine/storage";
import type { GameState } from "../src/types";
const start = () => createCharacter("问山", "escort", [], "剑");
const join = (id = "qinglan") => {
  const s = start();
  s.location = sects.find((x) => x.id === id)!.location;
  return transition(s, { type: "sectJoin", id });
};
const act = (s: GameState, type: SectAction["type"]) =>
  transition(s, { type } as SectAction);
const found = () => {
  const s = start();
  s.location = "inn";
  s.cultivation.realm = 3;
  s.trial.highest = 5;
  s.player.silver = 2000;
  return transition(s, { type: "sectFound", name: "问山阁" });
};
describe("宗门进阶", () => {
  it("真实自动战斗通关可录入师门功绩，刷新保存后不重复领取", () => {
    let s = join();
    s = transition(s, { type: "trialEnter", floor: 1 });
    for (let i = 0; i < 80 && s.combat; i++)
      s = transition(s, { type: "autoRound" });
    expect(s.trial.result?.outcome).toBe("win");
    expect(s.sect.merit).toBe(0);
    s = act(s, "sectClaim");
    expect(s.sect.merit).toBe(8);
    s = parseSave(
      JSON.stringify({ version: 1, savedAt: "test", state: s }),
    ).state;
    expect(act(s, "sectClaim").sect.merit).toBe(8);
  });
  it.each(sects)("$name 入门、特色事务与重复保护", (p) => {
    let s = join(p.id);
    expect(s.sect.id).toBe(p.id);
    expect(s.time).toBe(3);
    s.inventory[p.supply] = p.count;
    s = act(s, "sectDrill");
    expect(s.cultivation.xp).toBe(p.id === "qinglan" ? 30 : 20);
    s = act(s, "sectSupply");
    expect(s.sect.merit).toBe(p.id === "baiyao" ? 34 : 28);
    expect(s.player.silver).toBe(80 + (p.id === "tiegui" ? 24 : 12));
    const old = s.sect.contribution;
    expect(act(s, "sectDrill").sect.contribution).toBe(old);
    expect(act(s, "sectSupply").sect.contribution).toBe(old);
    expect(validState(s)).toBe(true);
  });
  it("位置、身份、资源不足时不扣费或耗时", () => {
    let s = start();
    s.location = "inn";
    expect(transition(s, { type: "sectJoin", id: "qinglan" }).sect.id).toBe(
      null,
    );
    s = join();
    s.inventory.iron = 0;
    expect(act(s, "sectSupply").sect.merit).toBe(0);
    expect(act(s, "sectSupply").time).toBe(s.time);
    expect(
      transition(s, { type: "sectExchange", id: "iron" }).inventory.iron,
    ).toBe(0);
    s.location = "inn";
    expect(act(s, "sectDrill").time).toBe(s.time);
    expect(transition(s, { type: "sectJoin", id: "baiyao" }).sect.id).toBe(
      "qinglan",
    );
  });
  it("兑换不降低累计功绩，晋升同时检查境界和试炼", () => {
    let s = join();
    s.sect.merit = 30;
    s.sect.contribution = 30;
    s = transition(s, { type: "sectExchange", id: "medicine" });
    expect(s.sect).toMatchObject({ merit: 30, contribution: 22 });
    expect(act(s, "sectPromote").sect.rank).toBe(0);
    s.cultivation.realm = 1;
    s.trial.highest = 1;
    s = act(s, "sectPromote");
    expect(s.sect.rank).toBe(1);
    s.sect.merit = 180;
    s.sect.contribution = 180;
    s.cultivation.realm = 3;
    s.trial.highest = 5;
    s = act(s, "sectPromote");
    s = act(s, "sectPromote");
    expect(s.sect.rank).toBe(3);
    expect(act(s, "sectPromote").sect.rank).toBe(3);
  });
  it("入门前层数不追补，新增层数一次报功", () => {
    let s = start();
    s.trial.highest = 3;
    s = transition(s, { type: "sectJoin", id: "qinglan" });
    expect(act(s, "sectClaim").sect.merit).toBe(0);
    s.trial.highest = 5;
    s = act(s, "sectClaim");
    expect(s.sect.merit).toBe(16);
    expect(act(s, "sectClaim").sect.merit).toBe(16);
  });
  it("内门传承只学一次，研读有每日和满熟练保护", () => {
    let s = join();
    s.sect.merit = 100;
    s.sect.contribution = 100;
    expect(act(s, "sectLearn").arts.lightArt).toBeUndefined();
    s.sect.rank = 1;
    s = act(s, "sectLearn");
    expect(s.arts.lightArt).toBe(10);
    expect(s.sect.contribution).toBe(70);
    expect(act(s, "sectLearn").sect.contribution).toBe(70);
    s = act(s, "sectStudy");
    expect(s.arts.innerArt).toBe(11);
    expect(s.time).toBe(5);
    expect(act(s, "sectStudy").arts.innerArt).toBe(11);
    s.time = 6;
    s.arts.innerArt = 99;
    s = act(s, "sectStudy");
    expect(s.arts.innerArt).toBe(100);
    s.time = 12;
    expect(act(s, "sectStudy").sect.contribution).toBe(s.sect.contribution);
  });
  it("离门清空身份但保留已学内容，转门不刷新当日事务", () => {
    let s = join();
    s.time = 6;
    s = act(s, "sectDrill");
    s.arts.lightArt = 20;
    s = act(s, "sectLeave");
    expect(s.sect.id).toBe(null);
    expect(s.sect.merit).toBe(0);
    expect(s.arts.lightArt).toBe(20);
    s.location = "herb";
    s = transition(s, { type: "sectJoin", id: "baiyao" });
    expect(act(s, "sectDrill").sect.contribution).toBe(0);
    s.time = 12;
    expect(act(s, "sectDrill").sect.contribution).toBe(10);
  });
});
describe("自立门户与存档", () => {
  it("未达开宗条件、无效宗名与已有师门均不消耗银两", () => {
    const s = start();
    expect(
      transition(s, { type: "sectFound", name: "问山阁" }).player.silver,
    ).toBe(s.player.silver);
    const j = join();
    j.player.silver = 1000;
    j.cultivation.realm = 3;
    j.trial.highest = 5;
    j.location = "inn";
    expect(transition(j, { type: "sectFound", name: "问山阁" }).sect.id).toBe(
      "qinglan",
    );
    for (const name of ["山", "青岚门", "<script>", "山山山山山山山山山"]) {
      const f = start();
      f.location = "inn";
      f.cultivation.realm = 3;
      f.trial.highest = 5;
      f.player.silver = 1000;
      expect(transition(f, { type: "sectFound", name }).sect.id).toBe(null);
    }
  });
  it("开宗、招徒、济民、扩建形成闭环并正确结算时间和成本", () => {
    let s = found();
    expect(s.sect).toMatchObject({
      id: "own",
      name: "问山阁",
      rank: 3,
      estate: 1,
    });
    expect(s.player.silver).toBe(1500);
    expect(s.time).toBe(8);
    s = act(s, "sectRecruit");
    expect(s.sect.disciples).toBe(1);
    expect(s.player.silver).toBe(1460);
    expect(act(s, "sectRecruit").sect.disciples).toBe(1);
    expect(act(s, "sectOutreach").time).toBe(s.time);
    s.inventory.soup = 2;
    s = act(s, "sectOutreach");
    expect(s.sect.merit).toBe(5);
    expect(s.time).toBe(11);
    expect(act(s, "sectOutreach").sect.merit).toBe(5);
    s.inventory.iron = 18;
    s = act(s, "sectBuild");
    expect(s.sect.estate).toBe(2);
    expect(s.time).toBe(17);
    s = act(s, "sectBuild");
    expect(s.sect.estate).toBe(3);
    expect(s.inventory.iron).toBe(0);
    expect(act(s, "sectBuild").time).toBe(s.time);
    expect(act(s, "sectLeave").sect.id).toBe("own");
    expect(validState(s)).toBe(true);
  });
  it("招徒容量和建设物资都由引擎限制", () => {
    let s = found();
    s.sect.disciples = 3;
    expect(act(s, "sectRecruit").player.silver).toBe(s.player.silver);
    expect(act(s, "sectBuild").sect.estate).toBe(1);
    s.inventory.iron = 6;
    s.player.silver = 199;
    expect(act(s, "sectBuild").inventory.iron).toBe(6);
  });
  it("案件、交锋、事件与寿尽均冻结宗门事务", () => {
    for (const setup of [
      (s: GameState) => {
        s.quest.stage = "prepare";
      },
      (s: GameState) => {
        s.combat = {
          kind: "trial",
          floor: 1,
          advantage: false,
          hp: 100,
          maxHp: 100,
          round: 1,
          guarded: false,
          logs: [],
        };
      },
      (s: GameState) => {
        s.activeEvent = "anything";
      },
      (s: GameState) => {
        s.life.ended = true;
      },
    ]) {
      const s = join();
      setup(s);
      expect(act(s, "sectDrill").sect.merit).toBe(0);
      expect(act(s, "sectDrill").time).toBe(s.time);
    }
  });
  it("耗尽寿命的扩建回滚材料和建筑，结算仍保留宗门", () => {
    const s = found();
    s.inventory.iron = 6;
    s.time = lifeInfo(s).endAt - 2;
    const end = act(s, "sectBuild");
    expect(end.life.ended).toBe(true);
    expect(end.sect.estate).toBe(1);
    expect(end.inventory.iron).toBe(6);
    expect(end.player.silver).toBe(s.player.silver);
    expect(validState(end)).toBe(true);
  });
  it("旧档迁移不影响人物和试炼，宗门新档可往返且拒绝损坏字段", () => {
    const old = start() as Partial<GameState>;
    old.trial!.highest = 5;
    delete old.sect;
    const s = parseSave(
      JSON.stringify({ version: 1, savedAt: "old", state: old }),
    ).state;
    expect(s.sect).toEqual(initialSect(5));
    expect(s.player).toEqual(old.player);
    const f = found();
    expect(
      parseSave(JSON.stringify({ version: 1, savedAt: "now", state: f })).state
        .sect,
    ).toEqual(f.sect);
    for (const patch of [
      { id: "missing" },
      { rank: 4 },
      { contribution: -1 },
      { contribution: 1, merit: 0 },
      { estate: 0 },
      { disciples: 99 },
      { daily: { drill: 100 } },
      { daily: { unknown: 0 } },
    ]) {
      expect(validState({ ...f, sect: { ...f.sect, ...patch } })).toBe(false);
    }
  });
});
