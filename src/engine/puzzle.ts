import { buildDayContext } from './context';
import { buildRule, generatorsByTier, len } from './rules';
import { rngFromSeed, shuffle } from './rng';
import { findPar, shrink, solve } from './solver';
import type { Puzzle, Rule, Tier } from './types';

/** Difficulty curve of a day's eight rules: gentle start, one boss at the end. */
export const TIER_PLAN: readonly Tier[] = [1, 1, 2, 2, 2, 3, 3, 4];

/**
 * Choose the day's rules. At most one rule per exclusivity tag, so a puzzle
 * never asks for two conflicting lengths or two redundant capital-letter rules.
 */
export function selectRules(date: string, attempt: number, drop = 0): Rule[] {
  const ctx = buildDayContext(date);
  const order = rngFromSeed(`select:${date}:${attempt}`);
  const plan = TIER_PLAN.slice(0, TIER_PLAN.length - drop);

  const usedTags = new Set<string>();
  const usedGens = new Set<string>();
  const chosen: Rule[] = [];

  // Hardest tier first. The boss tiers have the fewest generators and the most
  // tags, so if the easy slots pick first they can block every candidate for
  // the last slot and leave the day a rule short.
  const byScarcity = plan.slice().sort((a, b) => b - a);

  for (const tier of byScarcity) {
    const candidates = shuffle(order, generatorsByTier(tier));
    for (const generator of candidates) {
      if (usedGens.has(generator.gen)) continue;
      // Parameters are seeded per generator so they do not depend on the
      // order candidates happen to be rejected in.
      const rule = buildRule(generator, rngFromSeed(`rule:${date}:${attempt}:${generator.gen}`), ctx);
      if (rule.tags.some((t) => usedTags.has(t))) continue;
      rule.tags.forEach((t) => usedTags.add(t));
      usedGens.add(generator.gen);
      chosen.push(rule);
      break;
    }
  }

  // Play order is the difficulty curve, not the order they were picked.
  return chosen.sort((a, b) => a.tier - b.tier);
}

/**
 * Build the puzzle for a date. Rule sets are rerolled until the solver proves
 * one is satisfiable, so an impossible combination can never reach a player.
 */
export function buildPuzzle(date: string): Puzzle {
  const ctx = buildDayContext(date);

  for (let drop = 0; drop < 3; drop++) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const rules = selectRules(date, attempt, drop);
      // A short set means tag conflicts blocked a slot — reroll rather than
      // quietly serving a day with fewer rules.
      if (rules.length !== TIER_PLAN.length - drop) continue;
      const result = solve(rules, rngFromSeed(`solve:${date}:${attempt}:${drop}`));
      if (!result.ok) continue;

      // Par has to be worth chasing, so spend real effort finding the
      // shortest answer rather than keeping whichever one turned up first.
      const polished = shrink(rules, result.password, rngFromSeed(`shrink:${date}:${attempt}`));
      const solution = findPar(rules, polished, rngFromSeed(`par:${date}:${attempt}`));
      return { ctx, rules, solution, par: len(solution) };
    }
  }

  // Unreachable in practice — the test suite checks years of dates.
  throw new Error(`No solvable puzzle found for ${date}`);
}

const cache = new Map<string, Puzzle>();

export function getPuzzle(date: string): Puzzle {
  const hit = cache.get(date);
  if (hit) return hit;
  const puzzle = buildPuzzle(date);
  cache.set(date, puzzle);
  return puzzle;
}
