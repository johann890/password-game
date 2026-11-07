import { useState } from 'react';
import { MODES, MODE_LIST, ruleCount } from '../engine/puzzle';
import type { Mode } from '../engine/types';
import { loadStats } from '../game/storage';
import { CloseIcon } from './Icons';
import { useEscape } from './useEscape';
import { StatsBlock } from './StatsBlock';

interface Props {
  /** Which record to open on — the mode you came from. */
  mode?: Mode;
  onClose: () => void;
}

/**
 * The two modes keep separate records, so this panel is the only place to see
 * the one you are not currently playing. It reads storage itself rather than
 * being handed one mode's stats, which is what let the hard record go unseen
 * unless you had just finished a hard puzzle.
 */
export function StatsPanel({ mode = 'daily', onClose }: Props) {
  useEscape(onClose);
  const [shown, setShown] = useState<Mode>(mode);
  const stats = loadStats(shown);

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Statistics" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Statistics</h2>
          <button className="navbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="segmented mode-switch" role="tablist" aria-label="Mode">
          {MODE_LIST.map((each) => (
            <span className="segmented-option" key={each}>
              <input
                className="sr-only"
                type="radio"
                name="stats-mode"
                id={`stats-mode-${each}`}
                checked={shown === each}
                onChange={() => setShown(each)}
              />
              <label htmlFor={`stats-mode-${each}`}>{MODES[each].label}</label>
            </span>
          ))}
        </div>

        {stats.played === 0 ? (
          <p className="sheet-sub" style={{ marginTop: 16 }}>
            Nothing here yet. Finish a {MODES[shown].label.toLowerCase()} password
            and your record starts.
          </p>
        ) : (
          <StatsBlock stats={stats} ruleCount={ruleCount(shown)} />
        )}

        <div className="sheet-actions">
          <button className="btn outline wide" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
