import type { Cultivation } from "./engine/cultivation";
export type Stats = {
  root: number;
  insight: number;
  agility: number;
  spirit: number;
};
export type QuestStage =
  | "locked"
  | "available"
  | "prepare"
  | "investigate"
  | "trail"
  | "dock"
  | "combat"
  | "defeated"
  | "captured"
  | "completed"
  | "failed";
export type Relation = {
  favor: number;
  trust: number;
  met: boolean;
  memories: string[];
};
export type GameState = {
  version: 1;
  started: boolean;
  cultivation: Cultivation;
  life: { startAt: number; startAge: number; ended: boolean };
  battle: {
    strategy: "balanced" | "offense" | "guarded";
    medicine: boolean;
    speed: 1 | 2 | 4;
  };
  living: {
    xp: { herbalism: number; smithing: number; fishing: number };
    orders: Record<string, number>;
    gathered: number;
    crafted: number;
    delivered: number;
  };
  sect: {
    id: string | null;
    name: string;
    rank: number;
    contribution: number;
    merit: number;
    daily: Record<string, number>;
    claimedFloor: number;
    estate: number;
    disciples: number;
  };
  trial: {
    highest: number;
    wins: number;
    marks: number;
    potential: number;
    rewarded: Record<string, number>;
    result: null | {
      floor: number;
      outcome: "win" | "loss" | "retreat";
      text: string;
    };
  };
  player: {
    gender: "male" | "female";
    name: string;
    origin: string;
    talents: string[];
    weapon: string;
    stats: Stats;
    hp: number;
    qi: number;
    silver: number;
    fame: number;
    morality: number;
  };
  location: string;
  time: number;
  inventory: Record<string, number>;
  equipped: Record<string, string>;
  upgrades: Record<string, number>;
  arts: Record<string, number>;
  activeArt: string;
  relationships: Record<string, Relation>;
  flags: Record<string, boolean | number | string>;
  identity: {
    rank: number;
    reputation: number;
    contribution: number;
    wins: number;
    losses: number;
  };
  quest: {
    stage: QuestStage;
    acceptedAt: number;
    clues: string[];
    controls: string[];
    failure: string;
  };
  combat: null | {
    kind?: "trial";
    floor?: number;
    advantage?: boolean;
    hp: number;
    maxHp: number;
    round: number;
    guarded: boolean;
    logs: string[];
  };
  activeEvent: string | null;
  journal: { time: number; text: string }[];
  lastMessage: string;
};
export type Condition = {
  minRealm?: number;
  flag?: string;
  notFlag?: string;
  minStat?: [keyof Stats, number];
  item?: [string, number];
  relation?: [string, number];
  identity?: boolean;
  stage?: QuestStage;
  period?: number[];
};
export type Effect = {
  silver?: number;
  hp?: number;
  qi?: number;
  fame?: number;
  morality?: number;
  item?: [string, number];
  relation?: [string, number, number];
  flag?: [string, boolean | number | string];
  art?: [string, number];
};
export type StoryEvent = {
  id: string;
  location: string;
  title: string;
  text: string;
  conditions: Condition;
  choices: {
    id: string;
    text: string;
    hint: string;
    requirements?: Condition;
    effects: Effect[];
    result: string;
    nextEvent?: string;
  }[];
};
export type NPC = {
  id: string;
  name: string;
  role: string;
  gender: string;
  age: number;
  faction: string;
  portrait: number;
  location: string;
  tags: string[];
  description: string;
  quote: string;
  gift: string;
  greeting: string;
  nightLocation?: string;
  category: string;
};
export type Item = {
  id: string;
  name: string;
  kind: "装备" | "消耗" | "材料" | "任务";
  icon: string;
  description: string;
  price: number;
  slot?: string;
  attack?: number;
  defense?: number;
  hp?: number;
  quality?: string;
};

export type Page =
  | "jianghu"
  | "character"
  | "npc"
  | "arts"
  | "inventory"
  | "map"
  | "quest"
  | "identity"
  | "journal"
  | "trial"
  | "guide"
  | "living"
  | "calendar"
  | "sect";
