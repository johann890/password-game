import { useEffect, useState } from 'react';
import { msUntilTomorrow } from '../engine/context';
import { len } from '../engine/rules';
import type { Puzzle } from '../engine/types';
import { copyToClipboard } from '../game/clipboard';
import { formatDuration, shareGrid, shareText, type PlayRecord, type Score } from '../game/score';
import type { Stats } from '../game/storage';
import { CloseIcon } from './Icons';
import { useEscape } from './useEscape';
import { StatsBlock } from './StatsBlock';

interface Props {
  puzzle: Puzzle;
  record: PlayRecord;
  score: Score;
  stats: Stats;
  onClose: () => void;
  onHome: () => void;
  /** Archive puzzles have no countdown and no bearing on a streak. */
  isToday: boolean;
}

function useCountdown(): string {
  const [ms, setMs] = useState(msUntilTomorrow);
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilTomorrow()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(total / 3600)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function ResultPanel({
  puzzle, record, score, stats, onClose, onHome, isToday,
}: Props) {
  useEscape(onClose);
  const [copied, setCopied] = useState(false);
  /** Shown when the clipboard is unavailable, so the result is never lost. */
  const [manual, setManual] = useState<string | null>(null);
  const countdown = useCountdown();

  const share = async () => {
    const text = `${shareText(puzzle, record)}\nPasswordle — a new password puzzle every day`;
    if (await copyToClipboard(text)) {
      setCopied(true);
      setManual(null);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      setManual(text);
    }
  };

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Result" onClick={onClose}>
      <div className="sheet result" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{record.completed ? 'Password accepted' : 'Rejected'}</h2>
            <div className="sheet-sub">
              No. {puzzle.ctx.index} · {record.cleared} of {puzzle.rules.length} rules
            </div>
          </div>
          <button className="navbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="result-body">
          <div>
            <div className="verdict">
              <span className="verdict-score">{score.total}</span>
              {score.grade !== '—' && <span className="verdict-grade">Grade {score.grade}</span>}
            </div>
            <div className="verdict-note">
              {record.completed
                ? `${len(record.password)} characters · par ${puzzle.par} · ${formatDuration(record.durationMs)}`
                : `Stopped after ${formatDuration(record.durationMs)}`}
            </div>

            <div className="grid-art">{shareGrid(puzzle, record)}</div>

            {score.lines.length > 0 && (
              <div className="breakdown">
                {score.lines.map((line) => (
                  <div className="breakdown-row" key={line.label}>
                    <span>{line.label}</span>
                    <b className={line.delta > 0 ? 'good' : undefined}>
                      {line.delta > 0 ? `+${line.delta}` : line.delta}
                    </b>
                  </div>
                ))}
              </div>
            )}

            <div className="answer">
              <span>
                {record.completed
                  ? 'Your password'
                  : 'One password that would have worked'}
              </span>
              <code>{record.completed ? record.password : puzzle.solution}</code>
            </div>

          </div>

          <div>
            <StatsBlock
              stats={stats}
              ruleCount={puzzle.rules.length}
              highlight={record.cleared}
            />
          </div>
        </div>

        <div className="sheet-actions">
          <button className="btn solid wide" onClick={share}>
            {copied ? 'Copied' : 'Share result'}
          </button>
          {manual && (
            <>
              <p className="sheet-sub">Copying was blocked — select this and copy it.</p>
              <textarea
                className="manual-share"
                readOnly
                rows={5}
                value={manual}
                onFocus={(e) => e.currentTarget.select()}
                autoFocus
              />
            </>
          )}
          <button className="btn outline wide" onClick={onHome}>Back to home</button>
        </div>

        <div className="countdown">
          {isToday ? (
            <>Next password in <b>{countdown}</b></>
          ) : (
            <>Archive puzzle · your streak is untouched</>
          )}
        </div>
      </div>
    </div>
  );
}
