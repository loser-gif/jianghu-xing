import { describe, it, expect } from "vitest";
import {
  createCharacter,
  transition,
  derived,
  meets,
} from "../src/engine/game";
import { parseSave, validState } from "../src/engine/storage";
import type { GameState } from "../src/types";
import type { Action } from "../src/engine/game";
const start = () =>
  createCharacter("沈辞", "escort", ["careful", "sword"], "剑");
function run(s: GameState, ...actions: Action[]) {
  return actions.reduce(transition, s);
}
function prepared() {
  return run(
    start(),
    { type: "move", id: "office" },
    { type: "join" },
    { type: "accept" },
    { type: "buy", id: "rope" },
    { type: "buy", id: "rope" },
    { type: "buy", id: "cloth" },
    { type: "prepare" },
  );
}
function battle() {
  return run(
    prepared(),
    { type: "move", id: "tower" },
    { type: "investigate" },
    { type: "move", id: "alley" },
    { type: "track", id: "observe" },
    { type: "move", id: "dock" },
    { type: "confront" },
  );
}
function defeated() {
  let s = battle();
  for (let i = 0; i < 20 && s.combat; i++)
    s = transition(s, {
      type: "fight",
      id: s.player.qi >= 12 ? "art" : "attack",
    });
  return s;
}
describe("杭州纵向流程", () => {
  it("从角色创建到结案晋升，奖励只发一次", () => {
    let s = defeated();
    expect(s.quest.stage).toBe("defeated");
    expect(s.player.hp).toBeGreaterThan(0);
    s = run(
      s,
      { type: "control", id: "hands" },
      { type: "control", id: "legs" },
      { type: "control", id: "alert" },
    );
    expect(s.quest.stage).toBe("captured");
    expect(s.inventory.rope).toBe(0);
    expect(s.inventory.cloth).toBe(0);
    const silver = s.player.silver;
    s = transition(s, { type: "turnin" });
    expect(s.quest.stage).toBe("completed");
    expect(s.player.silver).toBe(silver + 300);
    expect(s.identity.contribution).toBe(40);
    const once = structuredClone(s);
    s = transition(s, { type: "turnin" });
    expect(s.player.silver).toBe(once.player.silver);
    expect(s.identity.wins).toBe(1);
    s = transition(s, { type: "promote" });
    expect(s.identity.rank).toBe(2);
    expect(s.relationships.lu.memories.length).toBeGreaterThan(0);
  });
  it("未入职、未接案、未调查不能跳关", () => {
    let s = start();
    s = run(
      s,
      { type: "accept" },
      { type: "prepare" },
      { type: "investigate" },
      { type: "confront" },
      { type: "turnin" },
    );
    expect(s.quest.stage).toBe("locked");
    expect(s.player.silver).toBe(80);
  });
  it("准备要求两条绳索与一条布条", () => {
    let s = run(
      start(),
      { type: "move", id: "office" },
      { type: "join" },
      { type: "accept" },
      { type: "buy", id: "rope" },
      { type: "buy", id: "cloth" },
      { type: "prepare" },
    );
    expect(s.quest.stage).toBe("prepare");
    expect(s.lastMessage).toContain("绳索 2");
  });
  it("未彻底击败不可拘捕，交锋中不可移动", () => {
    let s = battle();
    s = transition(s, { type: "control", id: "hands" });
    expect(s.quest.controls).toEqual([]);
    s = transition(s, { type: "move", id: "inn" });
    expect(s.location).toBe("dock");
    expect(s.combat).not.toBeNull();
  });
  it("控制不能重复消耗，同一战后物证与治疗不能重复刷取", () => {
    let s = defeated();
    s = transition(s, { type: "control", id: "hands" });
    const count = s.inventory.rope;
    s = transition(s, { type: "control", id: "hands" });
    expect(s.inventory.rope).toBe(count);
    s = run(
      s,
      { type: "dispose", id: "heal" },
      { type: "dispose", id: "search" },
    );
    const trust = s.relationships.gu.trust,
      med = s.inventory.medicine;
    s = run(
      s,
      { type: "dispose", id: "heal" },
      { type: "dispose", id: "search" },
    );
    expect(s.relationships.gu.trust).toBe(trust);
    expect(s.inventory.medicine).toBe(med);
    expect(s.quest.clues.filter((x) => x === "追回失窃的玉佩")).toHaveLength(1);
  });
  it("不完全拘捕会失败，重试保留失利历史", () => {
    let s = run(
      defeated(),
      { type: "control", id: "hands" },
      { type: "dispose", id: "escortPartial" },
    );
    expect(s.quest.stage).toBe("failed");
    expect(s.identity.losses).toBe(1);
    expect(s.flags.case_failed).toBe(true);
    s = run(s, { type: "move", id: "office" }, { type: "retry" });
    expect(s.quest.stage).toBe("prepare");
    expect(s.flags.case_failed).toBe(true);
    expect(s.identity.losses).toBe(1);
  });
  it("超时只结算一次失败，不回滚世界", () => {
    let s = prepared();
    for (let i = 0; i < 49; i++) s = transition(s, { type: "wait" });
    expect(s.quest.stage).toBe("failed");
    expect(s.identity.losses).toBe(1);
    expect(s.time).toBeGreaterThan(48);
  });
  it("战败后存活并到达药庐，可以恢复", () => {
    let s = battle();
    s.player.hp = 1;
    s = transition(s, { type: "fight", id: "attack" });
    expect(s.quest.stage).toBe("failed");
    expect(s.location).toBe("herb");
    expect(s.player.hp).toBe(1);
    s.player.silver = 0;
    s = transition(s, { type: "heal" });
    expect(s.player.hp).toBe(81);
    expect(s.player.silver).toBe(0);
  });
});
describe("真实的选择后果与养成", () => {
  it("帮助客栈掌柜会解锁后续可信情报", () => {
    let s = run(start(), { type: "move", id: "inn" }, { type: "explore" });
    expect(s.activeEvent).toBe("inn_guest");
    s = transition(s, { type: "choice", id: "reason" });
    expect(s.flags.helped_suwan).toBe(true);
    s = transition(s, { type: "explore" });
    expect(s.activeEvent).toBe("inn_secret");
    s = transition(s, { type: "choice", id: "thanks" });
    expect(s.flags.trusted_clue).toBe(true);
    expect(s.relationships.suwan.memories.length).toBeGreaterThan(0);
  });
  it("事件只结算一次，选项需求会被引擎检查", () => {
    let s = run(start(), { type: "move", id: "tower" }, { type: "explore" });
    s.player.stats.insight = 50;
    const before = s.arts.swordArt;
    s = transition(s, { type: "choice", id: "read" });
    expect(s.arts.swordArt).toBe(before);
    expect(s.activeEvent).toBe("tower_scholar");
    s = transition(s, { type: "choice", id: "listen" });
    const once = s.arts.swordArt;
    s = transition(s, { type: "choice", id: "listen" });
    expect(s.arts.swordArt).toBe(once);
  });
  it("山野猎户能辨踪，其他出身先花时间观察", () => {
    let s = prepared();
    s = run(
      s,
      { type: "move", id: "tower" },
      { type: "investigate" },
      { type: "move", id: "alley" },
    );
    s.player.talents = [];
    s.player.origin = "scholar";
    s = transition(s, { type: "track", id: "observe" });
    expect(s.quest.stage).toBe("trail");
    expect(s.flags.trusted_clue).toBe(true);
    s = transition(s, { type: "track", id: "observe" });
    expect(s.quest.stage).toBe("dock");
  });
  it("武器倾向有对应初始武器与武学", () => {
    const s = createCharacter("林照晚", "hunter", ["strong", "bright"], "刀");
    expect(s.equipped.weapon).toBe("saber");
    expect(s.activeArt).toBe("saberArt");
    expect(s.player.stats.agility).toBe(68);
    expect(s.player.hp).toBe(derived(s).maxHp);
  });
  it("套装和强化实际改变派生属性，材料不足不扣费", () => {
    let s = start();
    s.inventory.boots = 1;
    const hp = derived(s).maxHp;
    s = transition(s, { type: "equip", id: "boots" });
    expect(derived(s).maxHp).toBe(hp + 30);
    s.location = "smith";
    const atk = derived(s).attack;
    s = transition(s, { type: "upgrade", id: "oldSword" });
    expect(derived(s).attack).toBe(atk + 3);
    const money = s.player.silver;
    s = transition(s, { type: "upgrade", id: "oldSword" });
    expect(s.player.silver).toBe(money);
  });
  it("赠礼每日限一次，未拥有物品不增加关系", () => {
    let s = start();
    s.location = "inn";
    s.time = 1;
    s.inventory.wine = 2;
    s = transition(s, { type: "gift", id: "suwan" });
    const favor = s.relationships.suwan.favor;
    s = transition(s, { type: "gift", id: "suwan" });
    expect(s.relationships.suwan.favor).toBe(favor);
    expect(s.inventory.wine).toBe(1);
  });
  it("深夜客栈打烊，NPC按日程换地点", () => {
    let s = start();
    s.location = "inn";
    s.time = 5;
    const silver = s.player.silver;
    s = transition(s, { type: "buy", id: "wine" });
    expect(s.player.silver).toBe(silver);
    s = transition(s, { type: "talk", id: "suwan" });
    expect(s.lastMessage).toContain("不在这里");
  });
  it("状态转换不会修改输入对象", () => {
    const s = start(),
      copy = structuredClone(s);
    transition(s, { type: "move", id: "office" });
    expect(s).toEqual(copy);
  });
  it("突破条件包括悟性、熟练与江湖经历", () => {
    let s = start();
    s.arts.swordArt = 85;
    s.player.stats.insight = 70;
    s.flags.spars = 2;
    s = transition(s, { type: "breakthrough", id: "swordArt" });
    expect(s.flags.break_swordArt).toBeUndefined();
    s.flags.spars = 3;
    s = transition(s, { type: "breakthrough", id: "swordArt" });
    expect(s.flags.break_swordArt).toBe(true);
    const spirit = s.player.stats.spirit;
    s = transition(s, { type: "breakthrough", id: "swordArt" });
    expect(s.player.stats.spirit).toBe(spirit);
  });
  it("条件引擎支持物品、属性、时辰、关系和身份", () => {
    const s = start();
    expect(
      meets(s, { item: ["medicine", 2], minStat: ["root", 60], period: [2] }),
    ).toBe(true);
    expect(meets(s, { identity: true })).toBe(false);
    expect(meets(s, { relation: ["lu", 30] })).toBe(false);
  });
});
describe("可恢复与可校验的存档", () => {
  it("战斗中存读档能精确续接回合", () => {
    let s = battle();
    s = transition(s, { type: "fight", id: "art" });
    const record = parseSave(
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        state: s,
      }),
    );
    expect(record.state).toEqual(s);
    expect(transition(record.state, { type: "fight", id: "attack" })).toEqual(
      transition(s, { type: "fight", id: "attack" }),
    );
  });
  it("任务每个关键阶段都满足存档约束", () => {
    for (const s of [start(), prepared(), battle(), defeated()])
      expect(validState(s)).toBe(true);
  });
  it("损坏与旧版本的存档被拒绝", () => {
    expect(() => parseSave("{bad")).toThrow();
    expect(() =>
      parseSave(JSON.stringify({ version: 2, state: start() })),
    ).toThrow();
    const s = start();
    (s as any).inventory = { medicine: "999" };
    expect(validState(s)).toBe(false);
  });
  it("缺少核心属性或战斗状态不一致的存档被拒绝", () => {
    const s = start();
    delete (s.player.stats as any).root;
    expect(validState(s)).toBe(false);
    const other = start();
    other.quest.stage = "combat";
    expect(validState(other)).toBe(false);
  });
});
