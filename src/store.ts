import { create } from "zustand";
import type { GameState } from "./types";
import { freshState, transition, createCharacter } from "./engine/game";
import type { Action } from "./engine/game";
import { writeSave, readSave, parseSave } from "./engine/storage";
function initial() {
  try {
    return { game: readSave("auto")?.state || freshState(), storageError: "" };
  } catch {
    return {
      game: freshState(),
      storageError: "自动存档无法读取，原存档已保留。可尝试读取手动存档。",
    };
  }
}
export const useGame = create<{
  game: GameState;
  storageError: string;
  act: (a: Action) => void;
  start: (
    name: string,
    origin: string,
    talents: string[],
    weapon: string,
  ) => void;
  save: (slot: string) => boolean;
  load: (slot: string) => boolean;
  importSave: (text: string) => boolean;
}>((set, get) => ({
  ...initial(),
  act: (a) => {
    const game = transition(get().game, a);
    let storageError = "";
    try {
      writeSave("auto", game);
    } catch {
      storageError = "自动保存失败，请导出存档以保留进度。";
    }
    set({ game, storageError });
  },
  start: (name, origin, talents, weapon) => {
    const game = createCharacter(name, origin, talents, weapon);
    let storageError = "";
    try {
      if (get().game.started) writeSave("previous", get().game);
      writeSave("auto", game);
    } catch {
      storageError = "保存空间不可用，请导出存档。";
    }
    set({ game, storageError });
  },
  save: (slot) => {
    try {
      writeSave(slot, get().game);
      set({ storageError: "" });
      return true;
    } catch {
      set({ storageError: "保存失败，请导出存档。" });
      return false;
    }
  },
  load: (slot) => {
    try {
      const record = readSave(slot);
      if (!record) throw new Error("这个存档位尚未落笔。");
      writeSave("auto", record.state);
      set({ game: record.state, storageError: "" });
      return true;
    } catch (e) {
      set({ storageError: e instanceof Error ? e.message : "读取失败。" });
      return false;
    }
  },
  importSave: (raw) => {
    try {
      const record = parseSave(raw);
      if (get().game.started) writeSave("previous", get().game);
      writeSave("auto", record.state);
      set({ game: record.state, storageError: "" });
      return true;
    } catch (e) {
      set({ storageError: e instanceof Error ? e.message : "导入失败。" });
      return false;
    }
  },
}));
