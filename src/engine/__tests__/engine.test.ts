import { describe, expect, it } from 'vitest';
import { buildDayContext, EPOCH, puzzleIndex, toDateKey } from '../context';
import {
  CAPITALS, FILMS, GAMES, GREEK, HOGWARTS, MUSIC, NBA_TEAMS, PLANETS, SCIENCE,
  STAR_WARS, TRIPLE_PRODUCTS, caesar, digitTriples, isPrime, nextPrime,
  noTripleLetter, ordinal, toBinary,
} from '../data';
import { GENERATORS, buildRule, len } from '../rules';
import { mulberry32, rngFromSeed } from '../rng';
import { minimize, scoreOf, shrink, solve } from '../solver';
import { HARD_PLAN, MODES, MODE_LIST, TIER_PLAN, buildPuzzle, ruleCount, selectRules } from '../puzzle';

/** A run of consecutive dates starting at the epoch. */
function dates(count: number): string[] {
  const [y, m, d] = EPOCH.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d + i));
    return date.toISOString().slice(0, 10);
  });
}

const YEAR = dates(370);

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = Array.from({ length: 5 }, mulberry32(42));
    const b = Array.from({ length: 5 }, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('differs across seeds', () => {
    expect(rngFromSeed('a')()).not.toEqual(rngFromSeed('b')());
  });
});

describe('dates', () => {
  it('numbers the epoch as puzzle 1', () => {
    expect(puzzleIndex(EPOCH)).toBe(1);
  });

  it('increments one per day', () => {
    expect(puzzleIndex('2026-10-26')).toBe(2);
    expect(puzzleIndex('2026-11-25')).toBe(32);
  });

  it('uses the local calendar date, not UTC', () => {
    // Late evening local time must still report the local day.
    const d = new Date(2026, 9, 25, 23, 30);
    expect(toDateKey(d)).toBe('2026-10-25');
  });

  it('builds a context with every field populated', () => {
    for (const date of YEAR.slice(0, 40)) {
      const ctx = buildDayContext(date);
      expect(ctx.word).toMatch(/^[A-Z]+$/);
      expect(ctx.color).toMatch(/^#[0-9A-F]{6}$/);
      expect(ctx.code).toMatch(/^[A-Z]{3}$/);
      expect(ctx.moon).toBeTruthy();
      expect(ctx.weekdayShort).toMatch(/^[A-Z]{3}$/);
    }
  });
});

describe('rule generators', () => {
  it('all produce well-formed rules', () => {
    const ctx = buildDayContext(EPOCH);
    for (const generator of GENERATORS) {
      for (let seed = 0; seed < 8; seed++) {
        const rule = buildRule(generator, rngFromSeed(`t:${generator.gen}:${seed}`), ctx);
        expect(rule.text, generator.gen).toBeTruthy();
        expect(rule.hint, generator.gen).toBeTruthy();
        expect(rule.tags.length, generator.gen).toBeGreaterThan(0);
        expect(typeof rule.test, generator.gen).toBe('function');
      }
    }
  });

  it('never throws on hostile input', () => {
    const ctx = buildDayContext(EPOCH);
    const inputs = ['', ' ', 'a', '🌙', '🌙🌙🌙', '0', '-1', 'A'.repeat(200), '\n\t', '👨‍👩‍👧'];
    for (const generator of GENERATORS) {
      const rule = buildRule(generator, rngFromSeed(`h:${generator.gen}`), ctx);
      for (const input of inputs) {
        expect(() => rule.test(input), `${generator.gen} / ${JSON.stringify(input)}`).not.toThrow();
        expect(() => rule.progress?.(input), generator.gen).not.toThrow();
        expect(() => rule.repair?.(input), generator.gen).not.toThrow();
      }
    }
  });

  it('rejects the empty password in every rule', () => {
    const ctx = buildDayContext(EPOCH);
    for (const generator of GENERATORS) {
      const rule = buildRule(generator, rngFromSeed(`e:${generator.gen}`), ctx);
      expect(rule.test(''), generator.gen).toBe(false);
    }
  });
});

describe('pop culture answers', () => {
  const HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  it('puts every Hogwarts character in a real house', () => {
    for (const [character, house] of HOGWARTS) {
      expect(HOUSES, character).toContain(house);
      expect(character.length).toBeGreaterThan(2);
    }
  });

  it('names each character once, so the clue has one answer', () => {
    const names = HOGWARTS.map(([character]) => character);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every NBA city exactly one single-word nickname', () => {
    const cities = NBA_TEAMS.map(([city]) => city);
    expect(new Set(cities).size, 'a city with two teams has an ambiguous answer')
      .toBe(cities.length);

    for (const [city, team] of NBA_TEAMS) {
      expect(team, city).toMatch(/^[A-Za-z]+$/);
      expect(team.length, city).toBeGreaterThan(3);
    }
  });

  it('keeps the planets in order from the Sun', () => {
    expect(PLANETS).toEqual([
      'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
    ]);
  });

  it('uses Star Wars names that cannot hide inside ordinary words', () => {
    // "Han" sits inside Johann, "Rey" inside grey — such a rule would satisfy
    // itself by accident.
    for (const name of STAR_WARS) {
      expect(name.length, name).toBeGreaterThanOrEqual(4);
    }
    expect(new Set(STAR_WARS.map((n) => n.toLowerCase())).size).toBe(STAR_WARS.length);
  });

  it('keeps every added answer typeable, findable and repeatable', () => {
    const lists: [string, ReadonlyArray<readonly [string, string]>][] = [
      ['SCIENCE', SCIENCE], ['FILMS', FILMS], ['GAMES', GAMES],
      ['MUSIC', MUSIC], ['CAPITALS', CAPITALS], ['GREEK', GREEK],
    ];

    for (const [name, list] of lists) {
      for (const [clue, answer] of list) {
        // One plain word: the player types this into a password field.
        expect(answer, `${name}: ${clue}`).toMatch(/^[A-Za-z]+$/);
        // Four letters and up, or it hides inside ordinary words and the
        // rule satisfies itself by accident.
        expect(answer.length, `${name}: ${answer}`).toBeGreaterThanOrEqual(4);
        // No letter three times over, so it can coexist with the repeat cap.
        expect(noTripleLetter(answer), `${name}: ${answer}`).toBe(true);
      }

      const clues = list.map(([clue]) => clue.toLowerCase());
      expect(new Set(clues).size, `${name} asks the same thing twice`).toBe(clues.length);
      const answers = list.map(([, answer]) => answer.toLowerCase());
      expect(new Set(answers).size, `${name} has two clues with one answer`).toBe(answers.length);
    }
  });

  it('writes ordinals correctly', () => {
    expect([1, 2, 3, 4, 8, 11, 12, 13, 21, 22].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '8th', '11th', '12th', '13th', '21st', '22nd',
    ]);
  });
});

