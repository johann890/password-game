import {
  COUNTRIES, ELEMENTS, EMOJI_POOL, LEAP_YEARS, LENGTH_PRIMES, MONTHS,
  ROMAN_CHOICES, SPECIALS, VOWELS, isPrime, toRoman,
} from './data';
import { pick, randInt, sample, type Rng } from './rng';
import type { DayContext, Rule, Tier } from './types';

/* ------------------------------------------------------------------ helpers */

/** Code-point aware character list — emoji count as one character. */
export const chars = (pw: string): string[] => Array.from(pw);
export const len = (pw: string): number => chars(pw).length;
const digitsOf = (pw: string): string[] => pw.match(/\d/g) ?? [];
const digitSum = (pw: string): number => digitsOf(pw).reduce((a, d) => a + Number(d), 0);
const lettersOf = (pw: string): string[] => pw.match(/[a-zA-Z]/g) ?? [];
const has = (pw: string, token: string): boolean =>
  pw.toUpperCase().includes(token.toUpperCase());
/** Drop every digit so an exact numeric answer can be laid down cleanly. */
const stripDigits = (pw: string): string => pw.replace(/\d/g, '');

const DIGIT_TOKENS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** A rule before its generator id and tier are attached. */
type RuleBody = Omit<Rule, 'gen' | 'tier'>;

interface Generator {
  gen: string;
  tier: Tier;
  make: (rng: Rng, ctx: DayContext) => RuleBody;
}

const gens: Generator[] = [];
const def = (gen: string, tier: Tier, make: Generator['make']) => {
  gens.push({ gen, tier, make });
};

/* ------------------------------------------------------------ tier 1: warmup */

def('minLength', 1, (rng) => {
  const n = randInt(rng, 8, 14);
  return {
    text: `Must be at least *${n}* characters long.`,
    hint: `Pad it out — you need ${n} characters minimum.`,
    tags: ['length'],
    test: (pw) => len(pw) >= n,
    progress: (pw) => ({ current: len(pw), target: n, label: 'characters' }),
  };
});

def('hasDigit', 1, () => ({
  text: 'Must include at least one *number*.',
  hint: 'Any digit from 0 to 9 will do.',
  tags: ['digit-basic'],
  test: (pw) => /\d/.test(pw),
  tokens: DIGIT_TOKENS,
}));

def('hasUpper', 1, () => ({
  text: 'Must include at least one *capital letter*.',
  hint: 'Shift plus any letter.',
  tags: ['case'],
  test: (pw) => /[A-Z]/.test(pw),
  tokens: ['Q', 'K', 'Z'],
}));

def('hasSpecial', 1, (rng) => {
  const set = sample(rng, SPECIALS.split(''), 4);
  return {
    text: `Must include one of these symbols: *${set.join(' ')}*`,
    hint: `Try adding ${set[0]} somewhere.`,
    tags: ['special'],
    test: (pw) => set.some((s) => pw.includes(s)),
    tokens: set,
  };
});

def('vowelCount', 1, (rng) => {
  const n = randInt(rng, 2, 4);
  const count = (pw: string) =>
    chars(pw).filter((c) => VOWELS.includes(c.toUpperCase())).length;
  return {
    text: `Must contain at least *${n} vowels*.`,
    hint: 'A, E, I, O and U all count, in either case.',
    tags: ['vowel-count'],
    test: (pw) => count(pw) >= n,
    progress: (pw) => ({ current: count(pw), target: n, label: 'vowels' }),
    tokens: ['A', 'E', 'I', 'O', 'U'],
  };
});

def('letterInclude', 1, (rng) => {
  const letter = pick(rng, 'BCDFGHJKLMNPQRSTVWXYZ'.split(''));
  return {
    text: `Must contain the letter *${letter}*.`,
    hint: `Drop a ${letter} in — upper or lower case is fine.`,
    tags: [`letter-${letter}`],
    test: (pw) => has(pw, letter),
    tokens: [letter, letter.toLowerCase()],
  };
});

