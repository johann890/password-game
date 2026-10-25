import { MONTHS, MOON_PHASES, WEEKDAYS_SHORT, WORDS, noTripleLetter } from './data';
import { pick, randInt, rngFromSeed, sample } from './rng';
import type { DayContext } from './types';

/** Puzzle #1. Everything is numbered from here. */
export const EPOCH = '2026-10-25';

const DAY_MS = 86_400_000;

/** Parse YYYY-MM-DD as a timezone-independent day number. */
function toUtcDays(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Local calendar date of a Date, as YYYY-MM-DD. Never shifts across timezones. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function puzzleIndex(date: string): number {
  return toUtcDays(date) - toUtcDays(EPOCH) + 1;
}

/** The inverse: which date is puzzle number n. Used to list the archive. */
export function dateForIndex(index: number): string {
  const [y, m, d] = EPOCH.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + index - 1)).toISOString().slice(0, 10);
}

/** Milliseconds until the next local midnight — drives the countdown timer. */
export function msUntilTomorrow(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Moon phase emoji, from the mean synodic month. Accurate to within a day. */
function moonPhase(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const known = Date.UTC(2000, 0, 6, 18, 14); // a new moon
  const days = (Date.UTC(y, m - 1, d, 12) - known) / DAY_MS;
  const age = ((days % 29.530588853) + 29.530588853) % 29.530588853;
  const slot = Math.floor((age / 29.530588853) * 8 + 0.5) % 8;
  return MOON_PHASES[slot];
}

/**
 * A pleasant, readable colour of the day. Hex codes that repeat a letter three
 * times are rerolled so the colour rule can coexist with the repeat-limit rule.
 */
function colorOfDay(seed: string): string {
  const rng = rngFromSeed(`color:${seed}`);
  for (let attempt = 0; attempt < 50; attempt++) {
    const hex = randomColor(rng);
    if (noTripleLetter(hex.slice(1))) return hex;
  }
  return '#3366CC';
}

function randomColor(rng: ReturnType<typeof rngFromSeed>): string {
  const h = randInt(rng, 0, 359);
  const s = randInt(rng, 55, 85) / 100;
  const l = randInt(rng, 45, 62) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

export function buildDayContext(date: string): DayContext {
  const [year, month, day] = date.split('-').map(Number);
  const rng = rngFromSeed(`ctx:${date}`);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  // Distinct letters only: a code like AAB would need three capital As,
  // which the repeat-limit rule can forbid.
  const letters = 'ABCDEFGHJKLMNPRSTUVWY'.split('');
  const code = sample(rng, letters, 3).join('');
  return {
    date,
    index: puzzleIndex(date),
    day,
    month,
    year,
    weekdayShort: WEEKDAYS_SHORT[weekday],
    monthName: MONTHS[month - 1],
    word: pick(rng, WORDS),
    color: colorOfDay(date),
    moon: moonPhase(date),
    code,
  };
}
