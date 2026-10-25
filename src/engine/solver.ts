import { chars } from './rules';
import { pick, randInt, type Rng } from './rng';
import type { Rule } from './types';

const ALPHABET = (
  'abcdefghijklmnopqrstuvwxyz' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  '0123456789' +
  '!@#$%^&*?+=~'
).split('');

export interface SolveResult {
  ok: boolean;
  password: string;
  /** How many rules the best candidate satisfied. */
  satisfied: number;
  iterations: number;
}

export interface SolveOptions {
  /** Hill-climb steps per restart. */
  steps?: number;
  restarts?: number;
}

/**
 * Satisfaction score: 1 per satisfied rule, plus partial credit from a rule's
 * live progress so numeric targets give the climb a gradient to follow.
 */
export function scoreOf(rules: readonly Rule[], pw: string): number {
  let total = 0;
  for (const rule of rules) {
    if (rule.test(pw)) {
      total += 1;
      continue;
    }
    if (rule.progress) {
      const { current, target } = rule.progress(pw);
      const span = Math.max(Math.abs(target), 1);
      const closeness = 1 - Math.min(Math.abs(target - current), span) / span;
      total += 0.9 * closeness;
    }
  }
  return total;
}

function failing(rules: readonly Rule[], pw: string): Rule[] {
  return rules.filter((r) => !r.test(pw));
}

function insertAt(pw: string, index: number, text: string): string {
  const cs = chars(pw);
  cs.splice(index, 0, text);
  return cs.join('');
}

/** One random edit, biased toward edits that could fix a currently broken rule. */
export function mutate(rules: readonly Rule[], pw: string, rng: Rng): string {
  const broken = failing(rules, pw);
  const roll = rng();

  if (broken.length) {
    const target = pick(rng, broken);
    if (roll < 0.35 && target.repair) {
      const options = target.repair(pw);
      if (options.length) return pick(rng, options);
    }
    if (roll < 0.7 && target.tokens?.length) {
      const token = pick(rng, target.tokens);
      return insertAt(pw, randInt(rng, 0, chars(pw).length), token);
    }
  }

  const cs = chars(pw);
  const op = randInt(rng, 0, 3);
  if (op === 0 || cs.length === 0) {
    return insertAt(pw, randInt(rng, 0, cs.length), pick(rng, ALPHABET));
  }
  if (op === 1) {
    cs.splice(randInt(rng, 0, cs.length - 1), 1);
    return cs.join('');
  }
  if (op === 2) {
    cs[randInt(rng, 0, cs.length - 1)] = pick(rng, ALPHABET);
    return cs.join('');
  }
  const i = randInt(rng, 0, cs.length - 1);
  const j = randInt(rng, 0, cs.length - 1);
  [cs[i], cs[j]] = [cs[j], cs[i]];
  return cs.join('');
}

/** Find a password satisfying every rule. Deterministic for a given rng seed. */
export function solve(rules: readonly Rule[], rng: Rng, opts: SolveOptions = {}): SolveResult {
  const steps = opts.steps ?? 4000;
  const restarts = opts.restarts ?? 10;
  const goal = rules.length;

  let best = '';
  let bestScore = -1;
  let iterations = 0;

  for (let restart = 0; restart < restarts; restart++) {
    let current = Array.from({ length: randInt(rng, 6, 12) }, () => pick(rng, ALPHABET)).join('');
    let currentScore = scoreOf(rules, current);

    let sinceGain = 0;
    for (let step = 0; step < steps; step++) {
      iterations++;
      // A restart that has stopped making progress is cheaper to abandon than
      // to run out — an infeasible rule set is rerolled by the caller.
      if (sinceGain > 1500) break;
      sinceGain++;
      const candidate = mutate(rules, current, rng);
      if (chars(candidate).length > 64) continue;
      const candidateScore = scoreOf(rules, candidate);

      // Accept improvements and sideways moves; take a small chance on a
      // downhill move early in the run to escape local optima. Length breaks
      // ties only — the coefficient is far below the gain from a whole rule —
      // which keeps solutions, and therefore par, tight.
      const temperature = 0.25 * (1 - step / steps);
      const tieBreak = (score: number, text: string) => score - 0.002 * chars(text).length;
      if (
        tieBreak(candidateScore, candidate) >= tieBreak(currentScore, current) ||
        rng() < temperature * 0.2
      ) {
        current = candidate;
        currentScore = candidateScore;
      }

      if (currentScore > bestScore) {
        bestScore = currentScore;
        best = current;
        sinceGain = 0;
      }
      if (bestScore >= goal) {
        return { ok: true, password: best, satisfied: goal, iterations };
      }
    }
  }

  return {
    ok: bestScore >= goal,
    password: best,
    satisfied: rules.filter((r) => r.test(best)).length,
    iterations,
  };
}

/**
 * Hunt for a shorter valid password, then trim it. Plain character removal gets
 * stuck on rules whose target moves when you delete something (a digit sum tied
 * to the letter count), so this takes random edits and keeps the short ones.
 */
export function shrink(
  rules: readonly Rule[],
  pw: string,
  rng: Rng,
  steps = 2500,
): string {
  const valid = (s: string) => rules.every((r) => r.test(s));
  let current = minimize(rules, pw);

  for (let i = 0; i < steps; i++) {
    const candidate = mutate(rules, current, rng);
    // Sideways moves matter: staying the same length lets the password be
    // reshaped into a form that can then lose a character. Only shrinking
    // leaves it stranded on the first valid answer the solver happened to hit.
    if (chars(candidate).length > chars(current).length) continue;
    if (valid(candidate)) current = candidate;
  }
  return minimize(rules, current);
}

/**
 * The shortest password we can find — the day's par.
 *
 * Descending from a valid answer one character at a time does not work: with
 * rules like "prime length" plus "digits sum to 32", valid passwords are
 * isolated from each other, and every single-character edit lands on an
 * invalid one. So instead we re-solve from scratch under a tightening length
 * cap, which lets the search pass through invalid ground to reach a shorter
 * answer.
 */
export function findPar(rules: readonly Rule[], start: string, rng: Rng): string {
  let best = minimize(rules, start);

  for (let round = 0; round < 24; round++) {
    const cap = chars(best).length - 1;
    if (cap < 1) break;

    const capped: Rule[] = [
      ...rules,
      {
        gen: '__cap',
        tier: 1,
        text: '',
        hint: '',
        tags: [],
        test: (pw) => chars(pw).length <= cap,
        progress: (pw) => ({ current: chars(pw).length, target: cap, label: '' }),
      },
    ];

    const attempt = solve(capped, rng, { steps: 3000, restarts: 5 });
    if (!attempt.ok) break;
    best = minimize(rules, attempt.password);
  }
  return best;
}

/**
 * Shrink a valid password while keeping every rule satisfied.
 * The result is the day's par — the shortest answer we know of.
 */
export function minimize(rules: readonly Rule[], pw: string): string {
  const valid = (s: string) => rules.every((r) => r.test(s));
  if (!valid(pw)) return pw;

  let current = pw;
  let improved = true;
  while (improved) {
    improved = false;
    const cs = chars(current);
    for (let i = 0; i < cs.length; i++) {
      const trimmed = cs.slice(0, i).concat(cs.slice(i + 1)).join('');
      if (valid(trimmed)) {
        current = trimmed;
        improved = true;
        break;
      }
    }
  }
  return current;
}
