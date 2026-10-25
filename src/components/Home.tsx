import { useMemo } from 'react';
import { puzzleIndex } from '../engine/context';
import { loadProgress, type Stats } from '../game/storage';
import { usePrefersReducedMotion, useTypewriter } from './useTypewriter';

interface Props {
  date: string;
  stats: Stats;
  onPlay: () => void;
  onHowToPlay: () => void;
  onStats: () => void;
  onArchive: () => void;
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

export function Home({ date, stats, onPlay, onHowToPlay, onStats, onArchive }: Props) {
  const saved = useMemo(() => loadProgress(date), [date]);
  const stillAnimate = !usePrefersReducedMotion();
  const typed = useTypewriter(TITLE_VARIANTS, stillAnimate);

  const action = saved?.completed || saved?.gaveUp
    ? 'See results'
    : saved && saved.password.length > 0
      ? 'Continue'
      : 'Play';

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
      <div className="home-main">
        <h1 className="home-title" aria-label="Passwordle">
          <span aria-hidden="true">{typed}</span>
          <span className="caret" aria-hidden="true" />
        </h1>

        <p className="home-tag">
          One password. Eight rules that fight back. A new puzzle every day.
        </p>

        <div className="home-actions">
          <button className="btn solid wide" onClick={onPlay}>{action}</button>
        </div>

        <div className="home-links">
          <button className="linkbtn" onClick={onHowToPlay}>How to play</button>
          <span aria-hidden="true">·</span>
          <button className="linkbtn" onClick={onStats}>Statistics</button>
          <span aria-hidden="true">·</span>
          <button className="linkbtn" onClick={onArchive}>Archive</button>
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
