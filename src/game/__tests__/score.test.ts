import { describe, expect, it } from 'vitest';
import type { Puzzle, Rule } from '../../engine/types';
import { markFor, scoreRun, shareGrid, shareText, formatDuration, type PlayRecord } from '../score';

const rule = (n: number): Rule => ({
  gen: `r${n}`,
  tier: 1,
  text: `rule ${n}`,
  hint: 'hint',
  tags: [`t${n}`],
  test: () => true,
});

const puzzle = (par: number): Puzzle => ({
  ctx: {
    date: '2026-10-25', index: 1, day: 25, month: 10, year: 2026,
    weekdayShort: 'SUN', monthName: 'OCTOBER', word: 'PLANET',
    color: '#123456', moon: '🌕', code: 'ABC',
  },
  rules: Array.from({ length: 8 }, (_, i) => rule(i)),
  solution: 'x'.repeat(par),
  par,
});

const record = (over: Partial<PlayRecord> = {}): PlayRecord => ({
  breaks: Array(8).fill(0),
  hinted: Array(8).fill(false),
  cleared: 8,
  password: 'x'.repeat(20),
  durationMs: 60_000,
  completed: true,
  ...over,
});

describe('marks', () => {
  it('distinguishes clean, messy, hinted and unreached', () => {
    const r = record({
      cleared: 3,
      breaks: [0, 2, 0, 0, 0, 0, 0, 0],
      hinted: [false, false, true, false, false, false, false, false],
    });
    expect(markFor(r, 0)).toBe('clean');
    expect(markFor(r, 1)).toBe('messy');
    expect(markFor(r, 2)).toBe('hinted');
    expect(markFor(r, 3)).toBe('unreached');
  });

  it('prefers the hint mark over the break mark', () => {
    const r = record({ cleared: 1, breaks: [3, 0, 0, 0, 0, 0, 0, 0], hinted: [true, ...Array(7).fill(false)] });
    expect(markFor(r, 0)).toBe('hinted');
  });
});

describe('share', () => {
  it('lays the grid out four to a row', () => {
    expect(shareGrid(puzzle(20), record()).split('\n')).toEqual(['🟩🟩🟩🟩', '🟩🟩🟩🟩']);
  });

  it('never leaks the password', () => {
    const text = shareText(puzzle(20), record({ password: 'SECRET-PASSWORD-123' }));
    expect(text).not.toContain('SECRET');
    expect(text).toContain('Passwordle #1');
    expect(text).toContain('par 20');
  });

  it('says where an unfinished run stopped', () => {
    const text = shareText(puzzle(20), record({ completed: false, cleared: 3 }));
    expect(text).toContain('gave up on rule 4');
    expect(text).toContain('⬜');
  });
});

describe('scoring', () => {
  it('gives a clean run at par full marks', () => {
    const score = scoreRun(puzzle(20), record({ durationMs: 30_000 }));
    expect(score.total).toBe(1000);
    expect(score.grade).toBe('S');
  });

  it('rewards beating par and penalises overshooting it', () => {
    const under = scoreRun(puzzle(30), record({ durationMs: 1000 }));
    const over = scoreRun(puzzle(10), record({ durationMs: 1000 }));
    expect(under.total).toBeGreaterThan(1000);
    expect(over.total).toBeLessThan(1000);
    expect(under.lines[0].label).toBe('10 under par');
  });

  it('charges for breaks and hints', () => {
    const score = scoreRun(
      puzzle(20),
      record({ durationMs: 1000, breaks: [2, 1, ...Array(6).fill(0)], hinted: [true, ...Array(7).fill(false)] }),
    );
    expect(score.total).toBe(1000 - 45 - 75);
  });

  it('never goes negative and grades an unfinished run as a dash', () => {
    const score = scoreRun(puzzle(5), record({ completed: false, cleared: 2, password: 'x'.repeat(90) }));
    expect(score.total).toBe(0);
    expect(score.grade).toBe('—');
  });

  it('formats durations as minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(3_600_000)).toBe('60:00');
  });
});
