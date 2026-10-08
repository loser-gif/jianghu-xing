import { describe, expect, it } from "vitest";
import { createCharacter, derived, transition } from "../src/engine/game";
import { parseSave, validState } from "../src/engine/storage";
import { trialIntent } from "../src/engine/trial";
import { trialFloors } from "../src/data/trial";
import { recommend } from "../src/engine/guidance";
import type { GameState } from "../src/types";
const start = (weapon = "剑") =>
  createCharacter("试剑", "escort", ["careful", "sword"], weapon);
const enter = (s: GameState, floor = 1) =>
  transition(s, { type: "trialEnter", floor });
function win(s: GameState) {
  for (let i = 0; i < 100 && s.combat; i++) {
    const intent = trialIntent(s.combat.floor!, s.combat.round);
    s = transition(s, {
      type: "fight",
      id:
        intent.kind === "heavy"
          ? "defend"
          : s.player.qi >= 12
            ? "art"
            : "attack",
    });
  }
  return s;
}
const saved = (s: unknown) =>
  JSON.stringify({ version: 1, savedAt: "2026-10-08", state: s });

describe("试炼塔与成长闭环", () => {
  it.each(["剑", "刀", "拳掌", "奇门"])(
    "初始%s可通过第一层且不改变案件状态",
    (weapon) => {
      const s = win(enter(start(weapon)));
      expect(s.combat).toBeNull();
      expect(s.trial.highest).toBe(1);
      expect(s.trial.marks).toBe(1);
      expect(s.inventory.iron).toBe(3);
      expect(s.cultivation.xp).toBe(trialFloors[0].xp);
      expect(s.quest.stage).toBe("locked");
      expect(validState(s)).toBe(true);
    },
  );
  it("拒绝跨层、异地、低血量、计时案件和交锋中的其他操作", () => {
    const s = start();
    expect(enter(s, 2).combat).toBeNull();
    expect(enter({ ...s, location: "inn" }).combat).toBeNull();
    s.player.hp = 1;
    expect(enter(s).combat).toBeNull();
    s.player.hp = derived(s).maxHp;
    s.quest.stage = "prepare";
    expect(enter(s).combat).toBeNull();
    s.quest.stage = "locked";
    const c = enter(s);
    expect(transition(c, { type: "move", id: "herb" }).location).toBe("lake");
    expect(
      transition(c, { type: "trialExchange", id: "medicine" }).combat,
    ).toEqual(c.combat);
  });
  it("首通不可重复领取，同日复战奖励受限，次日恢复少量奖励", () => {
    let s = win(enter(start()));
    const marks = s.trial.marks,
      iron = s.inventory.iron;
    let xp = s.cultivation.xp;
    s = win(enter(s));
    expect(s.cultivation.xp).toBe(xp);
    expect(s.trial.marks).toBe(marks);
    expect(s.inventory.iron).toBe(iron);
    s.time = 6;
    s.player.hp = derived(s).maxHp;
    s = win(enter(s));
    expect(s.cultivation.xp).toBe(xp + Math.floor(trialFloors[0].xp / 4));
    xp = s.cultivation.xp;
    expect(transition(s, { type: "fight", id: "attack" }).cultivation.xp).toBe(
      xp,
    );
  });
  it("防御化解重击后产生一次反击，正常攻击消耗该机会", () => {
    let s = enter(start());
    s.combat!.round = 2;
    const hp = s.player.hp;
    s = transition(s, { type: "fight", id: "defend" });
    expect(s.player.hp).toBeGreaterThan(hp - 10);
    expect(s.combat!.advantage).toBe(true);
    s.combat!.hp = 1000;
    s.combat!.maxHp = 1000;
    const without = structuredClone(s);
    without.combat!.advantage = false;
    const a = transition(s, { type: "fight", id: "attack" });
    const b = transition(without, { type: "fight", id: "attack" });
    expect(a.combat!.hp).toBeLessThan(b.combat!.hp);
    expect(a.combat!.advantage).toBe(false);
  });
  it("武学破守与兵器适配生效；无效行动不跳回合", () => {
    const s = enter(start());
    const attack = transition(s, { type: "fight", id: "attack" });
    const art = transition(s, { type: "fight", id: "art" });
    expect(art.combat!.hp).toBeLessThan(attack.combat!.hp);
    const mismatch = structuredClone(s);
    mismatch.equipped.weapon = "saber";
    expect(
      transition(mismatch, { type: "fight", id: "art" }).combat!.hp,
    ).toBeGreaterThan(art.combat!.hp);
    expect(transition(s, { type: "fight", id: "invalid" }).combat!.round).toBe(
      1,
    );
    expect(transition(s, { type: "fight", id: "light" }).combat!.round).toBe(1);
    s.player.qi = 0;
    expect(transition(s, { type: "fight", id: "art" }).combat!.round).toBe(1);
  });
  it("撤离与落败保留物品、通关和案件进度", () => {
    const s = enter(start());
    const retreat = transition(s, { type: "fight", id: "escape" });
    expect(retreat.combat).toBeNull();
    expect(retreat.trial.result!.outcome).toBe("retreat");
    s.player.hp = 2;
    const lost = transition(s, { type: "fight", id: "defend" });
    expect(lost.combat).toBeNull();
    expect(lost.player.hp).toBe(1);
    expect(lost.trial.result!.outcome).toBe("loss");
    expect(lost.inventory).toEqual(s.inventory);
    expect(lost.quest).toEqual(s.quest);
  });
  it("全30层与六个首领奖励可结算，30层为上限", () => {
    let s = start();
    s.cultivation.realm = 14;
    s.player.stats.root = 300;
    for (let floor = 1; floor <= 30; floor++) {
      s.player.hp = derived(s).maxHp;
      s.player.qi = derived(s).maxQi;
      s = win(enter(s, floor));
      expect(s.trial.highest).toBe(floor);
    }
    expect(s.trial.potential).toBe(24);
    expect(s.cultivation.insights).toBe(6);
    expect(s.trial.marks).toBe(42);
    expect(enter(s, 31).combat).toBeNull();
  });
  it("兑换按真实持有扣款且不能重复学技能，潜能分配有限", () => {
    let s = start();
    s.trial.marks = 8;
    s = transition(s, { type: "trialExchange", id: "lightArt" });
    expect(s.arts.lightArt).toBe(10);
    expect(s.trial.marks).toBe(3);
    expect(
      transition(s, { type: "trialExchange", id: "lightArt" }).trial.marks,
    ).toBe(3);
    s = transition(s, { type: "trialExchange", id: "boots" });
    expect(s.inventory.boots).toBe(1);
    expect(
      transition(s, { type: "trialExchange", id: "medicine" }).inventory
        .medicine,
    ).toBe(2);
    s.trial.potential = 1;
    const before = s.player.stats.spirit;
    s = transition(s, { type: "attribute", id: "spirit" });
    expect(s.player.stats.spirit).toBe(before + 1);
    expect(
      transition(s, { type: "attribute", id: "spirit" }).player.stats.spirit,
    ).toBe(before + 1);
  });
  it("防具强化改变派生属性但不回血，受材料与上限约束", () => {
    let s = start();
    s.location = "smith";
    const d = derived(s),
      hp = s.player.hp;
    s = transition(s, { type: "upgrade", id: "robe" });
    expect(derived(s).defense).toBe(d.defense + 2);
    expect(derived(s).maxHp).toBe(d.maxHp + 5);
    expect(s.player.hp).toBe(hp);
    expect(s.inventory.iron).toBe(0);
    expect(transition(s, { type: "upgrade", id: "robe" }).upgrades.robe).toBe(
      1,
    );
  });
  it("迁移旧存档并恢复试炼中途进度，拒绝错误楼层和冲突战斗", () => {
    const old = start() as Partial<GameState>;
    delete old.trial;
    expect(parseSave(saved(old)).state.trial.highest).toBe(0);
    const s = transition(enter(start()), { type: "fight", id: "art" });
    expect(parseSave(saved(s)).state).toEqual(s);
    s.combat!.floor = 31;
    expect(() => parseSave(saved(s))).toThrow();
    s.combat!.floor = 1;
    s.quest.stage = "combat";
    expect(validState(s)).toBe(false);
    s.quest.stage = "locked";
    s.trial.marks = -1;
    expect(validState(s)).toBe(false);
  });
  it("指引跟随新手、练习、试炼、受伤和案件状态变化", () => {
    const s = start();
    expect(recommend(s).page).toBe("inventory");
    s.flags.guide_equip = true;
    expect(recommend(s).page).toBe("arts");
    s.flags.guide_practice = true;
    expect(recommend(s).page).toBe("trial");
    s.player.hp = 1;
    expect(recommend(s).destination).toBe("herb");
    s.location = "herb";
    expect(recommend(s).heal).toBe(true);
    s.quest.stage = "trail";
    expect(recommend(s).page).toBe("quest");
  });
});

it("天生剑心在试炼中保留剑法伤害加成", () => {
  const a = start();
  const b = structuredClone(a);
  b.player.talents = b.player.talents.filter((t) => t !== "sword");
  const hitA = transition(enter(a), { type: "fight", id: "art" });
  const hitB = transition(enter(b), { type: "fight", id: "art" });
  expect(hitA.combat!.hp).toBeLessThan(hitB.combat!.hp);
});

it("初行指引在强化后继续指导第一次破境", () => {
  let s = win(enter(start()));
  s.flags.guide_equip = true;
  s.flags.guide_practice = true;
  s.location = "smith";
  s = transition(s, { type: "upgrade", id: "oldSword" });
  expect(recommend(s).title).toContain("九品");
  expect(recommend(s).page).toBe("arts");
});
