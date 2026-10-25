import { useEffect, useMemo, useState } from 'react';
import { getPuzzle } from './engine/puzzle';
import { todayKey } from './engine/context';
import { loadStats, type Stats } from './game/storage';
import { useGame } from './game/useGame';
import { formatDuration } from './game/score';
import { Archive } from './components/Archive';
import { Home } from './components/Home';
import { HowToPlay } from './components/HowToPlay';
import { ResultPanel } from './components/ResultPanel';
import { RuleCard } from './components/RuleCard';
import { StatsPanel } from './components/StatsPanel';
import { BackIcon, HelpIcon, StatsIcon } from './components/Icons';

const SEEN_INTRO = 'passwordle.intro.v1';
const RULE_COUNT = 8;

type Sheet = null | 'howto' | 'stats';
type Screen = 'home' | 'game' | 'archive';

export default function App() {
  const [today, setToday] = useState(todayKey);
  const [screen, setScreen] = useState<Screen>('home');
  const [playDate, setPlayDate] = useState(today);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [sheet, setSheet] = useState<Sheet>(() => {
    try {
      return localStorage.getItem(SEEN_INTRO) ? null : 'howto';
    } catch {
      return 'howto';
    }
  });

  // Generate the day's puzzle in the background while the home screen is up,
  // so pressing Play is instant. getPuzzle memoises per date.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        getPuzzle(today);
      } catch {
        // The error boundary covers a real failure; prewarming is best effort.
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [today]);

  // Roll over to the new puzzle if the tab is left open past midnight. Someone
  // mid-puzzle keeps the one they are on rather than having it swapped out.
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayKey()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (screen === 'home') setPlayDate(today);
  }, [today, screen]);

  const closeSheet = () => {
    if (sheet === 'howto') {
      try {
        localStorage.setItem(SEEN_INTRO, '1');
      } catch {
        // They will simply see it again next time.
      }
    }
    setSheet(null);
  };

  const goHome = () => {
    setStats(loadStats());
    setScreen('home');
  };

  const openStats = () => {
    setStats(loadStats());
    setSheet('stats');
  };

  const openArchive = () => {
    setStats(loadStats());
    setScreen('archive');
  };

  const play = (date: string) => {
    setPlayDate(date);
    setScreen('game');
  };

  return (
    <>
      {screen === 'home' && (
        <Home
          key={today}
          date={today}
          stats={stats}
          onPlay={() => play(today)}
          onHowToPlay={() => setSheet('howto')}
          onStats={openStats}
          onArchive={openArchive}
        />
      )}

      {screen === 'archive' && (
        <Archive today={today} stats={stats} onPlay={play} onHome={goHome} />
      )}

      {screen === 'game' && (
        <Game key={playDate} date={playDate} isToday={playDate === today} onHome={goHome} />
      )}

      {sheet === 'howto' && <HowToPlay ruleCount={RULE_COUNT} onClose={closeSheet} />}
      {sheet === 'stats' && (
        <StatsPanel stats={stats} ruleCount={RULE_COUNT} onClose={closeSheet} />
      )}
    </>
  );
}

interface GameProps {
  date: string;
  isToday: boolean;
  onHome: () => void;
}

function Game({ date, isToday, onHome }: GameProps) {
  const game = useGame(date);
  const { puzzle, views } = game;
  const [sheet, setSheet] = useState<Sheet>(null);

  // Giving up ends the day for good, so it takes a second click.
  const [confirmQuit, setConfirmQuit] = useState(false);
  useEffect(() => {
    if (!confirmQuit) return;
    const id = window.setTimeout(() => setConfirmQuit(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmQuit]);

  const visible = useMemo(
    () =>
      views
        .map((view, index) => ({ view, index }))
        .filter(({ view }) => view.unlocked)
        .reverse(),
    [views],
  );

  const satisfiedCount = views.filter((v) => v.unlocked && v.satisfied).length;

  const label = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    });
  }, [date]);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <button className="navbtn back" onClick={onHome} aria-label="Back to home">
            <BackIcon />
          </button>
          <span className="nav-title">Passwordle</span>
          <span className="nav-no">
            No. {puzzle.ctx.index}
            {!isToday && ` · ${label}`}
          </span>
          <span className="nav-spacer" />
          <button className="navbtn" onClick={() => setSheet('howto')} aria-label="How to play">
            <HelpIcon />
          </button>
          <button className="navbtn" onClick={() => setSheet('stats')} aria-label="Statistics">
            <StatsIcon />
          </button>
        </div>
      </nav>

      {/* The cascade is otherwise entirely visual. */}
      <div className="sr-only" role="status" aria-live="polite">
        {game.announcement}
      </div>

      <main className="shell">
        <div className="segments" aria-hidden="true">
          {views.map((view, i) => (
            <span
              key={i}
              className={`segment ${
                !view.unlocked ? '' : view.satisfied ? 'ok' : view.pending ? 'open' : 'bad'
              }`}
            />
          ))}
        </div>

        <div className={`field${game.completed ? ' is-done' : ''}`}>
          <textarea
            id="pw"
            value={game.password}
            onChange={(e) => game.setPassword(e.target.value.replace(/[\r\n]/g, ''))}
            placeholder="Choose a password"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            readOnly={game.finished}
            aria-label="Password"
          />
          <div className="field-meta">
            <span>
              <b>{game.password.length}</b> characters
            </span>
            <span>
              par <b>{puzzle.par}</b>
            </span>
          </div>
        </div>

        <ol className="rulelist">
          {visible.map(({ view, index }, position) => (
            <RuleCard
              key={index}
              rule={puzzle.rules[index]}
              view={view}
              number={index + 1}
              isNew={index === game.justUnlocked}
              isActive={position === 0}
              canHint={game.hintsLeft > 0}
              onHint={() => game.useHint(index)}
            />
          ))}
        </ol>
      </main>

      <div className="dock">
        <div className="dock-inner">
          <span><b>{formatDuration(game.elapsedMs)}</b></span>
          <span>
            <b>{satisfiedCount}</b>/{puzzle.rules.length} rules
          </span>
          <span>
            <b>{game.hintsLeft}</b> hints
          </span>
          <span className="dock-spacer" />
          {game.finished ? (
            <button className="btn solid small" onClick={() => game.setPanelOpen(true)}>
              Result
            </button>
          ) : (
            <button
              className={`btn small ${confirmQuit ? 'danger' : 'quiet'}`}
              onClick={() => (confirmQuit ? game.giveUp() : setConfirmQuit(true))}
            >
              {confirmQuit ? 'Sure?' : 'Give up'}
            </button>
          )}
        </div>
      </div>

      {sheet === 'howto' && (
        <HowToPlay ruleCount={puzzle.rules.length} onClose={() => setSheet(null)} />
      )}
      {sheet === 'stats' && (
        <StatsPanel
          stats={game.stats}
          ruleCount={puzzle.rules.length}
          onClose={() => setSheet(null)}
        />
      )}

      {game.panelOpen && !sheet && (
        <ResultPanel
          puzzle={puzzle}
          record={game.record}
          score={game.score}
          stats={game.stats}
          isToday={isToday}
          onClose={() => game.setPanelOpen(false)}
          onHome={onHome}
        />
      )}
    </>
  );
}