/* -------------------------------------------------------- tier 2: knowledge */

def('digitSum', 2, (rng) => {
  const n = randInt(rng, 18, 35);
  return {
    text: `The digits must add up to exactly *${n}*.`,
    hint: `Nines are efficient: ${'9'.repeat(Math.floor(n / 9))}${n % 9 || ''} sums to ${n}.`,
    tags: ['digitsum'],
    test: (pw) => digitSum(pw) === n,
    progress: (pw) => ({ current: digitSum(pw), target: n, label: 'digit sum' }),
    tokens: DIGIT_TOKENS,
    repair: (pw) => repairDigitSum(pw, n),
  };
});

/**
 * Candidate fixes for "digits must add up to N". Prefers edits that leave the
 * rest of the password alone, because other rules usually own some of those
 * digits (a leap year, a hex colour, today's date).
 */
function repairDigitSum(pw: string, n: number): string[] {
  const gap = n - digitSum(pw);
  if (gap === 0) return [];
  const out: string[] = [];

  if (gap > 0) {
    out.push(pw + '9'.repeat(Math.floor(gap / 9)) + (gap % 9 ? String(gap % 9) : ''));
  } else {
    const excess = -gap;
    const cs = chars(pw);
    // Shave the excess off a single digit, or drop one digit of exactly that value.
    for (let i = 0; i < cs.length; i++) {
      if (!/\d/.test(cs[i])) continue;
      const value = Number(cs[i]);
      if (value >= excess) {
        const copy = cs.slice();
        copy[i] = String(value - excess);
        out.push(copy.join(''));
      }
      if (value === excess) {
        out.push(cs.slice(0, i).concat(cs.slice(i + 1)).join(''));
      }
    }
  }

  // Last resort: clear every digit and lay down an exact set.
  const canonical = '9'.repeat(Math.floor(n / 9)) + (n % 9 ? String(n % 9) : '');
  out.push(stripDigits(pw) + canonical);
  return out;
}

def('wordOfDay', 2, (_rng, ctx) => ({
  text: `Must contain today's word: *${ctx.word}*`,
  hint: `Type ${ctx.word} anywhere in the password.`,
  tags: ['word'],
  test: (pw) => has(pw, ctx.word),
  tokens: [ctx.word, ctx.word.toLowerCase()],
}));

def('monthAny', 2, () => ({
  text: 'Must contain the name of a *month*.',
  hint: 'MAY is the shortest one.',
  tags: ['month'],
  test: (pw) => MONTHS.some((m) => has(pw, m)),
  tokens: ['MAY', 'JUNE', 'JULY', 'MARCH', 'may', 'june', 'july', 'march'],
}));

def('element', 2, (rng) => {
  const [symbol, name] = pick(rng, ELEMENTS);
  return {
    text: `Must contain the *chemical symbol* for ${name}.`,
    hint: `${name} is ${symbol}.`,
    tags: ['element'],
    test: (pw) => has(pw, symbol),
    tokens: [symbol, symbol.toLowerCase()],
  };
});

def('roman', 2, (rng) => {
  const n = pick(rng, ROMAN_CHOICES);
  const numeral = toRoman(n);
  return {
    text: `Must contain *${n}* written as a Roman numeral.`,
    hint: `${n} is ${numeral}.`,
    tags: ['roman'],
    test: (pw) => has(pw, numeral),
    tokens: [numeral, numeral.toLowerCase()],
  };
});

def('todayDay', 2, (_rng, ctx) => ({
  text: "Must contain today's *day of the month*.",
  hint: `Today is the ${ctx.day}${ctx.day === 1 ? 'st' : ctx.day === 2 ? 'nd' : ctx.day === 3 ? 'rd' : 'th'}.`,
  tags: ['datenum'],
  test: (pw) => pw.includes(String(ctx.day)),
  tokens: [String(ctx.day)],
}));

