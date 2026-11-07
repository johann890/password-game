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

/* ------------------------------------------------------------ pop culture */
/*
 * Every entry below is checked by exact substring match, so each list holds
 * only unambiguous answers: one team per city, one house per character.
 */

/** [character, house] — only characters whose house is stated outright. */
export const HOGWARTS: ReadonlyArray<readonly [string, string]> = [
  ['Harry Potter', 'Gryffindor'],
  ['Hermione Granger', 'Gryffindor'],
  ['Ron Weasley', 'Gryffindor'],
  ['Neville Longbottom', 'Gryffindor'],
  ['Luna Lovegood', 'Ravenclaw'],
  ['Cho Chang', 'Ravenclaw'],
  ['Cedric Diggory', 'Hufflepuff'],
  ['Nymphadora Tonks', 'Hufflepuff'],
  ['Draco Malfoy', 'Slytherin'],
  ['Severus Snape', 'Slytherin'],
];

/**
 * [city, nickname] — single-team cities with a one-word nickname only.
 * Los Angeles is left out (two teams), as are Portland (Trail Blazers is two
 * words) and Philadelphia (76ers would collide with the digit rules).
 */
export const NBA_TEAMS: ReadonlyArray<readonly [string, string]> = [
  ['Boston', 'Celtics'], ['Chicago', 'Bulls'], ['Miami', 'Heat'],
  ['Denver', 'Nuggets'], ['Phoenix', 'Suns'], ['Toronto', 'Raptors'],
  ['Orlando', 'Magic'], ['Milwaukee', 'Bucks'], ['Detroit', 'Pistons'],
  ['Memphis', 'Grizzlies'], ['Houston', 'Rockets'], ['Indiana', 'Pacers'],
  ['Atlanta', 'Hawks'], ['Sacramento', 'Kings'], ['Utah', 'Jazz'],
  ['Brooklyn', 'Nets'], ['Dallas', 'Mavericks'], ['Minnesota', 'Timberwolves'],
  ['Cleveland', 'Cavaliers'], ['Charlotte', 'Hornets'], ['Washington', 'Wizards'],
  ['New Orleans', 'Pelicans'], ['San Antonio', 'Spurs'], ['Golden State', 'Warriors'],
  ['Oklahoma City', 'Thunder'], ['New York', 'Knicks'],
];

/**
 * Distinctive Star Wars names. Short ones that hide inside ordinary words
 * (Han in "Johann", Rey in "grey") are deliberately left out, or the rule
 * would satisfy itself by accident.
 */
export const STAR_WARS = [
  'Yoda', 'Luke', 'Leia', 'Vader', 'Anakin', 'Lando', 'Grogu',
  'Chewbacca', 'Palpatine', 'Kenobi', 'Skywalker', 'Jabba', 'Ahsoka',
] as const;

/** In order from the Sun. Pluto is not a planet. */
export const PLANETS = [
  'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
] as const;

export function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

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

