import { describe, expect, it } from 'vitest';
import { buildDayContext, EPOCH, puzzleIndex, toDateKey } from '../context';
import { HOGWARTS, NBA_TEAMS, PLANETS, STAR_WARS, ordinal } from '../data';
import { GENERATORS, buildRule, len } from '../rules';
import { mulberry32, rngFromSeed } from '../rng';
import { minimize, scoreOf, shrink, solve } from '../solver';
import { TIER_PLAN, buildPuzzle, selectRules } from '../puzzle';

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

  it('writes ordinals correctly', () => {
    expect([1, 2, 3, 4, 8, 11, 12, 13, 21, 22].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '8th', '11th', '12th', '13th', '21st', '22nd',
    ]);
  });
});

describe('rule selection', () => {
  it('follows the tier plan with no duplicate generators or conflicting tags', () => {
    for (const date of YEAR) {
      const rules = selectRules(date, 0);
      expect(rules.map((r) => r.tier)).toEqual([...TIER_PLAN]);

      const gens = rules.map((r) => r.gen);
      expect(new Set(gens).size, date).toBe(gens.length);

      const tags = rules.flatMap((r) => r.tags);
      expect(new Set(tags).size, `${date}: ${tags.join(',')}`).toBe(tags.length);
    }
  });
});

describe('solver', () => {
  it('scores a fully satisfied password at the rule count', () => {
    const rules = selectRules(EPOCH, 0);
    const { password } = solve(rules, rngFromSeed('s'));
    expect(scoreOf(rules, password)).toBeCloseTo(rules.length);
  });

  it('minimize keeps the password valid', () => {
    const rules = selectRules(EPOCH, 0);
    const solved = solve(rules, rngFromSeed('s')).password;
    const small = minimize(rules, solved);
    expect(rules.every((r) => r.test(small))).toBe(true);
    expect(len(small)).toBeLessThanOrEqual(len(solved));
  });

  it('shrink keeps the password valid and no longer', () => {
    for (const date of YEAR.slice(0, 25)) {
      const rules = selectRules(date, 0);
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

  it('uses every generator at least once across the year', () => {
    const seen = new Set(puzzles.flatMap((p) => p.rules.map((r) => r.gen)));
    const unused = GENERATORS.map((g) => g.gen).filter((g) => !seen.has(g));
    expect(unused).toEqual([]);
  });
});
