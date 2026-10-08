import type { GameState } from "../types";

export const TICKS_PER_DAY = 6;
export const DAYS_PER_YEAR = 360;
export const TICKS_PER_YEAR = TICKS_PER_DAY * DAYS_PER_YEAR;
const epochDay = 8 * 30 + 6; // 大胤十二年九月七日
export const calendar = (time: number) => {
  const days = epochDay + Math.floor(time / TICKS_PER_DAY);
  const month = Math.floor((days % DAYS_PER_YEAR) / 30) + 1;
  return {
    year: 12 + Math.floor(days / DAYS_PER_YEAR),
    month,
    day: (days % 30) + 1,
    season: ["春", "夏", "秋", "冬"][Math.floor((month - 1) / 3)],
    period: time % 6,
  };
};
export const initialLife = (time = 2) => ({
  startAt: time,
  startAge: 17,
  ended: false,
});
export const lifespanByRealm = [
  80, 80, 82, 84, 87, 90, 95, 100, 110, 120, 150, 200, 300, 500, 1000,
];
export function lifeInfo(s: GameState) {
  const elapsed = Math.max(0, s.time - s.life.startAt);
  const age = s.life.startAge + Math.floor(elapsed / TICKS_PER_YEAR);
  const lifespan = lifespanByRealm[s.cultivation.realm];
  const endAt = s.life.startAt + (lifespan - s.life.startAge) * TICKS_PER_YEAR;
  return {
    age,
    lifespan,
    endAt,
    remainingDays: Math.max(0, Math.ceil((endAt - s.time) / 6)),
    nextBirthdayDays: Math.ceil(
      (TICKS_PER_YEAR - (elapsed % TICKS_PER_YEAR)) / 6,
    ),
    years: Math.floor(elapsed / TICKS_PER_YEAR),
  };
}
export const timedCase = (s: GameState) =>
  !["locked", "available", "completed", "failed"].includes(s.quest.stage);