describe('hard mode arithmetic', () => {
  it('shifts letters through the alphabet and wraps at Z', () => {
    expect(caesar('ZEBRA', 1)).toBe('AFCSB');
    expect(caesar('Guitar', 1)).toBe('Hvjubs');
  });

  it('offers several three-digit runs for every product it asks for', () => {
    expect(TRIPLE_PRODUCTS.length).toBeGreaterThan(5);
    for (const n of TRIPLE_PRODUCTS) {
      const triples = digitTriples(n);
      expect(triples.length, `${n}`).toBeGreaterThanOrEqual(3);
      for (const t of triples) {
        expect([...t].reduce((a, d) => a * Number(d), 1), t).toBe(n);
      }
    }
  });

  it('writes binary and finds the next prime', () => {
    expect(toBinary(19)).toBe('10011');
    expect(toBinary(45)).toBe('101101');
    expect([4, 14, 17, 30].map(nextPrime)).toEqual([5, 17, 17, 31]);
    expect(isPrime(nextPrime(100))).toBe(true);
  });
});

describe('rule selection', () => {
  it.each(MODE_LIST)('follows the %s tier plan with no duplicate generators or conflicting tags', (mode) => {
    for (const date of YEAR) {
      const rules = selectRules(date, mode, 0);
      expect(rules.map((r) => r.tier)).toEqual([...MODES[mode].plan]);

      const gens = rules.map((r) => r.gen);
      expect(new Set(gens).size, date).toBe(gens.length);

      const tags = rules.flatMap((r) => r.tags);
      expect(new Set(tags).size, `${date}: ${tags.join(',')}`).toBe(tags.length);
    }
  });
});

describe('solver', () => {
  it('scores a fully satisfied password at the rule count', () => {
    const rules = selectRules(EPOCH, 'daily', 0);
    const { password } = solve(rules, rngFromSeed('s'));
    expect(scoreOf(rules, password)).toBeCloseTo(rules.length);
  });

  it('minimize keeps the password valid', () => {
    const rules = selectRules(EPOCH, 'daily', 0);
    const solved = solve(rules, rngFromSeed('s')).password;
    const small = minimize(rules, solved);
    expect(rules.every((r) => r.test(small))).toBe(true);
    expect(len(small)).toBeLessThanOrEqual(len(solved));
  });

  it('shrink keeps the password valid and no longer', () => {
    for (const date of YEAR.slice(0, 25)) {
      const rules = selectRules(date, 'daily', 0);
      const solved = solve(rules, rngFromSeed(`s:${date}`));
      if (!solved.ok) continue;
      const small = shrink(rules, solved.password, rngFromSeed(`sh:${date}`));
      expect(rules.every((r) => r.test(small)), date).toBe(true);
      expect(len(small), date).toBeLessThanOrEqual(len(solved.password));
    }
  });
});

