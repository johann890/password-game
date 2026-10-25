import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_STATS, loadProgress, loadStats, recordResult, saveProgress, type DayResult } from '../storage';

const result = (over: Partial<DayResult> = {}): DayResult => ({
  date: '2026-10-25',
  index: 1,
  par: 20,
  score: 900,
  breaks: Array(8).fill(0),
  hinted: Array(8).fill(false),
  cleared: 8,
  password: 'abc',
  durationMs: 1000,
  completed: true,
  ...over,
});

/**
 * An in-memory Storage. Node ships a partial localStorage of its own, so
 * stubbing it outright keeps these tests honest wherever they run.
 */
function memoryStorage(): Storage {
  let map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map = new Map();
    },
    getItem: (key: string) => map.get(key) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
    writable: true,
  });
});

describe('progress', () => {
  it('keeps a separate record per date', () => {
    const today = {
      date: '2026-10-25', password: 'today', unlocked: 3, breaks: [], hinted: [],
      elapsedMs: 10, completed: false, gaveUp: false,
    };
    const archive = {
      date: '2026-10-20', password: 'archive', unlocked: 5, breaks: [], hinted: [],
      elapsedMs: 20, completed: false, gaveUp: false,
    };
    saveProgress(today);
    saveProgress(archive);

    // Playing an old puzzle must not wipe the day in progress.
    expect(loadProgress('2026-10-25')?.password).toBe('today');
    expect(loadProgress('2026-10-20')?.password).toBe('archive');
  });

  it('migrates a single-day v1 record', () => {
    localStorage.setItem('passwordle.progress.v1', JSON.stringify({
      date: '2026-10-25', password: 'carried', unlocked: 2, breaks: [0], hinted: [false],
      elapsedMs: 5, completed: false, gaveUp: false,
    }));
    expect(loadProgress('2026-10-25')?.password).toBe('carried');
  });

  it('drops the oldest days once the store is full', () => {
    for (let day = 1; day <= 70; day++) {
      saveProgress({
        date: `2026-${String(Math.ceil(day / 28)).padStart(2, '0')}-${String(((day - 1) % 28) + 1).padStart(2, '0')}`,
        password: `p${day}`, unlocked: 1, breaks: [], hinted: [],
        elapsedMs: 0, completed: false, gaveUp: false,
      });
    }
    const stored = JSON.parse(localStorage.getItem('passwordle.progress.v2') ?? '{}');
    expect(Object.keys(stored).length).toBeLessThanOrEqual(60);
    expect(stored['2026-01-01']).toBeUndefined();
  });

  it('round-trips the day in play', () => {
    const progress = {
      date: '2026-10-25', password: 'abc', unlocked: 3,
      breaks: [1, 0, 0, 0, 0, 0, 0, 0], hinted: Array(8).fill(false),
      elapsedMs: 5000, completed: false, gaveUp: false,
    };
    saveProgress(progress);
    expect(loadProgress('2026-10-25')).toEqual(progress);
  });

  it('ignores progress from another day', () => {
    saveProgress({
      date: '2026-10-24', password: 'abc', unlocked: 3, breaks: [], hinted: [],
      elapsedMs: 0, completed: false, gaveUp: false,
    });
    expect(loadProgress('2026-10-25')).toBeNull();
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('passwordle.progress.v1', '{not json');
    expect(loadProgress('2026-10-25')).toBeNull();
    localStorage.setItem('passwordle.stats.v1', '"nonsense"');
    expect(loadStats()).toEqual(EMPTY_STATS);
  });
});

describe('stats', () => {
  it('extends a streak across consecutive days', () => {
    let stats = recordResult(EMPTY_STATS, result({ date: '2026-10-24' }));
    stats = recordResult(stats, result({ date: '2026-10-25' }));
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(2);
    expect(stats.completed).toBe(2);
  });

  it('resets the streak after a missed day', () => {
    let stats = recordResult(EMPTY_STATS, result({ date: '2026-10-20' }));
    stats = recordResult(stats, result({ date: '2026-10-25' }));
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
  });

  it('resets the streak but keeps the best after a failure', () => {
    let stats = recordResult(EMPTY_STATS, result({ date: '2026-10-23' }));
    stats = recordResult(stats, result({ date: '2026-10-24' }));
    stats = recordResult(stats, result({ date: '2026-10-25', completed: false, cleared: 4 }));
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
    expect(stats.played).toBe(3);
    expect(stats.distribution[4]).toBe(1);
  });

  it('leaves the streak alone for an archive puzzle', () => {
    let stats = recordResult(EMPTY_STATS, result({ date: '2026-10-24' }));
    expect(stats.currentStreak).toBe(1);

    // An old puzzle finished today counts as played, but is not a day turned up.
    stats = recordResult(stats, result({ date: '2026-09-01' }), false);
    expect(stats.currentStreak).toBe(1);
    expect(stats.lastCompletedDate).toBe('2026-10-24');
    expect(stats.played).toBe(2);
    expect(stats.distribution[8]).toBe(2);

    // Today still extends it from where it was.
    stats = recordResult(stats, result({ date: '2026-10-25' }));
    expect(stats.currentStreak).toBe(2);
  });

  it('an archive failure does not reset the streak', () => {
    let stats = recordResult(EMPTY_STATS, result({ date: '2026-10-25' }));
    stats = recordResult(stats, result({ date: '2026-08-01', completed: false, cleared: 2 }), false);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
  });

  it('records a date only once, so a reopened result cannot inflate stats', () => {
    const first = recordResult(EMPTY_STATS, result());
    const second = recordResult(first, result({ score: 10 }));
    expect(second).toBe(first);
    expect(second.played).toBe(1);
  });

  it('persists across a reload', () => {
    recordResult(EMPTY_STATS, result());
    expect(loadStats().played).toBe(1);
    expect(loadStats().bestScore).toBe(900);
  });
});
