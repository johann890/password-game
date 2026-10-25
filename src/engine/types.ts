export type Tier = 1 | 2 | 3 | 4;

/** Live numeric feedback for a rule, e.g. "digits sum to 12 / 24". */
export interface RuleProgress {
  current: number;
  target: number;
  label: string;
}

/** A concrete rule for one specific day, with all parameters baked in. */
export interface Rule {
  /** Generator id — stable across days, used for stats and dedupe. */
  gen: string;
  tier: Tier;
  /** The demand shown to the player. `*text*` renders as emphasis. */
  text: string;
  /** Nudge shown when the player spends a hint. */
  hint: string;
  /** Exclusivity groups: at most one rule per tag lands in a puzzle. */
  tags: string[];
  test: (pw: string) => boolean;
  /** Optional live counter shown under the rule. */
  progress?: (pw: string) => RuleProgress;
  /** Substrings that help satisfy this rule — fed to the solver's mutations. */
  tokens?: string[];
  /** Hex colour to render as a swatch alongside the rule. */
  swatch?: string;
  /**
   * Candidate passwords that fix this rule, derived from the current one.
   * Lets the solver (and the hint system) handle rules that plain mutation
   * would almost never stumble into, like "contains its own length".
   */
  repair?: (pw: string) => string[];
}

/** Everything date-derived that rules are allowed to reference. */
export interface DayContext {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Puzzle number, 1-based from the launch epoch. */
  index: number;
  day: number;
  month: number;
  year: number;
  weekdayShort: string;
  monthName: string;
  /** Word of the day, uppercase. */
  word: string;
  /** Colour of the day, "#RRGGBB". */
  color: string;
  /** Moon phase emoji for the date. */
  moon: string;
  /** Three-letter code of the day, for acrostic rules. */
  code: string;
}

export interface Puzzle {
  ctx: DayContext;
  rules: Rule[];
  /** A password that satisfies every rule — proof of solvability. */
  solution: string;
  /** Length of the shortest solution the solver found. Beat it for a bonus. */
  par: number;
}