describe('daily puzzles', () => {
  const puzzles = YEAR.map((date) => buildPuzzle(date));

  it('produces a solvable 8-rule puzzle every day for a year', () => {
    puzzles.forEach((puzzle, i) => {
      expect(puzzle.rules.length, YEAR[i]).toBe(TIER_PLAN.length);
      expect(
        puzzle.rules.filter((r) => !r.test(puzzle.solution)).map((r) => r.gen),
        `${YEAR[i]} unsatisfied`,
      ).toEqual([]);
      expect(puzzle.par, YEAR[i]).toBe(len(puzzle.solution));
      expect(puzzle.par, YEAR[i]).toBeGreaterThan(0);
    });
  });

  it('keeps par in a humane range', () => {
    const pars = puzzles.map((p) => p.par);
    // Generation rerolls a rule set whose shortest answer exceeds 40.
    expect(Math.max(...pars)).toBeLessThanOrEqual(45);
  });

  it('is deterministic — same date, same puzzle', () => {
    for (const date of YEAR.slice(0, 30)) {
      const a = buildPuzzle(date);
      const b = buildPuzzle(date);
      expect(b.rules.map((r) => r.text)).toEqual(a.rules.map((r) => r.text));
      expect(b.solution).toEqual(a.solution);
      expect(b.par).toEqual(a.par);
    }
  });

  it('varies from day to day', () => {
    const signatures = new Set(puzzles.map((p) => p.rules.map((r) => r.gen).join('|')));
    expect(signatures.size).toBeGreaterThan(YEAR.length * 0.8);
  });

  it('uses every generator the daily plan can reach, across the year', () => {
    const seen = new Set(puzzles.flatMap((p) => p.rules.map((r) => r.gen)));
    const reachable = GENERATORS.filter((g) => TIER_PLAN.includes(g.tier));
    expect(reachable.map((g) => g.gen).filter((g) => !seen.has(g))).toEqual([]);
  });

  it('never serves a hard-mode rule', () => {
    const tiers = new Set(puzzles.flatMap((p) => p.rules.map((r) => r.tier)));
    expect([...tiers].filter((t) => t === 5)).toEqual([]);
  });
});

describe('hard puzzles', () => {
  // A shorter run than the daily year: twelve rules cost the solver real
  // time, and the point here is that none of them is ever impossible.
  const DAYS = YEAR.slice(0, 120);
  const puzzles = DAYS.map((date) => buildPuzzle(date, 'hard'));

  it('produces a solvable 12-rule puzzle every day', () => {
    puzzles.forEach((puzzle, i) => {
      expect(puzzle.rules.length, DAYS[i]).toBe(HARD_PLAN.length);
      expect(puzzle.mode, DAYS[i]).toBe('hard');
      expect(
        puzzle.rules.filter((r) => !r.test(puzzle.solution)).map((r) => r.gen),
        `${DAYS[i]} unsatisfied`,
      ).toEqual([]);
      expect(puzzle.par, DAYS[i]).toBe(len(puzzle.solution));
    });
  });

  it('keeps par reachable rather than sprawling', () => {
    expect(Math.max(...puzzles.map((p) => p.par))).toBeLessThanOrEqual(70);
  });

  it('is harder than the daily puzzle, not merely longer', () => {
    const daily = DAYS.map((date) => buildPuzzle(date));
    const mean = (ns: number[]) => ns.reduce((a, b) => a + b, 0) / ns.length;

    // More rules, drawn from higher tiers, with a longer shortest answer.
    expect(ruleCount('hard')).toBeGreaterThan(ruleCount('daily'));
    expect(mean(puzzles.flatMap((p) => p.rules.map((r) => r.tier))))
      .toBeGreaterThan(mean(daily.flatMap((p) => p.rules.map((r) => r.tier))));
    expect(mean(puzzles.map((p) => p.par))).toBeGreaterThan(mean(daily.map((p) => p.par)));

    // And no warm-up rules at all.
    expect(puzzles.flatMap((p) => p.rules.map((r) => r.tier)).filter((t) => t === 1)).toEqual([]);
  });

  it('reaches every tier 5 generator and keeps the days varied', () => {
    const seen = new Set(puzzles.flatMap((p) => p.rules.map((r) => r.gen)));
    const bosses = GENERATORS.filter((g) => g.tier === 5).map((g) => g.gen);
    expect(bosses.filter((g) => !seen.has(g))).toEqual([]);

    const signatures = new Set(puzzles.map((p) => p.rules.map((r) => r.gen).join('|')));
    expect(signatures.size).toBeGreaterThan(DAYS.length * 0.8);
  });

  it('is deterministic, and distinct from the daily puzzle', () => {
    for (const date of DAYS.slice(0, 10)) {
      expect(buildPuzzle(date, 'hard').solution).toEqual(buildPuzzle(date, 'hard').solution);
      expect(buildPuzzle(date, 'hard').rules.map((r) => r.gen))
        .not.toEqual(buildPuzzle(date).rules.map((r) => r.gen));
    }
  });
});
