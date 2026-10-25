import { useMemo } from 'react';
import { dateForIndex, puzzleIndex } from '../engine/context';
import { loadProgress, type DayResult, type Stats } from '../game/storage';
import { BackIcon } from './Icons';

interface Props {
  today: string;
  stats: Stats;
  onPlay: (date: string) => void;
  onHome: () => void;
}

interface Row {
  index: number;
  date: string;
  label: string;
  result: DayResult | null;
  started: boolean;
}

export function Archive({ today, stats, onPlay, onHome }: Props) {
  const rows = useMemo<Row[]>(() => {
    const count = Math.max(1, puzzleIndex(today));
    const byDate = new Map(stats.history.map((entry) => [entry.date, entry]));

    return Array.from({ length: count }, (_, offset) => {
      const index = count - offset;
      const date = dateForIndex(index);
      const progress = loadProgress(date);
      const [y, m, d] = date.split('-').map(Number);

      return {
        index,
        date,
        label: new Date(y, m - 1, d).toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        result: byDate.get(date) ?? null,
        started: !!progress && progress.password.length > 0,
      };
    });
  }, [today, stats]);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <button className="navbtn back" onClick={onHome} aria-label="Back to home">
            <BackIcon />
          </button>
          <span className="nav-title">Archive</span>
          <span className="nav-spacer" />
        </div>
      </nav>

      <main className="shell">
        <p className="archive-intro">
          Every puzzle so far. Finishing an old one counts towards your record
          but leaves your streak alone — a streak is for days you turned up.
        </p>

        <ul className="archive-list">
          {rows.map((row) => (
            <li key={row.date}>
              <button className="archive-row" onClick={() => onPlay(row.date)}>
                <span>
                  <span className="archive-no">No. {row.index}</span>
                  {row.date === today && <span className="archive-today">Today</span>}
                  <br />
                  <span className="archive-date">{row.label}</span>
                </span>
                <Status row={row} />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function Status({ row }: { row: Row }) {
  if (row.result?.completed) {
    return <span className="archive-status done">Solved · {row.result.score}</span>;
  }
  if (row.result) {
    return (
      <span className="archive-status failed">
        {row.result.cleared} of 8 rules
      </span>
    );
  }
  if (row.started) return <span className="archive-status live">In progress</span>;
  return <span className="archive-status">Not played</span>;
}
