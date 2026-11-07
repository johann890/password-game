import { useMemo } from 'react';
import { puzzleIndex } from '../engine/context';
import { MODES, MODE_LIST, ruleCount } from '../engine/puzzle';
import type { Mode } from '../engine/types';
import { loadProgress, type Stats } from '../game/storage';
import { SettingsIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { usePrefersReducedMotion, useTypewriter } from './useTypewriter';

interface Props {
  date: string;
  stats: Stats;
  onPlay: (mode: Mode) => void;
  onHowToPlay: () => void;
  onStats: () => void;
  onArchive: () => void;
  onSettings: () => void;
}

/** The name, spelled the way people actually mangle a password. */
const TITLE_VARIANTS = [
  'Passwordle',
  'P4ssw0rdle',
  'pa55word1e',
  'P@sswordle!',
  'PASSW0RDLE',
  'passwordle9',
] as const;

export function Home({
  date, stats, onPlay, onHowToPlay, onStats, onArchive, onSettings,
}: Props) {
  const stillAnimate = !usePrefersReducedMotion();
  const typed = useTypewriter(TITLE_VARIANTS, stillAnimate);

  // Each mode carries its own day, so each button says where you left off in
  // that mode rather than borrowing the other's state.
  const modes = useMemo(
    () => MODE_LIST.map((mode) => {
      const saved = loadProgress(date, mode);
      return {
        mode,
        action: saved?.completed || saved?.gaveUp
          ? 'See results'
          : saved && saved.password.length > 0
            ? 'Continue'
            : 'Play',
      };
    }),
    [date],
  );

  const shortDate = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [date]);

  return (
    <div className="home">
      <div className="home-top">
        <button className="navbtn" onClick={onSettings} aria-label="Settings">
          <SettingsIcon />
        </button>
        <ThemeToggle />
      </div>

      <div className="home-main">
        <div className="home-card">
          <h1 className="home-title" aria-label="Passwordle">
            <span aria-hidden="true">{typed}</span>
            <span className="caret" aria-hidden="true" />
          </h1>

          <p className="home-tag">
            One password. Eight rules that fight back — or twelve, if you want
            a proper fight. A new puzzle every day.
          </p>

          <div className="home-actions">
            {modes.map(({ mode, action }) => (
              <button
                key={mode}
                className={`btn ${mode === 'daily' ? 'solid' : 'outline'} wide mode-btn`}
                onClick={() => onPlay(mode)}
                aria-label={`${action} — ${MODES[mode].label.toLowerCase()} puzzle, ${ruleCount(mode)} rules`}
              >
                <span className="mode-action">{action}</span>
                <span className="mode-note" aria-hidden="true">
                  {MODES[mode].label} · {ruleCount(mode)} rules
                </span>
              </button>
            ))}
          </div>

          {/* The separators are drawn on the links themselves, so a link that
              wraps never drops a stray dot at the head of the next line. */}
          <div className="home-links">
            <button className="linkbtn" onClick={onHowToPlay}>How to play</button>
            <button className="linkbtn" onClick={onStats}>Statistics</button>
            <button className="linkbtn" onClick={onArchive}>Archive</button>
          </div>
        </div>
      </div>

      <footer className="home-bottom">
        <div className="home-meta">
          <div>{shortDate}</div>
          <div>
            No. <b>{puzzleIndex(date)}</b>
            {stats.currentStreak > 0 && <> · Streak <b>{stats.currentStreak}</b></>}
          </div>
        </div>
        <div className="copyright">© 2026</div>
      </footer>
    </div>
  );
}
