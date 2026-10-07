import { npcLocation } from "../data/world";
import type { GameState, NPC, Page } from "../types";

export function currentNpcLocation(npc: NPC, state: GameState) {
  if (npc.id === "gu") {
    if (state.quest.stage === "completed") return "office";
    if (state.quest.stage === "captured") return state.location;
  }
  return npcLocation(npc, state.time);
}

export type NpcService = {
  label: string;
  icon: string;
  page: Page;
  location?: string;
};

export function npcService(npc: NPC, state: GameState): NpcService {
  switch (npc.id) {
    case "suwan":
      return {
        label: "客栈歇脚",
        icon: "tea",
        page: "jianghu",
        location: "inn",
      };
    case "baizhi":
      return {
        label: "药庐疗伤",
        icon: "leaf",
        page: "jianghu",
        location: "herb",
      };
    case "shao":
      return {
        label: "锻造装备",
        icon: "hammer",
        page: "inventory",
        location: "smith",
      };
    case "lu":
      return {
        label: "身份司簿",
        icon: "shield",
        page: "identity",
        location: "office",
      };
    case "gu":
      return { label: "查看案情", icon: "scroll", page: "quest" };
    default:
      return {
        label: "请教武学",
        icon: "book",
        page: "arts",
        location: currentNpcLocation(npc, state),
      };
  }
}
