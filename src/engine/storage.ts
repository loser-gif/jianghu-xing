import type { GameState } from "../types";
import { locations, items, arts, npcs } from "../data/world";
import { events } from "../data/events";
export const SAVE_PREFIX = "jianghu.v1.";
export type SaveRecord = { version: 1; savedAt: string; state: GameState };
function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
const numbers = (v: unknown) =>
  isObject(v) &&
  Object.values(v).every(
    (x) => typeof x === "number" && Number.isFinite(x) && x >= 0,
  );
export function validState(v: unknown): v is GameState {
  if (
    !isObject(v) ||
    v.version !== 1 ||
    v.started !== true ||
    !isObject(v.player) ||
    !isObject(v.quest) ||
    !isObject(v.identity) ||
    !isObject(v.relationships)
  )
    return false;
  const p = v.player,
    q = v.quest;
  if (
    typeof p.name !== "string" ||
    p.name.length > 12 ||
    typeof p.origin !== "string" ||
    typeof p.weapon !== "string" ||
    !Array.isArray(p.talents) ||
    !p.talents.every((t) => typeof t === "string") ||
    !numbers(p.stats) ||
    !["root", "insight", "agility", "spirit"].every(
      (k) => typeof (p.stats as Record<string, unknown>)[k] === "number",
    )
  )
    return false;
  if (
    !["hp", "qi", "silver", "fame", "morality"].every(
      (k) => typeof p[k] === "number" && Number.isFinite(p[k]),
    ) ||
    Number(p.hp) < 0 ||
    Number(p.qi) < 0 ||
    Number(p.silver) < 0
  )
    return false;
  if (
    !locations.some((l) => l.id === v.location) ||
    typeof v.time !== "number" ||
    !Number.isInteger(v.time) ||
    v.time < 0 ||
    !numbers(v.inventory) ||
    !numbers(v.upgrades) ||
    !numbers(v.arts) ||
    !isObject(v.equipped) ||
    !isObject(v.flags)
  )
    return false;
  if (
    !Object.keys(v.inventory as object).every((id) =>
      items.some((i) => i.id === id),
    ) ||
    !Object.keys(v.arts as object).every((id) =>
      arts.some((a) => a.id === id),
    ) ||
    !Object.values(v.equipped).every((id) => items.some((i) => i.id === id)) ||
    !arts.some((a) => a.id === v.activeArt)
  )
    return false;
  if (
    !Object.values(v.flags).every((f) =>
      ["boolean", "string", "number"].includes(typeof f),
    )
  )
    return false;
  if (
    !["rank", "reputation", "contribution", "wins", "losses"].every(
      (k) =>
        typeof (v.identity as Record<string, unknown>)[k] === "number" &&
        Number.isFinite((v.identity as Record<string, unknown>)[k]),
    )
  )
    return false;
  if (
    ![
      "locked",
      "available",
      "prepare",
      "investigate",
      "trail",
      "dock",
      "combat",
      "defeated",
      "captured",
      "completed",
      "failed",
    ].includes(String(q.stage)) ||
    typeof q.acceptedAt !== "number" ||
    typeof q.failure !== "string" ||
    !Array.isArray(q.clues) ||
    !q.clues.every((x) => typeof x === "string") ||
    !Array.isArray(q.controls) ||
    !q.controls.every((x) => ["hands", "legs", "alert"].includes(String(x))) ||
    new Set(q.controls).size !== q.controls.length
  )
    return false;
  if (
    !npcs.every((n) => {
      const r = (v.relationships as Record<string, unknown>)[n.id];
      return (
        isObject(r) &&
        typeof r.favor === "number" &&
        typeof r.trust === "number" &&
        typeof r.met === "boolean" &&
        Array.isArray(r.memories) &&
        r.memories.every((m) => typeof m === "string")
      );
    })
  )
    return false;
  if (
    !Array.isArray(v.journal) ||
    !v.journal.every(
      (j) =>
        isObject(j) && typeof j.time === "number" && typeof j.text === "string",
    ) ||
    typeof v.lastMessage !== "string"
  )
    return false;
  if (v.activeEvent !== null && !events.some((e) => e.id === v.activeEvent))
    return false;
  if (v.combat !== null) {
    const c = v.combat;
    if (
      !isObject(c) ||
      !["hp", "maxHp", "round"].every(
        (k) => typeof c[k] === "number" && Number.isFinite(c[k]),
      ) ||
      typeof c.guarded !== "boolean" ||
      !Array.isArray(c.logs) ||
      !c.logs.every((l) => typeof l === "string")
    )
      return false;
  }
  if ((q.stage === "combat") !== (v.combat !== null)) return false;
  return true;
}
export function parseSave(raw: string): SaveRecord {
  const data = JSON.parse(raw);
  if (
    !isObject(data) ||
    data.version !== 1 ||
    typeof data.savedAt !== "string" ||
    !validState(data.state)
  )
    throw new Error("存档格式不兼容或内容损坏。当前进度未被更改。");
  return data as SaveRecord;
}
export function writeSave(key: string, state: GameState) {
  localStorage.setItem(
    SAVE_PREFIX + key,
    JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state }),
  );
}
export function readSave(key: string): SaveRecord | null {
  const raw = localStorage.getItem(SAVE_PREFIX + key);
  return raw ? parseSave(raw) : null;
}
