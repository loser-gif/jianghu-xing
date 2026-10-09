import { describe, it, expect } from "vitest";
import { createCharacter, derived, transition } from "../src/engine/game";
import { forgedItems, forgeRecipes } from "../src/data/forge";
import { items } from "../src/data/world";
import { weaponFits } from "../src/data/trial";
import { equipmentPreview } from "../src/engine/equipment";
import { parseSave } from "../src/engine/storage";
import { lifeInfo } from "../src/engine/calendar";
const ready = () => {
  const s = createCharacter("铸器", "escort", [], "剑");
  s.location = "smith";
  s.living.xp.smithing = 120;
  s.cultivation.realm = 5;
  s.trial.highest = 10;
  s.inventory.ore = 100;
  s.inventory.iron = 100;
  s.player.silver = 2000;
  return s;
};
describe("百炼坊", () => {
  it.each(forgeRecipes)(
    "$id 锻造扣料、耗时、增加熟练，只产一件且不替换穿戴",
    (r) => {
      const s = ready(),
        n = transition(s, { type: "forgeCraft", id: r.id });
      expect(n.inventory[r.id]).toBe(1);
      expect(n.inventory.ore).toBe(100 - r.ore);
      expect(n.inventory.iron).toBe(100 - r.iron);
      expect(n.player.silver).toBe(2000 - r.silver);
      expect(n.time).toBe(s.time + 2);
      expect(n.living.xp.smithing).toBe(132);
      expect(n.equipped).toEqual(s.equipped);
      expect(n.upgrades[r.id]).toBe(0);
      const again = transition(n, { type: "forgeCraft", id: r.id });
      expect(again.inventory).toEqual(n.inventory);
      expect(again.player.silver).toBe(n.player.silver);
      expect(again.time).toBe(n.time);
      expect(
        parseSave(
          JSON.stringify({
            version: 1,
            savedAt: new Date().toISOString(),
            state: n,
          }),
        ).state.inventory,
      ).toEqual(n.inventory);
    },
  );
  it("每条配方门槛均阻止扣料，熟手护具可在名匠之前打造", () => {
    const edits = [
      (s: ReturnType<typeof ready>) => (s.living.xp.smithing = 119),
      (s: ReturnType<typeof ready>) => (s.cultivation.realm = 4),
      (s: ReturnType<typeof ready>) => (s.trial.highest = 9),
      (s: ReturnType<typeof ready>) => (s.inventory.ore = 11),
      (s: ReturnType<typeof ready>) => (s.inventory.iron = 7),
      (s: ReturnType<typeof ready>) => (s.player.silver = 239),
    ];
    for (const edit of edits) {
      const s = ready();
      edit(s);
      const n = transition(s, { type: "forgeCraft", id: "deepSword" });
      expect(n.inventory).toEqual(s.inventory);
      expect(n.player.silver).toBe(s.player.silver);
      expect(n.time).toBe(s.time);
    }
    const s = ready();
    s.living.xp.smithing = 60;
    s.cultivation.realm = 3;
    s.trial.highest = 5;
    expect(
      transition(s, { type: "forgeCraft", id: "tideRobe" }).inventory.tideRobe,
    ).toBe(1);
  });
  it("异地、案件、交锋、际遇与寿尽阻止开炉和传承", () => {
    const edits = [
      (s: ReturnType<typeof ready>) => (s.location = "lake"),
      (s: ReturnType<typeof ready>) => (s.quest.stage = "prepare"),
      (s: ReturnType<typeof ready>) => (s.activeEvent = "test"),
      (s: ReturnType<typeof ready>) => (s.life.ended = true),
      (s: ReturnType<typeof ready>) =>
        (s.combat = {
          kind: "trial",
          floor: 1,
          hp: 50,
          maxHp: 85,
          round: 1,
          guarded: false,
          logs: [],
        }),
    ];
    for (const edit of edits) {
      const s = ready();
      s.inventory.deepSword = 1;
      s.upgrades.oldSword = 5;
      edit(s);
      for (const a of [
        { type: "forgeCraft", id: "tideRobe" } as const,
        { type: "forgeTransfer", from: "oldSword", to: "deepSword" } as const,
      ]) {
        const n = transition(s, a);
        expect(n.inventory).toEqual(s.inventory);
        expect(n.upgrades).toEqual(s.upgrades);
        expect(n.time).toBe(s.time);
      }
    }
  });
  it("强化传承保留器甲，等级转移不叠加，二次点击无重复扣费", () => {
    const s = ready();
    s.inventory.deepSword = 1;
    s.upgrades.oldSword = 5;
    s.upgrades.deepSword = 2;
    const n = transition(s, {
      type: "forgeTransfer",
      from: "oldSword",
      to: "deepSword",
    });
    expect(n.upgrades.oldSword).toBe(0);
    expect(n.upgrades.deepSword).toBe(5);
    expect(n.inventory.oldSword).toBe(s.inventory.oldSword);
    expect(n.equipped).toEqual(s.equipped);
    expect(n.player.silver).toBe(1950);
    expect(n.inventory.iron).toBe(98);
    expect(n.time).toBe(s.time + 1);
    const again = transition(n, {
      type: "forgeTransfer",
      from: "oldSword",
      to: "deepSword",
    });
    expect(again.player.silver).toBe(n.player.silver);
    expect(again.upgrades).toEqual(n.upgrades);
    const equipped = transition(n, { type: "equip", id: "deepSword" });
    expect(derived(equipped).attack - derived(s).attack).toBe(30);
  });
  it("不能跨部位、同件、无持有、低等级覆盖高等级或材料不足传承", () => {
    for (const mode of ["slot", "same", "missing", "level", "silver", "iron"]) {
      const s = ready();
      s.inventory.deepSword = 1;
      s.upgrades.oldSword = 3;
      let to = "deepSword";
      if (mode === "slot") to = "robe";
      if (mode === "same") to = "oldSword";
      if (mode === "missing") s.inventory.deepSword = 0;
      if (mode === "level") s.upgrades.deepSword = 4;
      if (mode === "silver") s.player.silver = 49;
      if (mode === "iron") s.inventory.iron = 1;
      const n = transition(s, { type: "forgeTransfer", from: "oldSword", to });
      expect(n.upgrades).toEqual(s.upgrades);
      expect(n.inventory).toEqual(s.inventory);
      expect(n.time).toBe(s.time);
    }
  });
  it("护具套装对比与实际相符，换下失效，传承降低上限时夹紧气血", () => {
    let s = ready();
    s.inventory.tideRobe = 1;
    s.inventory.tideBoots = 1;
    s = transition(s, { type: "equip", id: "tideRobe" });
    const before = derived(s);
    const p = equipmentPreview(
      s,
      items.find((i) => i.id === "tideBoots")!,
    )!;
    s = transition(s, { type: "equip", id: "tideBoots" });
    expect(derived(s)).toEqual(p.after);
    expect(derived(s).tideSet).toBe(true);
    expect(derived(s).maxHp - before.maxHp).toBe(80);
    expect(derived(s).defense - before.defense).toBe(11);
    s.upgrades.tideRobe = 5;
    s.player.hp = derived(s).maxHp;
    const hp = s.player.hp;
    const n = transition(s, {
      type: "forgeTransfer",
      from: "tideRobe",
      to: "robe",
    });
    expect(n.player.hp).toBe(hp - 25);
    expect(n.player.hp).toBe(derived(n).maxHp);
    const off = transition(n, { type: "equip", id: "robe" });
    expect(derived(off).tideSet).toBe(false);
  });
  it("四类名匠兵器适配对应武学，均可强化至+5并保存", () => {
    for (const [id, art] of [
      ["deepSword", "swordArt"],
      ["tideSaber", "saberArt"],
      ["steelGlove", "fistArt"],
      ["darkFan", "fanArt"],
    ]) {
      let s = ready();
      s.inventory[id] = 1;
      for (let n = 0; n < 5; n++) s = transition(s, { type: "upgrade", id });
      expect(s.upgrades[id]).toBe(5);
      expect(weaponFits[art]).toContain(id);
      expect(
        parseSave(
          JSON.stringify({
            version: 1,
            savedAt: new Date().toISOString(),
            state: s,
          }),
        ).state.upgrades,
      ).toEqual(s.upgrades);
    }
    expect(forgedItems).toHaveLength(6);
  });
  it("锻造或传承途中寿尽回滚扣料和奖励，保存人生", () => {
    for (const type of ["forgeCraft", "forgeTransfer"] as const) {
      const s = ready();
      s.inventory.deepSword = 1;
      s.upgrades.oldSword = 5;
      s.time = lifeInfo(s).endAt - 1;
      const n = transition(
        s,
        type === "forgeCraft"
          ? { type, id: "tideRobe" }
          : { type, from: "oldSword", to: "deepSword" },
      );
      expect(n.life.ended).toBe(true);
      expect(n.inventory).toEqual(s.inventory);
      expect(n.upgrades).toEqual(s.upgrades);
      expect(n.player.silver).toBe(s.player.silver);
    }
  });
});
