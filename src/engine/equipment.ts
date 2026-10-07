import { derived } from "./game";
import { items } from "../data/world";
import type { GameState, Item } from "../types";

/** Preview the same derived attributes used after equipping, without changing a save. */
export function equipmentPreview(state: GameState, item: Item) {
  if (!item.slot) return null;
  const before = derived(state);
  const after = derived({
    ...state,
    equipped: { ...state.equipped, [item.slot]: item.id },
  });
  return {
    current: items.find((i) => i.id === state.equipped[item.slot!]),
    before,
    after,
    changes: [
      { label: "外功", before: before.attack, after: after.attack },
      { label: "防御", before: before.defense, after: after.defense },
      { label: "气血上限", before: before.maxHp, after: after.maxHp },
    ],
  };
}
