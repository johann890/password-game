import { useEffect, useMemo, useRef, useState } from 'react';
import type { Rule } from '../engine/types';
import type { RuleView } from '../game/useGame';
import { RuleCard } from './RuleCard';
import { usePrefersReducedMotion } from './useTypewriter';

/**
 * Three stand-in rules. They are real Rule objects run through the real
 * RuleCard, so the demo cannot drift away from how the game actually looks.
 */
const DEMO_RULES: Rule[] = [
  {
    gen: 'demoLength',
    tier: 1,
    text: 'Must be at least *6 characters* long.',
    hint: '',
    tags: [],
    test: (pw) => pw.length >= 6,
    progress: (pw) => ({ current: pw.length, target: 6, label: 'characters' }),
  },
  {
    gen: 'demoDigit',
    tier: 1,
    text: 'Must include at least one *number*.',
    hint: '',
    tags: [],
    test: (pw) => /\d/.test(pw),
  },
  {
    gen: 'demoMonth',
    tier: 2,
    text: 'Must contain the name of a *month*.',
    hint: '',
    tags: [],
    test: (pw) => /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(pw),
  },
];

type Mark = 'ok' | 'bad' | 'pending' | 'locked';

interface DemoState {
  unlocked: number;
  /** Rules that have gone green at least once — those are the ones that break. */
  ever: boolean[];
}

const fresh = (): DemoState => ({ unlocked: 1, ever: DEMO_RULES.map(() => false) });

/** The game's own logic in miniature: cascade the unlocks, then mark each rule. */
function advance(text: string, previous: DemoState): { state: DemoState; marks: Mark[] } {
  const satisfied = DEMO_RULES.map((rule) => text.length > 0 && rule.test(text));

  let unlocked = previous.unlocked;
  while (unlocked < DEMO_RULES.length && satisfied.slice(0, unlocked).every(Boolean)) {
    unlocked += 1;
  }

  const ever = previous.ever.map((was, i) => was || (satisfied[i] && i < unlocked));
  const marks: Mark[] = DEMO_RULES.map((_, i) => {
    if (i >= unlocked) return 'locked';
    if (satisfied[i]) return 'ok';
    return ever[i] ? 'bad' : 'pending';
  });

  return { state: { unlocked, ever }, marks };
}

interface Step {
  text: string;
  hold: number;
  caption: string;
}

const SCRIPT: Step[] = [
  { text: 'sunset', hold: 1100, caption: 'Write a password that satisfies the rule.' },
  { text: 'sunset7', hold: 1100, caption: 'Satisfy it and the next rule appears.' },
  { text: 'sunset7may', hold: 1800, caption: 'Earlier rules still have to hold.' },
  { text: 'may7', hold: 2100, caption: 'Rewrite it and an earlier rule can break.' },
  { text: 'sunset7may', hold: 2100, caption: 'Put it right and you are through.' },
];

interface Frame {
  text: string;
  caption: string;
  delay: number;
  marks: Mark[];
}

/**
 * Flatten the script into keystrokes up front. Precomputing every frame means
 * playback is a plain index walk rather than a state machine, and each frame
 * already knows what the rules looked like at that moment.
 */
function buildFrames(): Frame[] {
  const frames: Frame[] = [];
  let state = fresh();
  let current = '';

  const push = (text: string, caption: string, delay: number) => {
    const result = advance(text, state);
    state = result.state;
    frames.push({ text, caption, delay, marks: result.marks });
  };

  for (const step of SCRIPT) {
    let shared = 0;
    while (
      shared < current.length &&
      shared < step.text.length &&
      current[shared] === step.text[shared]
    ) {
      shared += 1;
    }

    for (let i = current.length; i > shared; i--) push(current.slice(0, i - 1), step.caption, 34);
    for (let i = shared; i < step.text.length; i++) push(step.text.slice(0, i + 1), step.caption, 72);

    push(step.text, step.caption, step.hold);
    current = step.text;
  }

  // Clear down to an empty field so the loop restarts from the beginning.
  state = fresh();
  frames.push({ text: '', caption: SCRIPT[0].caption, delay: 700, marks: advance('', fresh()).marks });

  return frames;
}

export function RuleDemo() {
  const frames = useMemo(buildFrames, []);
  const reduced = usePrefersReducedMotion();

  const [manual, setManual] = useState(reduced);
  const [text, setText] = useState(reduced ? 'sunset7may' : '');
  const [caption, setCaption] = useState(SCRIPT[0].caption);
  const [marks, setMarks] = useState<Mark[]>(
    () => advance(reduced ? 'sunset7may' : '', fresh()).marks,
  );

  const manualState = useRef(fresh());
  const frame = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (manual) return;
    let timer = 0;

    const tick = () => {
      const current = frames[frame.current];
      setText(current.text);
      setCaption(current.caption);
      setMarks(current.marks);
      frame.current = (frame.current + 1) % frames.length;
      timer = window.setTimeout(tick, current.delay);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [manual, frames]);

  /** The moment they type, the script gets out of the way. */
  const takeOver = (value: string) => {
    if (!manual) {
      setManual(true);
      manualState.current = fresh();
    }
    const result = advance(value, manualState.current);
    manualState.current = result.state;
    setText(value);
    setMarks(result.marks);
    setCaption('Your turn — the rules react as you type.');
  };

  const replay = () => {
    manualState.current = fresh();
    frame.current = 0;
    setManual(false);
  };

  const views: RuleView[] = marks.map((mark, i) => ({
    satisfied: mark === 'ok',
    unlocked: mark !== 'locked',
    pending: mark === 'pending',
    progress: DEMO_RULES[i].progress?.(text),
    hinted: false,
    breaks: 0,
  }));

  const visible = views
    .map((view, index) => ({ view, index }))
    .filter(({ view }) => view.unlocked)
    .reverse();

  return (
    <div className="demo">
      <div className="demo-caption">{caption}</div>

      <div className="demo-stage">
        <div className="demo-field" onClick={() => input.current?.focus()}>
          <input
            ref={input}
            value={text}
            onChange={(e) => takeOver(e.target.value)}
            placeholder="Type a password"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Try the rules"
          />
          {!manual && (
            <span
              className="demo-caret"
              style={{ left: `calc(14px + ${text.length}ch)` }}
              aria-hidden="true"
            />
          )}
        </div>

        <ol className="rulelist">
          {visible.map(({ view, index }, position) => (
            <RuleCard
              key={index}
              rule={DEMO_RULES[index]}
              view={view}
              number={index + 1}
              isNew={false}
              isActive={position === 0}
              canHint={false}
              onHint={() => {}}
              showHint={false}
            />
          ))}
        </ol>
      </div>

      <div className="demo-foot">
        <span>{manual ? 'You are driving.' : 'Type in the box to try it yourself.'}</span>
        {manual && (
          <button className="linkbtn" onClick={replay}>Replay demo</button>
        )}
      </div>
    </div>
  );
}
