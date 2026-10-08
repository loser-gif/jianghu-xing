import { describe, it, expect } from "vitest";
import { createCharacter, derived, transition } from "../src/engine/game";
import { parseSave } from "../src/engine/storage";
import { realms, breakthroughNeeds } from "../src/engine/cultivation";
import { commissions } from "../src/engine/sidequests";
const start = () =>
  createCharacter("照晚", "escort", ["careful", "sword"], "剑", "female");
const save = (state: unknown) =>
  JSON.stringify({ version: 1, savedAt: "2026-10-08", state });

describe("修为与新开局", () => {
  it("男女形貌不改变数值与初始物品", () => {
    const f = start(),
      m = createCharacter("照晚", "escort", ["careful", "sword"], "剑", "male");
    expect(derived(f)).toEqual(derived(m));
    expect(f.inventory).toEqual(m.inventory);
    expect(f.player.gender).toBe("female");
    expect(realms).toHaveLength(15);
    expect(realms[0]).toBe("入不流");
    expect(realms[14]).toBe("太朴");
  });
  it("序章选择仅奖励一次，跳过也不会刷取奖励", () => {
    let s = transition(start(), { type: "prologue", id: "help" });
    expect(s.cultivation.xp).toBe(10);
    expect(transition(s, { type: "prologue", id: "seek" })).toEqual(s);
    s = transition(start(), { type: "prologue", id: "skip" });
    expect(transition(s, { type: "prologue", id: "help" }).cultivation.xp).toBe(
      0,
    );
  });
  it("吐纳与修习共享同日收益递减，次日重置", () => {
    let s = start();
    s.time = 0;
    s = transition(s, { type: "meditate" });
    s = transition(s, { type: "practice", id: "innerArt" });
    expect(s.cultivation.xp).toBe(28);
    s = transition(s, { type: "meditate" });
    expect(s.cultivation.xp).toBe(31);
    s.time = 6;
    s = transition(s, { type: "meditate" });
    expect(s.cultivation.xp).toBe(43);
  });
  it("破境消耗当前修为并应用战斗加成，不能连点空升", () => {
    let s = start();
    s.cultivation.xp = 60;
    s.cultivation.total = 60;
    const before = derived(s);
    s = transition(s, { type: "ascend" });
    expect(s.cultivation.realm).toBe(1);
    expect(s.cultivation.xp).toBe(0);
    expect(s.cultivation.total).toBe(60);
    expect(derived(s).attack).toBe(before.attack + 3);
    expect(derived(s).maxHp).toBe(before.maxHp + 18);
    expect(transition(s, { type: "ascend" }).cultivation.realm).toBe(1);
  });
  it("高境界仍受内功、历练及主线条件限制，圆满不再破境", () => {
    const s = start();
    s.cultivation.realm = 9;
    s.cultivation.xp = 99999;
    s.cultivation.total = 99999;
    expect(breakthroughNeeds(s).ready).toBe(false);
    expect(transition(s, { type: "ascend" }).cultivation.realm).toBe(9);
    s.cultivation.realm = 14;
    expect(breakthroughNeeds(s).next).toBeUndefined();
    expect(transition(s, { type: "ascend" }).cultivation.realm).toBe(14);
  });
  it("旧存档补入历练且保留人物、装备、任务，迁移幂等", () => {
    const old = start() as unknown as Record<string, unknown>;
    delete old.cultivation;
    delete (old.player as Record<string, unknown>).gender;
    const migrated = parseSave(save(old)).state;
    expect(migrated.player.name).toBe("照晚");
    expect(migrated.inventory).toEqual(start().inventory);
    expect(migrated.quest).toEqual(start().quest);
    expect(migrated.cultivation.xp).toBeGreaterThan(0);
    expect(migrated.flags.appearance_chosen).toBe(false);
    expect(parseSave(save(migrated)).state).toEqual(migrated);
  });
  it("拒绝损坏的境界和画像字段，正常新存档完整往返", () => {
    const s = start();
    expect(parseSave(save(s)).state).toEqual(s);
    for (const bad of [-1, 15, 1.5, "九品", null])
      expect(() =>
        parseSave(
          save({ ...s, cultivation: { ...s.cultivation, realm: bad } }),
        ),
      ).toThrow();
    expect(() =>
      parseSave(save({ ...s, player: { ...s.player, gender: "invalid" } })),
    ).toThrow();
  });
  it("已发生际遇只结算一次感悟", () => {
    let s = start();
    s = transition(s, { type: "explore" });
    expect(s.activeEvent).not.toBeNull();
    s = transition(s, { type: "choice", id: "help" });
    expect(s.cultivation.insights).toBe(1);
    expect(transition(s, { type: "choice", id: "help" }).cultivation).toEqual(
      s.cultivation,
    );
  });
  for (const quest of commissions)
    it(`${quest.title}完整三步、不同结局、奖励不能重复`, () => {
      let s = start();
      // Remote action cannot accept or finish a commission.
      expect(
        transition(s, { type: "commission", id: quest.id }).flags[
          `side_${quest.id}`
        ],
      ).toBeUndefined();
      for (let i = 0; i < 3; i++) {
        s = transition(s, { type: "move", id: quest.locations[i] });
        s = transition(s, {
          type: "commission",
          id: quest.id,
          choice: "honest",
        });
      }
      expect(s.flags[`side_${quest.id}`]).toBe(3);
      expect(s.cultivation.insights).toBe(1);
      expect(
        s.relationships[quest.npc].memories.some((m) =>
          m.includes(quest.title),
        ),
      ).toBe(true);
      expect(
        transition(s, { type: "commission", id: quest.id, choice: "reward" }),
      ).toEqual(s);
    });
  it("药草交付会核对并扣除库存，不能凭空领奖", () => {
    let s = start();
    s.location = "herb";
    s.flags.side_herb = 2;
    s.inventory.herb = 2;
    s = transition(s, { type: "commission", id: "herb", choice: "honest" });
    expect(s.flags.side_herb).toBe(2);
    expect(s.cultivation.xp).toBe(0);
    s.inventory.herb = 3;
    s = transition(s, { type: "commission", id: "herb", choice: "reward" });
    expect(s.inventory.herb).toBe(0);
    expect(s.inventory.medicine).toBe(4);
    expect(s.player.silver).toBe(start().player.silver + 20);
  });
  it("战斗和未处理事件阻止吐纳、委托、换像及破境", () => {
    let s = start();
    s = transition(s, { type: "explore" });
    for (const action of [
      { type: "meditate" },
      { type: "ascend" },
      { type: "appearance", gender: "male" },
      { type: "commission", id: "inn" },
    ] as const) {
      const after = transition(s, action);
      expect(after.cultivation).toEqual(s.cultivation);
      expect(after.player).toEqual(s.player);
    }
  });
});
