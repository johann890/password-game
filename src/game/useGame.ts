import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPuzzle } from '../engine/puzzle';
import { todayKey } from '../engine/context';
import type { RuleProgress } from '../engine/types';
import { loadProgress, loadStats, recordResult, saveProgress, type Stats } from './storage';
import { scoreRun, type PlayRecord } from './score';

export const MAX_HINTS = 3;

/**
 * Gaps longer than this are not someone thinking — the tab was in the
 * background, or the machine was asleep. They do not count as play time.
 */
const MAX_TICK_MS = 2000;

/** Rule text without the emphasis markers, for screen readers. */
const plain = (text: string) => text.replace(/\*/g, '');

export interface RuleView {
  satisfied: boolean;
  unlocked: boolean;
  /** Unlocked, not yet satisfied, and never satisfied — new, not failed. */
  pending: boolean;
  progress?: RuleProgress;
  hinted: boolean;
  breaks: number;
}

export function useGame(date: string) {
  const puzzle = useMemo(() => getPuzzle(date), [date]);
  const ruleCount = puzzle.rules.length;

  const saved = useMemo(() => loadProgress(date), [date]);
  const [password, setPassword] = useState(saved?.password ?? '');
  const [unlocked, setUnlocked] = useState(saved?.unlocked ?? 1);
  const [breaks, setBreaks] = useState<number[]>(saved?.breaks ?? Array(ruleCount).fill(0));
  const [hinted, setHinted] = useState<boolean[]>(saved?.hinted ?? Array(ruleCount).fill(false));
  const [elapsedMs, setElapsedMs] = useState(saved?.elapsedMs ?? 0);
  const [completed, setCompleted] = useState(saved?.completed ?? false);
  const [gaveUp, setGaveUp] = useState(saved?.gaveUp ?? false);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [panelOpen, setPanelOpen] = useState(saved?.completed || saved?.gaveUp || false);
  /** The rule that most recently unlocked, for the reveal animation. */
  const [justUnlocked, setJustUnlocked] = useState(-1);
  /** Spoken by the live region: the cascade is otherwise silent. */
  const [announcement, setAnnouncement] = useState('');
  // Rules the player has had working at some point. A rule that has never gone
  // green reads as "your turn"; one that has reads as "you broke it".
  const [everSatisfied, setEverSatisfied] = useState<boolean[]>(() =>
    Array.from({ length: ruleCount }, (_, i) => i < (saved?.unlocked ?? 1) - 1),
  );

  const satisfied = useMemo(
    () => puzzle.rules.map((rule) => rule.test(password)),
    [puzzle, password],
  );
  const previousSatisfied = useRef<boolean[]>(satisfied);
  const finished = completed || gaveUp;

  // Count a "break" when an unlocked rule that was green goes red again. This
  // is the main signal in the share grid, so it only counts live play.
  useEffect(() => {
    const before = previousSatisfied.current;
    previousSatisfied.current = satisfied;
    if (finished) return;
    const broken = satisfied.map((ok, i) => i < unlocked && before[i] && !ok);
    if (broken.some(Boolean)) {
      setBreaks((prev) => prev.map((n, i) => (broken[i] ? n + 1 : n)));
      setAnnouncement(`Rule ${broken.indexOf(true) + 1} is no longer satisfied.`);
    }
    setEverSatisfied((prev) =>
      prev.some((was, i) => !was && satisfied[i] && i < unlocked)
        ? prev.map((was, i) => was || (satisfied[i] && i < unlocked))
        : prev,
    );
  }, [satisfied, unlocked, finished]);

  // Reveal the next rule once every unlocked one holds. Runs a step at a time
  // so a pasted password cascades through the rules instead of jumping.
  useEffect(() => {
    if (finished) return;
    if (!satisfied.slice(0, unlocked).every(Boolean)) return;
    if (unlocked < ruleCount) {
      setUnlocked(unlocked + 1);
      setJustUnlocked(unlocked);
      setAnnouncement(`Rule ${unlocked + 1} of ${ruleCount}. ${plain(puzzle.rules[unlocked].text)}`);
    } else {
      setCompleted(true);
      setPanelOpen(true);
      setAnnouncement(`All ${ruleCount} rules satisfied. Password accepted.`);
    }
  }, [satisfied, unlocked, ruleCount, finished, puzzle]);

  // The clock starts on the first keystroke, not on page load, and only runs
  // while the page is actually on screen. Accumulating wall-clock time would
  // charge people the slow-finish penalty for a tab they left open at lunch.
  const running = !finished && (password.length > 0 || elapsedMs > 0);
  useEffect(() => {
    if (!running) return;

    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (!document.hidden && delta < MAX_TICK_MS) {
        setElapsedMs((prev) => prev + delta);
      }
    };

    // Reset the baseline on the way back so the hidden stretch is not banked.
    const resync = () => {
      last = Date.now();
    };

    const id = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', resync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', resync);
    };
  }, [running]);

  const record: PlayRecord = useMemo(
    () => ({
      breaks,
      hinted,
      cleared: completed ? ruleCount : unlocked - 1,
      password,
      durationMs: elapsedMs,
      completed,
    }),
    [breaks, hinted, completed, unlocked, ruleCount, password, elapsedMs],
  );

  const score = useMemo(() => scoreRun(puzzle, record), [puzzle, record]);

  useEffect(() => {
    saveProgress({ date, password, unlocked, breaks, hinted, elapsedMs, completed, gaveUp });
  }, [date, password, unlocked, breaks, hinted, elapsedMs, completed, gaveUp]);

  // Fold the day into lifetime stats exactly once.
  const recorded = useRef(false);
  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    setStats((prev) =>
      recordResult(
        prev,
        { ...record, date, index: puzzle.ctx.index, par: puzzle.par, score: score.total },
        // Streaks count days you turned up, so only today's puzzle moves them.
        date === todayKey(),
      ),
    );
  }, [finished, record, date, puzzle, score.total]);

  const hintsLeft = MAX_HINTS - hinted.filter(Boolean).length;

  const useHint = useCallback(
    (index: number) => {
      setHinted((prev) => {
        if (prev[index] || prev.filter(Boolean).length >= MAX_HINTS) return prev;
        return prev.map((v, i) => (i === index ? true : v));
      });
    },
    [],
  );

  const giveUp = useCallback(() => {
    setGaveUp(true);
    setPanelOpen(true);
  }, []);

  const views: RuleView[] = puzzle.rules.map((rule, i) => ({
    satisfied: satisfied[i],
    unlocked: i < unlocked,
    pending: i < unlocked && !satisfied[i] && !everSatisfied[i],
    progress: rule.progress?.(password),
    hinted: hinted[i],
    breaks: breaks[i],
  }));

  return {
    puzzle,
    password,
    setPassword,
    views,
    unlocked,
    elapsedMs,
    completed,
    gaveUp,
    finished,
    record,
    score,
    stats,
    hintsLeft,
    useHint,
    giveUp,
    panelOpen,
    setPanelOpen,
    justUnlocked,
    announcement,
  };
}
