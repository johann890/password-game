import type { PlayRecord } from './score';

const PROGRESS_KEY = 'passwordle.progress.v2';
const LEGACY_PROGRESS_KEY = 'passwordle.progress.v1';
const STATS_KEY = 'passwordle.stats.v1';

/** How many days of in-flight progress to keep before dropping the oldest. */
const PROGRESS_LIMIT = 60;

/** In-flight state, so a reload does not cost the player their work. */
export interface SavedProgress {
  date: string;
  password: string;
  unlocked: number;
  breaks: number[];
  hinted: boolean[];
  elapsedMs: number;
  completed: boolean;
  gaveUp: boolean;
}

export interface DayResult extends PlayRecord {
  date: string;
  index: number;
  par: number;
  score: number;
}

export interface Stats {
  played: number;
  completed: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null;
  bestScore: number;
  /** Count of finishes by rules cleared, 0..8. */
  distribution: number[];
  history: DayResult[];
}

export const EMPTY_STATS: Stats = {
  played: 0,
  completed: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  bestScore: 0,
  distribution: Array(9).fill(0),
  history: [],
};

/** localStorage can be unavailable, full, or hold data from an older build. */
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota — the game still plays, it just forgets.
  }
}

type ProgressMap = Record<string, SavedProgress>;

/**
 * Progress is stored per date so an archive puzzle cannot overwrite today's.
 * Version 1 held a single day, so it is folded in on first read.
 */
function loadAllProgress(): ProgressMap {
  const map = read<ProgressMap>(PROGRESS_KEY);
  if (map && typeof map === 'object' && !Array.isArray(map)) return map;

  const legacy = read<SavedProgress>(LEGACY_PROGRESS_KEY);
  if (legacy && typeof legacy.date === 'string') return { [legacy.date]: legacy };

  return {};
}

export function loadProgress(date: string): SavedProgress | null {
  const saved = loadAllProgress()[date];
  if (!saved || saved.date !== date) return null;
  if (typeof saved.password !== 'string' || !Array.isArray(saved.breaks)) return null;
  return saved;
}

export function saveProgress(progress: SavedProgress): void {
  const map = loadAllProgress();
  map[progress.date] = progress;

  const dates = Object.keys(map).sort();
  while (dates.length > PROGRESS_LIMIT) {
    const oldest = dates.shift();
    if (oldest) delete map[oldest];
  }

  write(PROGRESS_KEY, map);
}

export function loadStats(): Stats {
  const saved = read<Stats>(STATS_KEY);
  if (!saved || typeof saved.played !== 'number') return EMPTY_STATS;
  return {
    ...EMPTY_STATS,
    ...saved,
    distribution: Array.isArray(saved.distribution) && saved.distribution.length === 9
      ? saved.distribution
      : EMPTY_STATS.distribution,
    history: Array.isArray(saved.history) ? saved.history : [],
  };
}

function previousDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  return prev.toISOString().slice(0, 10);
}

/**
 * Fold a finished day into the player's record. Recording the same date twice
 * is a no-op, so a reopened result panel cannot inflate a streak.
 *
 * `affectsStreak` is false for archive puzzles: a streak counts days you turned
 * up, so finishing an old one should neither extend nor reset it.
 */
export function recordResult(stats: Stats, result: DayResult, affectsStreak = true): Stats {
  if (stats.history.some((h) => h.date === result.date)) return stats;

  const streak = !affectsStreak
    ? stats.currentStreak
    : result.completed
      ? stats.lastCompletedDate === previousDate(result.date)
        ? stats.currentStreak + 1
        : 1
      : 0;

  const next: Stats = {
    played: stats.played + 1,
    completed: stats.completed + (result.completed ? 1 : 0),
    currentStreak: streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastCompletedDate:
      affectsStreak && result.completed ? result.date : stats.lastCompletedDate,
    bestScore: Math.max(stats.bestScore, result.score),
    distribution: stats.distribution.map((n, i) => (i === result.cleared ? n + 1 : n)),
    history: [...stats.history, result].slice(-120),
  };
  write(STATS_KEY, next);
  return next;
}
