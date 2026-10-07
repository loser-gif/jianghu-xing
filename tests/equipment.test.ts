import { describe, expect, it } from "vitest";
import { createCharacter, derived, transition } from "../src/engine/game";
import { equipmentPreview } from "../src/engine/equipment";
import { items } from "../src/data/world";

const item = (id: string) => items.find((i) => i.id === id)!;
const start = () =>
  createCharacter("沈辞", "escort", ["careful", "sword"], "剑");

describe("换装预览", () => {
  it("两把兵器的强化等级不同，预览与实际换装一致且不修改存档", () => {
    const state = start();
    state.upgrades.oldSword = 5;
    state.upgrades.sword = 1;
    state.inventory.sword = 1;
    const saved = JSON.stringify(state);
    const preview = equipmentPreview(state, item("sword"))!;
    expect(preview.after.attack - preview.before.attack).toBe(-2);
    expect(JSON.stringify(state)).toBe(saved);
    expect(preview.after).toEqual(
      derived(transition(state, { type: "equip", id: "sword" })),
    );
  });
  it("补齐行云套装时计入额外气血，不直接恢复当前气血", () => {
    const state = start();
    state.inventory.boots = 1;
    const preview = equipmentPreview(state, item("boots"))!;
    expect(preview.after.maxHp - preview.before.maxHp).toBe(30);
    expect(preview.after.set).toBe(true);
    const equipped = transition(state, { type: "equip", id: "boots" });
    expect(preview.after).toEqual(derived(equipped));
    expect(equipped.player.hp).toBe(state.player.hp);
  });
  it("已穿戴的物品不产生变化，非装备不提供换装预览", () => {
    const state = start();
    const preview = equipmentPreview(state, item("oldSword"))!;
    expect(preview.before).toEqual(preview.after);
    expect(equipmentPreview(state, item("medicine"))).toBeNull();
  });
});
