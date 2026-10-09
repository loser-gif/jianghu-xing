import { initialLife } from "./calendar";
import { initialBattle } from "./autobattle";
import { initialLiving } from "./living";
import { initialSect } from "./sect";
import { sects, sectDailyKeys } from "../data/sects";
import type { GameState } from "../types";
import { locations, items, arts, npcs } from "../data/world";
import { events } from "../data/events";
import { initialCultivation } from "./cultivation";
import { initialTrial } from "./trial";
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
  if (
    v.player.gender !== undefined &&
    !["male", "female"].includes(String(v.player.gender))
  )
    return false;
  if (v.cultivation !== undefined) {
    const c = v.cultivation;
    if (
      !isObject(c) ||
      !["realm", "xp", "total", "insights", "day", "sessions"].every(
        (k) => typeof c[k] === "number" && Number.isSafeInteger(c[k]),
      ) ||
      Number(c.realm) < 0 ||
      Number(c.realm) > 14 ||
      Number(c.xp) < 0 ||
      Number(c.total) < Number(c.xp) ||
      Number(c.insights) < 0 ||
      Number(c.day) < -1 ||
      Number(c.sessions) < 0
    )
      return false;
  }
  if (
    v.life !== undefined &&
    (!isObject(v.life) ||
      !Number.isSafeInteger(v.life.startAt) ||
      Number(v.life.startAt) < 0 ||
      Number(v.life.startAt) > Number(v.time) ||
      !Number.isSafeInteger(v.life.startAge) ||
      Number(v.life.startAge) < 1 ||
      Number(v.life.startAge) > 79 ||
      typeof v.life.ended !== "boolean")
  )
    return false;
  if (
    v.battle !== undefined &&
    (!isObject(v.battle) ||
      !["balanced", "offense", "guarded"].includes(String(v.battle.strategy)) ||
      typeof v.battle.medicine !== "boolean" ||
      typeof v.battle.speed !== "number" ||
      ![1, 2, 4].includes(v.battle.speed))
  )
    return false;
  if (v.living !== undefined) {
    const l = v.living;
    if (
      !isObject(l) ||
      !numbers(l.xp) ||
      !["herbalism", "smithing", "fishing"].every((k) =>
        Number.isSafeInteger((l.xp as Record<string, number>)[k]),
      ) ||
      !numbers(l.orders) ||
      !Object.entries(l.orders as Record<string, number>).every(
        ([k, d]) =>
          ["clinic", "forge", "inn"].includes(k) && Number.isSafeInteger(d),
      ) ||
      !["gathered", "crafted", "delivered"].every(
        (k) => Number.isSafeInteger(l[k]) && Number(l[k]) >= 0,
      )
    )
      return false;
  }
  const p = v.player,
    q = v.quest;
  if (v.sect !== undefined) {
    const t = v.sect;
    if (
      !isObject(t) ||
      !(t.id === null || t.id === "own" || sects.some((x) => x.id === t.id)) ||
      typeof t.name !== "string" ||
      t.name.length > 8 ||
      ![
        "rank",
        "contribution",
        "merit",
        "claimedFloor",
        "estate",
        "disciples",
      ].every((k) => Number.isSafeInteger(t[k]) && Number(t[k]) >= 0) ||
      Number(t.rank) > 3 ||
      Number(t.contribution) > Number(t.merit) ||
      Number(t.claimedFloor) > 30 ||
      Number(t.estate) > 3 ||
      Number(t.disciples) > Number(t.estate) * 3 ||
      !numbers(t.daily) ||
      !Object.entries(t.daily as Record<string, number>).every(
        ([k, d]) =>
          sectDailyKeys.includes(k) &&
          Number.isSafeInteger(d) &&
          d <= Math.floor(Number(v.time) / 6),
      )
    )
      return false;
    if (t.id === "own") {
      if (
        t.rank !== 3 ||
        Number(t.estate) < 1 ||
        !/^[\p{Script=Han}A-Za-z0-9]{2,8}$/u.test(t.name)
      )
        return false;
    } else if (
      t.estate !== 0 ||
      t.disciples !== 0 ||
      (t.id === null &&
        (t.rank !== 0 ||
          t.name !== "" ||
          t.contribution !== 0 ||
          t.merit !== 0)) ||
      (t.id !== null && !sects.some((x) => x.id === t.id && x.name === t.name))
    )
      return false;
  }
  if (v.trial !== undefined) {
    const t = v.trial;
    if (
      !isObject(t) ||
      !["highest", "wins", "marks", "potential"].every(
        (k) => Number.isSafeInteger(t[k]) && Number(t[k]) >= 0,
      ) ||
      Number(t.highest) > 30 ||
      !numbers(t.rewarded) ||
      !Object.entries(t.rewarded as Record<string, number>).every(
        ([floor, day]) =>
          /^([1-9]|[12][0-9]|30)$/.test(floor) && Number.isSafeInteger(day),
      ) ||
      !(
        t.result === null ||
        (isObject(t.result) &&
          Number.isInteger(t.result.floor) &&
          Number(t.result.floor) >= 1 &&
          Number(t.result.floor) <= 30 &&
          ["win", "loss", "retreat"].includes(String(t.result.outcome)) &&
          typeof t.result.text === "string")
      )
    )
      return false;
  }
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
    !Object.values(v.flags).every(
      (f) =>
        ["boolean", "string", "number"].includes(typeof f) &&
        (typeof f !== "number" || Number.isFinite(f)),
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
    if (c.kind !== undefined && c.kind !== "trial") return false;
    if (
      c.kind === "trial" &&
      (!isObject(v.trial) ||
        !Number.isInteger(c.floor) ||
        Number(c.floor) < 1 ||
        Number(c.floor) > 30 ||
        Number(c.floor) > Number(v.trial.highest) + 1 ||
        typeof c.advantage !== "boolean" ||
        Number(c.round) < 1 ||
        Number(c.hp) <= 0 ||
        Number(c.hp) > Number(c.maxHp))
    )
      return false;
  }
  const trialCombat = isObject(v.combat) && v.combat.kind === "trial";
  if (
    trialCombat &&
    !["locked", "available", "completed", "failed"].includes(String(q.stage))
  )
    return false;
  if ((q.stage === "combat") !== (v.combat !== null && !trialCombat))
    return false;
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
  const s = data.state as GameState;
  if (!s.trial) s.trial = initialTrial();
  if (!s.life) s.life = initialLife(s.time);
  if (!s.battle) s.battle = initialBattle();
  if (!s.living) s.living = initialLiving();
  if (!s.sect) s.sect = initialSect(s.trial.highest);
  if (!s.player.gender) {
    s.player.gender = "male";
    s.flags.appearance_chosen = false;
  }
  if (!s.cultivation) {
    s.cultivation = initialCultivation();
    const experience = Math.max(0, Number(s.flags.spars) || 0);
    const insights =
      events.filter((e) => !!s.flags[e.id]).length +
      (s.flags.case_completed ? 2 : 0);
    const credit = Math.floor(
      Math.min(
        500,
        Object.values(s.arts).reduce((a, b) => a + b, 0) +
          experience * 8 +
          insights * 18,
      ),
    );
    s.cultivation.xp = credit;
    s.cultivation.total = credit;
    s.cultivation.insights = insights;
    s.flags.prologue_done = true;
    s.flags.guide_dismissed = true;
  }
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