def('lengthMultiple', 2, (rng) => {
  const n = pick(rng, [3, 4, 5, 6]);
  return {
    text: `The length must be a multiple of *${n}*.`,
    hint: `Add or remove characters until the count divides by ${n}.`,
    tags: ['length'],
    test: (pw) => len(pw) > 0 && len(pw) % n === 0,
    progress: (pw) => ({
      current: len(pw),
      target: Math.max(n, Math.ceil(len(pw) / n) * n),
      label: 'characters',
    }),
    repair: (pw) => {
      const target = Math.max(n, Math.ceil(len(pw) / n) * n);
      const cs = chars(pw);
      return [cs.join('') + 'x'.repeat(target - cs.length), cs.slice(0, Math.floor(cs.length / n) * n).join('')];
    },
  };
});

def('country', 2, (rng) => {
  const [code, name] = pick(rng, COUNTRIES);
  return {
    text: `Must contain the two-letter *country code* for ${name}.`,
    hint: `${name} is ${code}.`,
    tags: ['country'],
    test: (pw) => has(pw, code),
    tokens: [code, code.toLowerCase()],
  };
});

def('emojiSet', 2, (rng) => {
  const set = sample(rng, EMOJI_POOL, 3);
  return {
    text: `Must contain one of these: *${set.join(' ')}*`,
    hint: 'Copy one straight out of the rule.',
    tags: ['emoji'],
    test: (pw) => set.some((e) => pw.includes(e)),
    tokens: set,
  };
});

def('weekday', 2, (_rng, ctx) => ({
  text: "Must contain the *three-letter abbreviation* for today's weekday.",
  hint: `Today is ${ctx.weekdayShort}.`,
  tags: ['weekday'],
  test: (pw) => has(pw, ctx.weekdayShort),
  tokens: [ctx.weekdayShort, ctx.weekdayShort.toLowerCase()],
}));

def('moon', 2, (_rng, ctx) => ({
  text: "Must contain tonight's *moon phase* as an emoji.",
  hint: `Tonight the moon looks like ${ctx.moon}.`,
  tags: ['emoji'],
  test: (pw) => pw.includes(ctx.moon),
  tokens: [ctx.moon],
}));

/* ------------------------------------------------------------ tier 3: spicy */

