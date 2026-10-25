import type { Stats } from '../game/storage';
import { CloseIcon } from './Icons';
import { useEscape } from './useEscape';
import { StatsBlock } from './StatsBlock';

interface Props {
  stats: Stats;
  ruleCount: number;
  onClose: () => void;
}

export function StatsPanel({ stats, ruleCount, onClose }: Props) {
  useEscape(onClose);

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Statistics" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Statistics</h2>
          <button className="navbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {stats.played === 0 ? (
          <p className="sheet-sub" style={{ marginTop: 10 }}>
            Nothing here yet. Finish today’s password and your record starts.
          </p>
        ) : (
          <StatsBlock stats={stats} ruleCount={ruleCount} />
        )}

        <div className="sheet-actions">
          <button className="btn outline wide" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
