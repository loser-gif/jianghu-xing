import { describe, it, expect } from "vitest";
import { createCharacter, transition, derived } from "../src/engine/game";
import { calendar, lifeInfo, TICKS_PER_YEAR } from "../src/engine/calendar";
import { autoDecision } from "../src/engine/autobattle";
import { validState, parseSave } from "../src/engine/storage";
import type { GameState } from "../src/types";
const start = () =>
  createCharacter("岁时", "escort", ["careful", "sword"], "剑");
const act = (
  s: GameState,
  type: "gather" | "craft" | "order" | "sell",
  id: string,
) => transition(s, { type, id });

describe("岁时与人生", () => {
  it("年月和四季正确跨月跨年，一日六个时段", () => {
    expect(calendar(2)).toMatchObject({
      year: 12,
      month: 9,
      day: 7,
      season: "秋",
      period: 2,
    });
    expect(calendar(24 * 6)).toMatchObject({ month: 10, day: 1, season: "冬" });
    expect(calendar(114 * 6)).toMatchObject({
      year: 13,
      month: 1,
      day: 1,
      season: "春",
    });
  });
  it("生日增龄与闭关按游戏日推进，读取存档不会推进时间", () => {
    let s = start();
    const time = s.time;
    s = transition(s, { type: "seclusion", days: 360 });
    expect(s.time - time).toBe(TICKS_PER_YEAR);
    expect(lifeInfo(s).age).toBe(18);
    expect(s.cultivation.xp).toBe(7200);
    expect(
      parseSave(JSON.stringify({ version: 1, savedAt: "2000-01-01", state: s }))
        .state.time,
    ).toBe(s.time);
    expect(transition(s, { type: "seclusion", days: 365 }).time).toBe(s.time);
  });
  it("正在推进案件时拒绝长期闭关", () => {
    const s = start();
    s.quest.stage = "prepare";
    expect(transition(s, { type: "seclusion", days: 30 }).time).toBe(s.time);
  });
  it("高境界寿元为上限，突破不会重复叠加", () => {
    const s = start();
    s.cultivation.realm = 10;
    expect(lifeInfo(s).lifespan).toBe(150);
    s.cultivation.realm = 14;
    expect(lifeInfo(s).lifespan).toBe(1000);
  });
  it("跨寿命终点先结算，未完成闭关不发奖，结卷冻结游戏且存档仍有效", () => {
    const s = start();
    s.time = lifeInfo(s).endAt - 3;
    const gold = s.player.silver;
    const ended = transition(s, { type: "seclusion", days: 360 });
    expect(ended.life.ended).toBe(true);
    expect(lifeInfo(ended).age).toBe(80);
    expect(ended.time).toBe(lifeInfo(s).endAt);
    expect(ended.cultivation.xp).toBe(0);
    expect(ended.player.silver).toBe(gold);
    expect(validState(ended)).toBe(true);
    const after = transition(ended, { type: "gather", id: "fishing" });
    expect(after.time).toBe(ended.time);
    expect(after.inventory).toEqual(ended.inventory);
  });
  it("旧档初始化年龄基准，损坏年龄和战术字段被拒绝", () => {
    const old = start() as Partial<GameState>;
    old.time = 9000;
    delete old.life;
    delete old.living;
    delete old.battle;
    const migrated = parseSave(
      JSON.stringify({ version: 1, savedAt: "old", state: old }),
    ).state;
    expect(lifeInfo(migrated).age).toBe(17);
    expect(migrated.time).toBe(9000);
    migrated.life.startAt = 9001;
    expect(validState(migrated)).toBe(false);
    migrated.life.startAt = 9000;
    migrated.battle.speed = 9 as 1;
    expect(validState(migrated)).toBe(false);
  });
});
describe("生活成长循环", () => {
  it.each([
    ["herbalism", "herb", "salve", "clinic", "medicine"],
    ["smithing", "smith", "iron", "forge", "iron"],
    ["fishing", "lake", "soup", "inn", "soup"],
  ])(
    "%s从采集制作到交单并限制同日重复",
    (job, location, recipe, order, item) => {
      let s = start();
      s.location = location;
      const silver = s.player.silver;
      for (let i = 0; i < 2; i++) {
        s = act(s, "gather", job);
        s = act(s, "craft", recipe);
      }
      expect(s.inventory[item]).toBeGreaterThan(0);
      expect(s.living.crafted).toBe(2);
      s = act(s, "order", order);
      expect(s.living.delivered).toBe(1);
      expect(s.player.silver).toBeGreaterThan(silver);
      const after = act(s, "order", order);
      expect(after.player.silver).toBe(s.player.silver);
      expect(after.living.delivered).toBe(1);
      expect(validState(s)).toBe(true);
    },
  );
  it("拒绝异地、缺料、缺钱、锁定配方，未扣时间和资源", () => {
    let s = start();
    expect(act(s, "gather", "smithing").time).toBe(s.time);
    s.location = "herb";
    s.inventory.herb = 0;
    expect(act(s, "craft", "salve").time).toBe(s.time);
    s.inventory.herb = 20;
    s.player.silver = 0;
    expect(act(s, "craft", "salve").inventory.herb).toBe(20);
    s.player.silver = 80;
    expect(act(s, "craft", "tonic").inventory.tonic).toBeUndefined();
  });
  it("熟手产量提升；市集仅出售已有允许物品；补给恢复不溢出", () => {
    let s = start();
    s.location = "herb";
    s.living.xp.herbalism = 60;
    s = act(s, "gather", "herbalism");
    expect(s.inventory.herb).toBe(6);
    s = act(s, "craft", "salve");
    expect(s.inventory.medicine).toBe(4);
    s.location = "inn";
    const gold = s.player.silver;
    s = act(s, "sell", "medicine");
    expect(s.player.silver).toBe(gold + 6);
    const unchanged = act(s, "sell", "oldSword");
    expect(unchanged.inventory.oldSword).toBe(1);
    s.inventory.soup = 1;
    s.player.hp -= 2;
    s.player.qi -= 3;
    s = transition(s, { type: "use", id: "soup" });
    expect(s.player.hp).toBe(derived(s).maxHp);
    expect(s.player.qi).toBe(derived(s).maxQi);
    expect(s.inventory.soup).toBe(0);
  });
});
describe("自动战斗决策", () => {
  it.each(["剑", "刀", "拳掌", "奇门"])(
    "初始%s均衡自动通关第一层且不自动连闯",
    (weapon) => {
      let s = transition(createCharacter("试炼", "escort", [], weapon), {
        type: "trialEnter",
        floor: 1,
      });
      for (let i = 0; i < 80 && s.combat; i++)
        s = transition(s, { type: "autoRound" });
      expect(s.trial.highest).toBe(1);
      expect(s.combat).toBeNull();
      const after = transition(s, { type: "autoRound" });
      expect(after.time).toBe(s.time);
      expect(after.trial.wins).toBe(1);
    },
  );
  it("均衡化解重击；强攻出招；自动用药需要明确开启", () => {
    let s = transition(start(), { type: "trialEnter", floor: 1 });
    s.combat!.round = 2;
    expect(autoDecision(s, derived(s).maxHp).id).toBe("defend");
    s = transition(s, { type: "battlePlan", strategy: "offense", speed: 4 });
    expect(autoDecision(s, derived(s).maxHp).id).toBe("art");
    s.player.hp = 20;
    expect(autoDecision(s, derived(s).maxHp).id).not.toBe("medicine");
    s = transition(s, { type: "battlePlan", medicine: true });
    expect(autoDecision(s, derived(s).maxHp).id).toBe("medicine");
    const after = transition(s, { type: "autoRound" });
    expect(after.inventory.medicine).toBe(1);
    expect(after.time).toBe(s.time);
  });
  it("案件战斗也使用自动决策，战中不允许生产", () => {
    const s = start();
    s.quest.stage = "combat";
    s.combat = { hp: 260, maxHp: 260, round: 3, guarded: false, logs: [] };
    expect(autoDecision(s, derived(s).maxHp).id).toBe("defend");
    expect(transition(s, { type: "autoRound" }).combat!.round).toBe(4);
    expect(act(s, "gather", "fishing").time).toBe(s.time);
  });
});