def('letterCap', 3, (rng) => {
  const n = pick(rng, [2, 3]);
  const worst = (pw: string) => {
    const counts = new Map<string, number>();
    for (const c of lettersOf(pw)) {
      const k = c.toUpperCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Math.max(0, ...counts.values());
  };
  return {
    text: `No letter may appear more than *${n} times*.`,
    hint: 'Case does not save you — A and a are the same letter here.',
    tags: ['repeat'],
    test: (pw) => worst(pw) <= n,
    progress: (pw) => ({ current: worst(pw), target: n, label: 'most repeated letter' }),
    repair: (pw) => {
      const counts = new Map<string, number>();
      const cs = chars(pw);
      const kept = cs.filter((c) => {
        if (!/[a-zA-Z]/.test(c)) return true;
        const key = c.toUpperCase();
        const seen = (counts.get(key) ?? 0) + 1;
        counts.set(key, seen);
        return seen <= n;
      });
      return [kept.join('')];
    },
  };
});

def('digitPosition', 3, (rng) => {
  const n = randInt(rng, 2, 8);
  return {
    text: `Character number *${n}* must be a digit.`,
    hint: `Count ${n} places from the left and make that one a number.`,
    tags: ['position'],
    test: (pw) => {
      const c = chars(pw)[n - 1];
      return !!c && /\d/.test(c);
    },
    repair: (pw) => {
      const cs = chars(pw);
      while (cs.length < n) cs.push('x');
      cs[n - 1] = '7';
      return [cs.join('')];
    },
  };
});

def('palindrome', 3, () => {
  const isPal = (s: string) => s === s.split('').reverse().join('');
  const find = (pw: string) => {
    const s = pw.toUpperCase();
    for (let i = 0; i < s.length; i++) {
      for (const width of [3, 4]) {
        const part = s.slice(i, i + width);
        if (part.length === width && isPal(part)) return true;
      }
    }
    return false;
  };
  return {
    text: 'Must contain a *palindrome* at least 3 characters long.',
    hint: 'Something like ABA, 121 or NOON.',
    tags: ['palindrome'],
    test: find,
    tokens: ['aba', '121', 'xyx', 'noon', '737', 'ABA', 'XYX'],
  };
});

def('digitsEqualLetters', 3, () => ({
  text: 'The digits must add up to the *number of letters*.',
  hint: 'Change the digits, not the letters — it is easier.',
  tags: ['digitsum'],
  test: (pw) => lettersOf(pw).length > 0 && digitSum(pw) === lettersOf(pw).length,
  progress: (pw) => ({
    current: digitSum(pw),
    target: lettersOf(pw).length,
    label: 'digit sum vs letters',
  }),
  tokens: DIGIT_TOKENS,
  repair: (pw) => {
    const base = stripDigits(pw);
    const want = lettersOf(base).length;
    const nines = '9'.repeat(Math.floor(want / 9));
    const rest = want % 9;
    return [base + nines + (rest ? String(rest) : '')];
  },
}));

def('hexColor', 3, (_rng, ctx) => ({
  text: "Must contain today's *colour code* (without the #).",
  hint: `Today's colour is ${ctx.color}.`,
  tags: ['color'],
  swatch: ctx.color,
  test: (pw) => has(pw, ctx.color.slice(1)),
  tokens: [ctx.color.slice(1), ctx.color.slice(1).toLowerCase()],
}));

def('mathAnswer', 3, (rng) => {
  const a = randInt(rng, 4, 12);
  const b = randInt(rng, 3, 9);
  const c = randInt(rng, 1, Math.max(1, Math.min(15, a * b - 10)));
  const answer = String(a * b - c);
  return {
    text: `Must contain the answer to *${a} × ${b} − ${c}*.`,
    hint: `${a} × ${b} − ${c} = ${answer}.`,
    tags: ['math'],
    test: (pw) => pw.includes(answer),
    tokens: [answer],
  };
});

def('bookend', 3, () => ({
  text: 'Must *start and end* with the same character.',
  hint: 'Look at your first character, then type it again at the end.',
  tags: ['bookend'],
  test: (pw) => {
    const cs = chars(pw);
    return cs.length >= 2 && cs[0] === cs[cs.length - 1];
  },
  repair: (pw) => {
    const cs = chars(pw);
    return cs.length ? [pw + cs[0]] : [];
  },
}));

def('nthUpper', 3, (rng) => {
  const n = randInt(rng, 3, 7);
  return {
    text: `Character number *${n}* must be a capital letter.`,
    hint: `Count to ${n} from the left and capitalise that one.`,
    tags: ['case', 'position'],
    test: (pw) => {
      const c = chars(pw)[n - 1];
      return !!c && /[A-Z]/.test(c);
    },
    repair: (pw) => {
      const cs = chars(pw);
      while (cs.length < n) cs.push('x');
      cs[n - 1] = 'Q';
      return [cs.join('')];
    },
  };
});

def('ascendingDigits', 3, () => {
  const find = (pw: string) => {
    const cs = chars(pw);
    for (let i = 0; i + 2 < cs.length; i++) {
      const [a, b, c] = cs.slice(i, i + 3);
      if (/\d/.test(a) && /\d/.test(b) && /\d/.test(c) && +a < +b && +b < +c) return true;
    }
    return false;
  };
  return {
    text: 'Must contain three digits in a row that *increase* (like 357).',
    hint: 'Three adjacent digits, each bigger than the last.',
    tags: ['ascending', 'digitcount'],
    test: find,
    tokens: ['123', '357', '468', '159', '289'],
  };
});

def('noVowelTail', 3, (rng) => {
  const n = randInt(rng, 3, 5);
  return {
    text: `The *last ${n} characters* must contain no vowels.`,
    hint: 'Finish on consonants, digits or symbols.',
    tags: ['vowel-tail'],
    test: (pw) => {
      const cs = chars(pw);
      if (cs.length < n) return false;
      return cs.slice(-n).every((c) => !VOWELS.includes(c.toUpperCase()));
    },
    repair: (pw) => [pw + '7zzzz'.slice(0, n)],
  };
});

/* -------------------------------------------------------------- tier 4: boss */

def('selfLength', 4, () => ({
  text: 'Must contain *its own length*, written as a number.',
  hint: 'Count your characters, then type that number — which changes the count.',
  tags: ['length', 'self'],
  test: (pw) => len(pw) > 0 && pw.includes(String(len(pw))),
  repair: (pw) => {
    const base = stripDigits(pw);
    const out: string[] = [];
    for (let total = 2; total <= 60; total++) {
      const candidate = base + String(total);
      if (len(candidate) === total) out.push(candidate);
    }
    return out;
  },
}));

def('acrostic', 4, (_rng, ctx) => ({
  text: `The *capital letters*, read in order, must spell *${ctx.code}*.`,
  hint: `Exactly three capitals: ${ctx.code[0]}, then ${ctx.code[1]}, then ${ctx.code[2]}.`,
  tags: ['case'],
  test: (pw) => (pw.match(/[A-Z]/g) ?? []).join('') === ctx.code,
  tokens: [ctx.code],
  repair: (pw) => [pw.replace(/[A-Z]/g, (c) => c.toLowerCase()) + ctx.code],
}));

def('exactlyThrice', 4, () => {
  const thrice = (pw: string) => {
    const counts = new Map<string, number>();
    for (const c of chars(pw)) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.values()].some((v) => v === 3);
  };
  return {
    text: 'Some single character must appear *exactly three times*.',
    hint: 'Pick a character you already use and make it three — no more.',
    tags: ['repeat'],
    test: thrice,
    repair: (pw) => ['k'.repeat(3) + pw, pw + 'k'.repeat(3)],
  };
});

