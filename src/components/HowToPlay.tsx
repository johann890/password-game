import { CloseIcon } from './Icons';
import { RuleDemo } from './RuleDemo';
import { useEscape } from './useEscape';

interface Props {
  ruleCount: number;
  onClose: () => void;
}

export function HowToPlay({ ruleCount, onClose }: Props) {
  useEscape(onClose);

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="How to play" onClick={onClose}>
      <div className="sheet howto" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>How to Play</h2>
            <div className="sheet-sub">
              Write one password that satisfies every rule at once.
            </div>
          </div>
          <button className="navbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="howto-body">
          <RuleDemo />

          <div>
            <div className="rulesheet">
              <p>
                That demo has three rules. The real puzzle has <b>{ruleCount}</b>,
                they get harder as you go, and they are new every day — everyone
                gets the same ones.
              </p>
            </div>

            <div className="scoring">
              <div className="scoring-row">
                <span>Shorter than par</span>
                <b>+10 per character</b>
              </div>
              <div className="scoring-row">
                <span>Longer than par</span>
                <b>−10 per character</b>
              </div>
              <div className="scoring-row">
                <span>Breaking a rule you had satisfied</span>
                <b>−15 each</b>
              </div>
              <div className="scoring-row">
                <span>Spending one of your three hints</span>
                <b>−75 each</b>
              </div>
            </div>

            <div className="rulesheet">
              <p>
                <b>Par</b> is the shortest password we can find that satisfies
                the day's rules. Matching it is good. Beating it is the real
                game.
              </p>
              <p>Your result shares as a grid, giving nothing away:</p>

              <div className="legend">
                <div className="legend-row"><span>🟩</span><span>Solved without ever breaking it</span></div>
                <div className="legend-row"><span>🟨</span><span>Solved, but it broke along the way</span></div>
                <div className="legend-row"><span>🟧</span><span>Solved with a hint</span></div>
                <div className="legend-row"><span>⬜</span><span>Never got there</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="sheet-actions">
          <button className="btn solid wide" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