/** The smallest prime greater than or equal to n. */
export function nextPrime(n: number): number {
  let candidate = Math.max(2, Math.ceil(n));
  while (!isPrime(candidate)) candidate++;
  return candidate;
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

/* ---------------------------------------------------- knowledge & culture */
/*
 * Added for variety. Every answer is a single alphabetic word, because the
 * player types it into a password field and the test is a substring match —
 * spaces, hyphens and accents would all be traps rather than puzzles.
 *
 * Two further constraints, both enforced by the test suite:
 *  - at least four letters, so the answer cannot hide inside an ordinary word
 *    and satisfy its own rule by accident (the Star Wars lesson);
 *  - no letter three times over, so the answer can coexist with the
 *    repeat-limit rule, exactly as the colour and code of the day do.
 *
 * Nothing here depends on live events. The game ships a fixed vocabulary and
 * has no feed, so "current" means recent and settled — a launched telescope,
 * a released film — never a running story that could be out of date by the
 * time somebody plays.
 */

/** [clue, answer] — science, nature and discovery. */
export const SCIENCE: ReadonlyArray<readonly [string, string]> = [
  ['the force that holds you to the ground', 'Gravity'],
  ['the uncharged particle in an atom’s nucleus', 'Neutron'],
  ['the physicist behind E = mc²', 'Einstein'],
  ['the shape a strand of DNA twists into', 'Helix'],
  ['the gas layer that blocks ultraviolet light', 'Ozone'],
  ['the dinosaur with three horns', 'Triceratops'],
  ['the world demoted from planet to dwarf planet in 2006', 'Pluto'],
  ['the space telescope launched in 2021 to succeed Hubble', 'Webb'],
  ['the NASA programme aiming to put people back on the Moon', 'Artemis'],
  ['the first element on the periodic table', 'Hydrogen'],
  ['the SI unit of force', 'Newton'],
  ['the comet that comes back roughly every 76 years', 'Halley'],
  ['the branch of physics that describes the very small', 'Quantum'],
  ['the hot layer of Earth between crust and core', 'Mantle'],
  ['the cell that carries signals in your brain', 'Neuron'],
  ['the scale that measures earthquake magnitude', 'Richter'],
  ['the blood protein that carries oxygen, named for iron', 'Globin'],
  ['the rocky belt between Mars and Jupiter', 'Asteroid'],
];

/** [film, director's surname] — one film per director, so each clue has one answer. */
export const FILMS: ReadonlyArray<readonly [string, string]> = [
  ['Inception', 'Nolan'],
  ['Jaws', 'Spielberg'],
  ['Titanic', 'Cameron'],
  ['Alien', 'Scott'],
  ['Whiplash', 'Chazelle'],
  ['Barbie', 'Gerwig'],
  ['Pulp Fiction', 'Tarantino'],
  ['The Shining', 'Kubrick'],
  ['Spirited Away', 'Miyazaki'],
  ['The Lord of the Rings', 'Jackson'],
  ['Iron Man', 'Favreau'],
  ['Everything Everywhere All at Once', 'Kwan'],
];

/** [clue, answer] — video games. */
export const GAMES: ReadonlyArray<readonly [string, string]> = [
  ['Nintendo’s moustachioed plumber', 'Mario'],
  ['Sega’s blue hedgehog', 'Sonic'],
  ['the Soviet puzzle game of falling blocks', 'Tetris'],
  ['the block-building sandbox game of cubes', 'Minecraft'],
  ['the yellow dot-muncher of the arcades', 'Pacman'],
  ['the green-clad hero of Hyrule', 'Link'],
  ['the electric mouse of the Pokémon series', 'Pikachu'],
  ['the battle royale with a dancing lobby', 'Fortnite'],
  ['the pink puffball who swallows his enemies', 'Kirby'],
  ['the spiky turtle king who keeps taking the princess', 'Bowser'],
];

/** [clue, answer] — bands and acts, one word each. */
export const MUSIC: ReadonlyArray<readonly [string, string]> = [
  ['the band behind Bohemian Rhapsody', 'Queen'],
  ['the four from Liverpool', 'Beatles'],
  ['the Swedish group behind Dancing Queen', 'Abba'],
  ['the band behind Enter Sandman', 'Metallica'],
  ['the band behind Yellow and Viva la Vida', 'Coldplay'],
  ['the band behind Creep and Karma Police', 'Radiohead'],
  ['the virtual band fronted by cartoon characters', 'Gorillaz'],
  ['the Manchester band of the Gallagher brothers', 'Oasis'],
  ['the band behind Seven Nation Army', 'Stripes'],
];

/** [country, capital city] — single-word capitals only. */
export const CAPITALS: ReadonlyArray<readonly [string, string]> = [
  ['Japan', 'Tokyo'], ['Peru', 'Lima'], ['Norway', 'Oslo'], ['Egypt', 'Cairo'],
  ['Kenya', 'Nairobi'], ['France', 'Paris'], ['Italy', 'Rome'], ['Denmark', 'Copenhagen'],
  ['Ghana', 'Accra'], ['Chile', 'Santiago'], ['Poland', 'Warsaw'], ['Morocco', 'Rabat'],
  ['Austria', 'Vienna'], ['Ireland', 'Dublin'], ['Finland', 'Helsinki'],
  ['Portugal', 'Lisbon'], ['Vietnam', 'Hanoi'], ['Jamaica', 'Kingston'],
];

/** [symbol, name] — the Greek letters a reader can name on sight. */
export const GREEK: ReadonlyArray<readonly [string, string]> = [
  ['α', 'Alpha'], ['β', 'Beta'], ['γ', 'Gamma'], ['δ', 'Delta'],
  ['θ', 'Theta'], ['κ', 'Kappa'], ['λ', 'Lambda'], ['σ', 'Sigma'],
  ['ω', 'Omega'], ['ζ', 'Zeta'], ['ι', 'Iota'], ['ε', 'Epsilon'],
];

/** [element, atomic number] — kept above 19 so the answer is two digits. */
export const ATOMIC: ReadonlyArray<readonly [string, number]> = [
  ['calcium', 20], ['titanium', 22], ['iron', 26], ['nickel', 28],
  ['copper', 29], ['zinc', 30], ['krypton', 36], ['silver', 47],
  ['tin', 50], ['iodine', 53], ['platinum', 78], ['gold', 79],
  ['mercury', 80], ['lead', 82], ['uranium', 92],
];

/** Fibonacci numbers worth asking for — two digits and up. */
export const FIBONACCI = ['13', '21', '34', '55', '89', '144', '233', '377'] as const;

/** N written in base two. */
export function toBinary(n: number): string {
  return n.toString(2);
}

/**
 * Every three-digit run whose digits multiply to exactly n. Used both as the
 * solver's tokens and as the player's hint, so the two can never disagree.
 */
export function digitTriples(n: number): string[] {
  const out: string[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      for (let c = 1; c <= 9; c++) {
        if (a * b * c === n) out.push(`${a}${b}${c}`);
      }
    }
  }
  return out;
}

/** Products reachable by three single digits in several different ways. */
export const TRIPLE_PRODUCTS: readonly number[] = [
  24, 36, 48, 60, 72, 90, 96, 120, 144, 168, 180, 216,
].filter((n) => digitTriples(n).length >= 3);

/** Shift each letter n places forward through the alphabet, wrapping at Z. */
export function caesar(text: string, shift: number): string {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c === c.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}