def('leapYear', 4, () => ({
  text: 'Must contain a *leap year*.',
  hint: 'Any year divisible by 4, like 2024.',
  tags: ['year', 'digitcount'],
  test: (pw) => LEAP_YEARS.some((y) => pw.includes(y)),
  tokens: [...LEAP_YEARS],
}));

def('primeLength', 4, () => ({
  text: 'The total length must be a *prime number*.',
  hint: `Aim for ${LENGTH_PRIMES.join(', ')}.`,
  tags: ['length'],
  test: (pw) => isPrime(len(pw)),
  progress: (pw) => ({
    current: len(pw),
    target: LENGTH_PRIMES.find((p) => p >= len(pw)) ?? len(pw),
    label: 'characters',
  }),
  repair: (pw) => {
    const target = LENGTH_PRIMES.find((p) => p >= len(pw));
    return target ? [pw + 'z'.repeat(target - len(pw))] : [];
  },
}));

/* ----------------------------------------------------------------- registry */

export const GENERATORS: readonly Generator[] = gens;

export function generatorsByTier(tier: Tier): Generator[] {
  return gens.filter((g) => g.tier === tier);
}

export function buildRule(g: Generator, rng: Rng, ctx: DayContext): Rule {
  const body = g.make(rng, ctx);
  return {
    gen: g.gen,
    tier: g.tier,
    ...body,
    // An empty password satisfies nothing. Without this, rules phrased as
    // prohibitions ("no letter more than twice") would start out green.
    test: (pw) => pw.length > 0 && body.test(pw),
  };
}
