# Passwordle

A daily password puzzle. One password, eight rules, a new set every day — and
everyone in the world gets the same ones.

Inspired by [neal.fun's Password Game](https://neal.fun/password-game/), but
rebuilt as a Wordle-shaped daily: bounded at eight rules so it takes three to
six minutes, deterministic per date, and finished with a spoiler-free emoji
grid you can paste anywhere.

## How it plays

You start with one rule. Satisfy it and the next appears — but every earlier
rule still has to hold, so the password keeps fighting back. Rules escalate
through four tiers, from "must contain a number" up to "must contain its own
length, written as a number".

Scoring rewards a short answer found cleanly:

| Signal | Effect |
| --- | --- |
| Under par | +10 per character, up to +150 |
| Over par | −10 per character, up to −250 |
| Breaking a rule you had already satisfied | −15 each |
| Hint (three per day) | −75 each |
| Over two minutes | −1 per two seconds, up to −150 |

`par` is the shortest password the built-in solver can find. Beating it is the
real game once you have finished a few.

## Running it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # engine + game-layer tests
npm run build
```

## How it works

```
src/engine/   pure, UI-free puzzle generation
  rng.ts        seeded PRNG — same date in, same puzzle out, forever
  data.ts       words, elements, countries, emoji, Roman numerals
  context.ts    everything date-derived: word, colour and moon phase of the day
  rules.ts      32 rule generators, each parameterised by the day's seed
  solver.ts     simulated annealing — proves a rule set is satisfiable
  puzzle.ts     picks the day's eight rules and guarantees they are solvable
src/game/     scoring, share text, localStorage, the React state hook
src/components/ presentation only
design/       source for the social preview image
```

Three decisions carry the design:

**Rules are generators, not constants.** A generator takes the day's seeded RNG
and returns a concrete rule with its parameters baked in, so "digits must add
up to 26" and "digits must add up to 31" are the same generator on different
days. 32 generators across four tiers give hundreds of thousands of distinct
daily combinations.

**Every puzzle is proven solvable before it ships.** Rules can genuinely
conflict — "exactly two digits" and "digits must add up to 26" have no common
solution. So the builder runs a solver over each candidate rule set and rerolls
until one is satisfiable. `selectRules` also enforces exclusivity tags, so a day
never asks for two different lengths. The test suite checks a full year of
consecutive dates: 370 days, every one solvable with all eight rules.

**Rules carry repair hints.** A rule can expose `tokens` (substrings that help)
and `repair(pw)` (candidate fixed passwords). These drive the solver's mutation
operator, which is what makes constraints like "must contain its own length"
tractable — plain random editing would essentially never stumble into them.

The solver also computes `par` by re-solving under a tightening length cap. It
cannot simply delete characters from a valid answer: with rules like prime
length plus an exact digit sum, valid passwords are isolated from one another,
and every single-character edit lands on an invalid one.

## A few things worth knowing

**The archive.** Every past puzzle is playable, because the engine is keyed on
the date rather than on "today" — `getPuzzle('2026-11-02')` has always worked.
Finishing an old one counts towards your record but deliberately leaves your
streak alone: a streak should mean days you turned up. Progress is stored per
date, so an archive puzzle can never overwrite the day in progress.

**The clock only runs while you are looking.** Elapsed time accumulates in
250ms steps and is skipped whenever `document.hidden` is true or a tick arrives
more than two seconds late. Otherwise leaving a tab open over lunch would cost
you the full slow-finish penalty for time you were not playing.

**The cascade is announced.** A rule unlocking or breaking is otherwise a purely
visual event. A polite live region announces each one, and every rule card
carries its state as text for screen readers.

## Deploying

It is a static site — `npm run build` and serve `dist/`.

One thing to fix at deploy time: `og:image` in `index.html` is a relative path.
Facebook will not resolve that, so set it to the absolute URL of your domain
(`https://your-domain/og.jpg`) once you know it. Regenerate the image itself by
opening `design/og-card.html` at 1200x630 and screenshotting it.

## Adding a rule

Add one `def(...)` block in `src/engine/rules.ts`:

```ts
def('noDoubles', 3, () => ({
  text: 'No character may sit next to a copy of itself.',
  hint: 'Break up any doubled letters.',
  tags: ['adjacent'],           // at most one rule per tag per day
  test: (pw) => !/(.)\1/.test(pw),
}));
```

The test suite will immediately check it against a year of puzzles: that it is
well-formed, that it never throws on hostile input (empty strings, emoji, very
long input), that it rejects the empty password, and that it can be satisfied
alongside every other rule it can be drawn with.

Use `tags` to exclude rules that would contradict or duplicate each other, and
add `tokens` or `repair` if the rule is hard to satisfy by chance.

## Not built yet

This is still single-player. The data model is shaped for what comes next:
`recordResult` stores each finished day — password, per-rule breaks, hints,
duration and score — which is exactly the payload a server would take to
support comparing answers, friend leaderboards and a global par.

Also outstanding: analytics (you cannot tune difficulty without knowing which
rule people quit on), and tightening par further — it is the shortest password
the solver can find, which is not always the shortest that exists.
