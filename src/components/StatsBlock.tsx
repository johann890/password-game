import type { Stats } from '../game/storage';

interface Props {
  stats: Stats;
  ruleCount: number;
  /** Rules cleared today, highlighted in the distribution. */
  highlight?: number;
}

export function StatsBlock({ stats, ruleCount, highlight }: Props) {
  const winRate = stats.played ? Math.round((stats.completed / stats.played) * 100) : 0;
  const peak = Math.max(1, ...stats.distribution);

  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <div className="stat-n">{stats.played}</div>
          <div className="stat-l">Played</div>
        </div>
        <div className="stat">
          <div className="stat-n">{winRate}</div>
          <div className="stat-l">% Solved</div>
        </div>
        <div className="stat">
          <div className="stat-n">{stats.currentStreak}</div>
          <div className="stat-l">Streak</div>
        </div>
        <div className="stat">
          <div className="stat-n">{stats.maxStreak}</div>
          <div className="stat-l">Max streak</div>
        </div>
      </div>

      <div className="dist-title">Rules cleared</div>
      <div className="dist">
        {stats.distribution.slice(0, ruleCount + 1).map((count, cleared) => (
          <div className={`dist-row${cleared === highlight ? ' me' : ''}`} key={cleared}>
            <span>{cleared}</span>
            <div className="dist-bar" style={{ width: `${Math.max(6, (count / peak) * 100)}%` }}>
              {count}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
