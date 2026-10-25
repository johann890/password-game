/** Static puzzle vocabulary. Kept small, common and family-friendly on purpose. */

export const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
] as const;

export const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Word of the day pool — 5 to 7 letters, instantly recognisable. */
export const WORDS = [
  'PLANET', 'ROCKET', 'GUITAR', 'MARBLE', 'CANDLE', 'FOREST', 'SILVER', 'TUNNEL',
  'ORBIT', 'RIVER', 'STORM', 'CLOUD', 'EMBER', 'PRISM', 'QUARTZ', 'GLACIER',
  'LANTERN', 'MAGNET', 'VELVET', 'COMPASS', 'HARBOR', 'MEADOW', 'PEBBLE', 'SADDLE',
  'TEMPLE', 'WALNUT', 'ZEPHYR', 'BRONZE', 'CACTUS', 'DRAGON', 'FALCON', 'GARDEN',
  'HAMMER', 'ISLAND', 'JUNGLE', 'KETTLE', 'LADDER', 'OYSTER',
  'PUDDLE', 'RIBBON', 'SHADOW', 'THUNDER', 'UMBRELLA', 'VOLCANO', 'WHISTLE', 'YELLOW',
  'ANCHOR', 'BUTTON', 'COPPER', 'DIAMOND', 'ENGINE', 'FEATHER', 'GRAVEL', 'HOLLOW',
  'INDIGO', 'JACKET', 'KNIGHT', 'LIZARD', 'MARKET', 'NEBULA', 'OCTAVE', 'PARROT',
  'QUIVER', 'SPIRE', 'SPIRAL', 'TOWEL', 'VIOLET', 'WAGON', 'ZIGZAG', 'BAMBOO',
  'CAMERA', 'DONKEY', 'ECLIPSE', 'FIDDLE', 'GIRAFFE', 'HELMET', 'IGLOO', 'JIGSAW',
  'KOALA', 'LEMON', 'NUTMEG', 'ONION', 'PENGUIN', 'QUILT', 'RADISH',
  'SPONGE', 'TRUMPET', 'UNICORN', 'VACUUM', 'WALRUS', 'YOGURT', 'ZOMBIE', 'ACORN',
  'BADGER', 'CARPET', 'DAHLIA', 'EAGLE', 'FABRIC', 'GOBLIN', 'HOTEL', 'IVORY',
  'JELLY', 'KARATE', 'LOTUS', 'MOSAIC', 'NICKEL', 'ORCHID', 'PIGEON', 'QUARRY',
  'RUBBER', 'SALMON', 'TOFFEE', 'URCHIN', 'VANILLA', 'WILLOW', 'XYLOPHONE', 'YONDER',
] as const;

/** [symbol, element name] — only unambiguous, well-known ones. */
export const ELEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['Au', 'gold'], ['Ag', 'silver'], ['Fe', 'iron'], ['Cu', 'copper'], ['Pb', 'lead'],
  ['Sn', 'tin'], ['He', 'helium'], ['Ne', 'neon'], ['Na', 'sodium'], ['Mg', 'magnesium'],
  ['Al', 'aluminium'], ['Si', 'silicon'], ['Ca', 'calcium'], ['Zn', 'zinc'], ['Ni', 'nickel'],
  ['Hg', 'mercury'], ['Pt', 'platinum'], ['Kr', 'krypton'], ['Ti', 'titanium'], ['Li', 'lithium'],
];

/** [ISO 3166-1 alpha-2, country name] */
export const COUNTRIES: ReadonlyArray<readonly [string, string]> = [
  ['NZ', 'New Zealand'], ['JP', 'Japan'], ['BR', 'Brazil'], ['DE', 'Germany'],
  ['KE', 'Kenya'], ['IN', 'India'], ['MX', 'Mexico'], ['EG', 'Egypt'],
  ['CA', 'Canada'], ['FR', 'France'], ['IT', 'Italy'], ['NO', 'Norway'],
  ['PE', 'Peru'], ['TH', 'Thailand'], ['GH', 'Ghana'], ['IS', 'Iceland'],
  ['VN', 'Vietnam'], ['CL', 'Chile'], ['PL', 'Poland'], ['MA', 'Morocco'],
];

/** Emoji pools for the "must contain one of these" rule. Single code point where possible. */
export const EMOJI_POOL = [
  '🌙', '⭐', '🔥', '🌊', '🍋', '🎹', '🧊', '🪐', '🌵', '🦊',
  '🍄', '⚡', '🎲', '🧲', '🐙', '🌻', '🥐', '🛸', '🧩', '🪃',
] as const;

export const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] as const;

export const SPECIALS = '!@#$%^&*?+=~' as const;

export const VOWELS = 'AEIOU' as const;

export const LEAP_YEARS = [
  '1984', '1988', '1992', '1996', '2000', '2004', '2008', '2012', '2016', '2020', '2024', '2028',
] as const;

const ROMAN_TABLE: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  let out = '';
  let left = n;
  for (const [value, numeral] of ROMAN_TABLE) {
    while (left >= value) {
      out += numeral;
      left -= value;
    }
  }
  return out;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

/** Primes we are willing to demand as a password length. */
/** True when no letter occurs three or more times — keeps "letterCap" satisfiable. */
export function noTripleLetter(text: string): boolean {
  const counts = new Map<string, number>();
  for (const c of text.toUpperCase()) {
    if (!/[A-Z]/.test(c)) continue;
    const next = (counts.get(c) ?? 0) + 1;
    if (next >= 3) return false;
    counts.set(c, next);
  }
  return true;
}

/**
 * Numbers 4..39 whose Roman numeral has no letter three times over.
 * Excludes XXX and friends, which can never coexist with "no letter more
 * than twice".
 */
export const ROMAN_CHOICES: readonly number[] = Array.from(
  { length: 36 },
  (_, i) => i + 4,
).filter((n) => noTripleLetter(toRoman(n)));

export const LENGTH_PRIMES = [11, 13, 17, 19, 23, 29, 31] as const;
