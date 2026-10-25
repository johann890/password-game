import type { Rule } from '../engine/types';
import type { RuleView } from '../game/useGame';
import { Emphasis } from './Emphasis';
import { CheckMark, CrossMark, OpenMark } from './Icons';

interface Props {
  rule: Rule;
  view: RuleView;
  number: number;
  isNew: boolean;
  isActive: boolean;
  canHint: boolean;
  onHint: () => void;
  /** The demo in How to Play reuses this card but has nothing to hint at. */
  showHint?: boolean;
}

export function RuleCard({
  rule, view, number, isNew, isActive, canHint, onHint, showHint = true,
}: Props) {
  const state = view.satisfied ? 'ok' : view.pending ? 'pending' : 'bad';
  const meter = view.progress;
  const ratio = meter && meter.target > 0
    ? Math.max(0, Math.min(1, meter.current / meter.target))
    : 0;

  return (
    <li
      className={`rule ${state}${isNew ? ' enter' : ''}${isActive && !view.satisfied ? ' is-active' : ''}`}
    >
      <span className="rule-mark">
        {view.satisfied ? <CheckMark /> : view.pending ? <OpenMark /> : <CrossMark />}
      </span>

      <div>
        <div className="rule-label">
          Rule {number}
          <span className="sr-only">
            {view.satisfied
              ? ', satisfied.'
              : view.pending
                ? ', not yet satisfied.'
                : ', no longer satisfied.'}
          </span>
        </div>
        <p className="rule-text">
          <Emphasis text={rule.text} />
          {rule.swatch && (
            <span className="swatch" style={{ background: rule.swatch }} aria-hidden="true" />
          )}
        </p>

        {meter && (
          <div className="meter">
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${ratio * 100}%` }} />
            </div>
            <span className="meter-label">
              {meter.label} {meter.current} / {meter.target}
            </span>
          </div>
        )}

        {!showHint ? null : view.hinted ? (
          <div className="rule-hint">{rule.hint}</div>
        ) : (
          !view.satisfied && (
            <button className="hintbtn" onClick={onHint} disabled={!canHint}>
              {canHint ? 'Show a hint' : 'No hints left'}
            </button>
          )
        )}
      </div>
    </li>
  );
}
