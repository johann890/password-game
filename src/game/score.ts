import { len } from '../engine/rules';
import type { Puzzle } from '../engine/types';

export interface PlayRecord {
  /** Times each rule went from satisfied back to broken, once unlocked. */
  breaks: number[];
  /** Whether a hint was spent on each rule. */
  hinted: boolean[];
  /** Rules fully cleared. */
  cleared: number;
  password: string;
  durationMs: number;
  completed: boolean;
}

export type RuleMark = 'clean' | 'messy' | 'hinted' | 'unreached';

const MARK_EMOJI: Record<RuleMark, string> = {
  clean: '🟩',
  messy: '🟨',
  hinted: '🟧',
  unreached: '⬜',
};

export function markFor(record: PlayRecord, index: number): RuleMark {
  if (index >= record.cleared) return 'unreached';
  if (record.hinted[index]) return 'hinted';
  if ((record.breaks[index] ?? 0) > 0) return 'messy';
  return 'clean';
}

export interface Score {
  total: number;
  grade: string;
  /** Penalty lines, for the breakdown in the result panel. */
  lines: { label: string; delta: number }[];
}

const BASE = 1000;

/**
 * Score rewards a short answer found cleanly. Time matters, but gently — the
 * first two minutes are free so thinking is not punished.
 */
export function scoreRun(puzzle: Puzzle, record: PlayRecord): Score {
  const lines: { label: string; delta: number }[] = [];

  const over = Math.max(0, len(record.password) - puzzle.par);
  if (over > 0) lines.push({ label: `${over} over par`, delta: -Math.min(250, over * 10) });

  const under = Math.max(0, puzzle.par - len(record.password));
  if (under > 0 && record.completed) {
    lines.push({ label: `${under} under par`, delta: Math.min(150, under * 10) });
  }

  const breaks = record.breaks.reduce((a, b) => a + b, 0);
  if (breaks > 0) lines.push({ label: `${breaks} rule break${breaks === 1 ? '' : 's'}`, delta: -Math.min(200, breaks * 15) });

  const hints = record.hinted.filter(Boolean).length;
  if (hints > 0) lines.push({ label: `${hints} hint${hints === 1 ? '' : 's'}`, delta: -hints * 75 });

  const seconds = Math.floor(record.durationMs / 1000);
  const slow = Math.max(0, seconds - 120);
  if (slow > 0) lines.push({ label: 'slow finish', delta: -Math.min(150, Math.floor(slow / 2)) });

  if (!record.completed) {
    lines.push({ label: `only ${record.cleared} of ${puzzle.rules.length} rules`, delta: -BASE });
  }

  const total = Math.max(0, lines.reduce((sum, l) => sum + l.delta, BASE));
  return { total, grade: gradeFor(total, record.completed), lines };
}

function gradeFor(total: number, completed: boolean): string {
  if (!completed) return '—';
  if (total >= 950) return 'S';
  if (total >= 850) return 'A';
  if (total >= 700) return 'B';
  if (total >= 500) return 'C';
  return 'D';
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** The grid of marks, four to a row. */
export function shareGrid(puzzle: Puzzle, record: PlayRecord): string {
  const marks = puzzle.rules.map((_, i) => MARK_EMOJI[markFor(record, i)]);
  const rows: string[] = [];
  for (let i = 0; i < marks.length; i += 4) rows.push(marks.slice(i, i + 4).join(''));
  return rows.join('\n');
}

/**
 * The shareable result. A finished run includes the password itself — the
 * point is comparing answers — so posting it spoils the day for anyone who
 * has not played yet. A run that was given up shares no password at all.
 */
export function shareText(puzzle: Puzzle, record: PlayRecord): string {
  const score = scoreRun(puzzle, record);
  const hints = record.hinted.filter(Boolean).length;
  const headline = record.completed
    ? `${len(record.password)} chars (par ${puzzle.par})`
    : `gave up on rule ${record.cleared + 1}`;

  const details = [
    headline,
    formatDuration(record.durationMs),
    hints ? `${hints} hint${hints === 1 ? '' : 's'}` : 'no hints',
  ].join(' · ');

  const lines = [
    `Passwordle #${puzzle.ctx.index}  ${score.grade !== '—' ? score.grade : ''}`.trim(),
    shareGrid(puzzle, record),
    details,
  ];

  if (record.completed) lines.push(`🔑 ${record.password}`);

  return lines.join('\n');
}
