/**
 * Numerology core library — Chaldean + Pythagorean systems.
 *
 * Conventions used throughout (documented so results are reproducible):
 *
 * LIFE PATH — "component method" (the standard used by Decoz and most
 * published calculators): reduce month, day and year SEPARATELY first
 * (preserving master numbers 11 / 22 / 33 when they appear), add the three
 * reduced components, then reduce the total — again preserving 11 / 22 / 33.
 *
 * PERSONAL CYCLES (year / month / day) — standard method, reduced fully
 * to a single digit 1–9. Master numbers are NOT preserved in cycles.
 *
 * NAME NUMBERS — the "compound" number is the raw letter sum BEFORE any
 * reduction (in Chaldean practice the compound carries its own meaning,
 * e.g. 24 is read as 24/6). The "root" is the reduced value. Pythagorean
 * name reductions preserve master numbers 11 / 22 / 33; Chaldean roots
 * are always reduced to a single digit 1–9, per Chaldean tradition.
 *
 * VOWELS — A, E, I, O, U. Y is treated as a CONSONANT in this library
 * (the simpler, most common convention in published calculators; the
 * "Y is sometimes a vowel" syllable rule is intentionally out of scope
 * for chunk 1 and documented here so nobody is surprised by it).
 */

export type NumerologySystem = "chaldean" | "pythagorean";

/** Master numbers recognised by this library. */
export const MASTER_NUMBERS: readonly number[] = [11, 22, 33];

/** The single-digit root beneath each master number: 11→2, 22→4, 33→6. */
export const MASTER_ROOTS: Readonly<Record<number, number>> = { 11: 2, 22: 4, 33: 6 };

export function isMasterNumber(n: number): boolean {
  return MASTER_NUMBERS.includes(n);
}

/** The root of a master number (11→2, 22→4, 33→6); null for non-masters. */
export function masterRoot(n: number): number | null {
  return MASTER_ROOTS[n] ?? null;
}

/**
 * BOTH-WAYS DISPLAY (product rule, milestone 7): a master number is
 * ALWAYS rendered with its root — "11/2", "22/4", "33/6" — so both
 * readings are visible wherever the number appears. Non-master values
 * render as themselves.
 */
export function displayNumber(n: number): string {
  const root = masterRoot(n);
  return root === null ? String(n) : `${n}/${root}`;
}

/* ------------------------------------------------------------------ */
/* Reduction helpers                                                   */
/* ------------------------------------------------------------------ */

export function digitSum(n: number): number {
  let x = Math.abs(Math.trunc(n));
  let sum = 0;
  while (x > 0) {
    sum += x % 10;
    x = Math.floor(x / 10);
  }
  return sum;
}

/**
 * Reduce a number by repeated digit-summing until it is a single digit.
 * When `preserveMaster` is true, reduction stops at 11 / 22 / 33.
 */
export function reduceNumber(n: number, preserveMaster = false): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    if (preserveMaster && MASTER_NUMBERS.includes(x)) return x;
    x = digitSum(x);
  }
  return x;
}

/* ------------------------------------------------------------------ */
/* Letter value tables                                                 */
/* ------------------------------------------------------------------ */

/**
 * Chaldean values. Note there is deliberately NO 9 in Chaldean —
 * 9 was considered sacred and is not assigned to any letter.
 *
 *   1 = A I J Q Y      5 = E H N X
 *   2 = B K R          6 = U V W
 *   3 = C G L S        7 = O Z
 *   4 = D M T          8 = F P
 */
export const CHALDEAN_VALUES: Readonly<Record<string, number>> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Pythagorean values: the alphabet cycles 1–9 (A=1 … I=9, J=1 … R=9, S=1 … Z=8). */
export const PYTHAGOREAN_VALUES: Readonly<Record<string, number>> = (() => {
  const table: Record<string, number> = {};
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < alphabet.length; i++) {
    table[alphabet[i]] = (i % 9) + 1;
  }
  return table;
})();

export function letterValue(letter: string, system: NumerologySystem): number {
  const ch = letter.toUpperCase();
  const table = system === "chaldean" ? CHALDEAN_VALUES : PYTHAGOREAN_VALUES;
  return table[ch] ?? 0;
}

/** Keep only A–Z letters, upper-cased. */
export function cleanName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]/g, "");
}

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

export function isVowel(letter: string): boolean {
  return VOWELS.has(letter.toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Name numbers                                                        */
/* ------------------------------------------------------------------ */

export interface LetterBreakdown {
  letter: string;
  value: number;
}

export interface WordAnalysis {
  word: string;
  compound: number;
  root: number;
  letters: LetterBreakdown[];
}

export interface NameAnalysis {
  system: NumerologySystem;
  /** The name exactly as passed in. */
  input: string;
  /** Letters-only version used for the maths. */
  cleaned: string;
  /** Raw letter sum BEFORE reduction — the Chaldean "compound" number. */
  compound: number;
  /** Reduced value (master numbers preserved for Pythagorean only). */
  root: number;
  letters: LetterBreakdown[];
  words: WordAnalysis[];
}

function rootFor(compound: number, system: NumerologySystem): number {
  return reduceNumber(compound, system === "pythagorean");
}

/** Full breakdown of a name in one system: compound, root, per-letter, per-word. */
export function analyzeName(name: string, system: NumerologySystem): NameAnalysis {
  const cleaned = cleanName(name);
  const letters: LetterBreakdown[] = [...cleaned].map((letter) => ({
    letter,
    value: letterValue(letter, system),
  }));
  const compound = letters.reduce((acc, l) => acc + l.value, 0);

  const words: WordAnalysis[] = name
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean)
    .map((word) => {
      const wLetters: LetterBreakdown[] = [...word].map((letter) => ({
        letter,
        value: letterValue(letter, system),
      }));
      const wCompound = wLetters.reduce((acc, l) => acc + l.value, 0);
      return { word, compound: wCompound, root: rootFor(wCompound, system), letters: wLetters };
    });

  return {
    system,
    input: name,
    cleaned,
    compound,
    root: rootFor(compound, system),
    letters,
    words,
  };
}

/** Compound (pre-reduction) number of a name in the given system. */
export function nameCompound(name: string, system: NumerologySystem): number {
  return analyzeName(name, system).compound;
}

/** Reduced name number in the given system. */
export function nameNumber(name: string, system: NumerologySystem): number {
  return analyzeName(name, system).root;
}

/** Chaldean name number: returns both the compound and its root. */
export function chaldeanNameNumber(name: string): { compound: number; root: number } {
  const a = analyzeName(name, "chaldean");
  return { compound: a.compound, root: a.root };
}

/** Pythagorean name number: returns both the compound and its root. */
export function pythagoreanNameNumber(name: string): { compound: number; root: number } {
  const a = analyzeName(name, "pythagorean");
  return { compound: a.compound, root: a.root };
}

/* ------------------------------------------------------------------ */
/* Date of birth numbers                                               */
/* ------------------------------------------------------------------ */

export interface DateParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

/** Parse an ISO date string "YYYY-MM-DD" without timezone surprises. */
export function parseISODate(iso: string): DateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error(`Invalid ISO date (expected YYYY-MM-DD): ${iso}`);
  const parts: DateParts = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (parts.month < 1 || parts.month > 12) throw new Error(`Invalid month in date: ${iso}`);
  if (parts.day < 1 || parts.day > 31) throw new Error(`Invalid day in date: ${iso}`);
  return parts;
}

function toParts(dob: string | DateParts): DateParts {
  return typeof dob === "string" ? parseISODate(dob) : dob;
}

export interface LifePathResult {
  /** Final life path number (11 / 22 / 33 preserved). */
  value: number;
  /** Reduced month component (master preserved). */
  monthComponent: number;
  /** Reduced day component (master preserved). */
  dayComponent: number;
  /** Reduced year component (master preserved). */
  yearComponent: number;
  /** Sum of the three components BEFORE the final reduction. */
  compound: number;
  isMaster: boolean;
}

/**
 * Life Path — component method:
 * reduce month, day, year separately (masters preserved), add, reduce
 * (masters preserved).
 *
 * Example: 2003-01-07 → month 1, day 7, year 2003 → 2+0+0+3 = 5;
 * 1 + 7 + 5 = 13 → 4.
 */
export function lifePath(dob: string | DateParts): LifePathResult {
  const { year, month, day } = toParts(dob);
  const monthComponent = reduceNumber(month, true);
  const dayComponent = reduceNumber(day, true);
  const yearComponent = reduceNumber(digitSum(year), true);
  const compound = monthComponent + dayComponent + yearComponent;
  const value = reduceNumber(compound, true);
  return {
    value,
    monthComponent,
    dayComponent,
    yearComponent,
    compound,
    isMaster: MASTER_NUMBERS.includes(value),
  };
}

/** Life path as a bare number. */
export function lifePathNumber(dob: string | DateParts): number {
  return lifePath(dob).value;
}

/**
 * Birthday number — the day of birth, reduced (11 and 22 preserved:
 * a person born on the 29th has birthday 11, born on the 22nd stays 22).
 */
export function birthdayNumber(dob: string | DateParts): number {
  const { day } = toParts(dob);
  return reduceNumber(day, true);
}

/**
 * Attitude number (a.k.a. Sun number) — birth month + birth day,
 * reduced, with 11 / 22 preserved.
 * Example: Jan 7 → 1 + 7 = 8.
 */
export function attitudeNumber(dob: string | DateParts): number {
  const { month, day } = toParts(dob);
  return reduceNumber(reduceNumber(month, true) + reduceNumber(day, true), true);
}

/* ------------------------------------------------------------------ */
/* Name + DOB numbers (Pythagorean by default)                         */
/* ------------------------------------------------------------------ */

function subsetCompound(name: string, system: NumerologySystem, vowels: boolean): number {
  return [...cleanName(name)]
    .filter((ch) => isVowel(ch) === vowels)
    .reduce((acc, ch) => acc + letterValue(ch, system), 0);
}

function subsetRoot(name: string, system: NumerologySystem, vowels: boolean): number {
  return rootFor(subsetCompound(name, system, vowels), system);
}

/**
 * Destiny / Expression number — ALL letters of the full birth name.
 * Defaults to Pythagorean (the traditional system for this number);
 * pass "chaldean" to compute it with Chaldean values instead.
 */
export function destinyNumber(fullName: string, system: NumerologySystem = "pythagorean"): number {
  return nameNumber(fullName, system);
}

/** Soul Urge / Heart's Desire — VOWELS of the full name only. */
export function soulUrgeNumber(fullName: string, system: NumerologySystem = "pythagorean"): number {
  return subsetRoot(fullName, system, true);
}

/** Personality number — CONSONANTS of the full name only. */
export function personalityNumber(fullName: string, system: NumerologySystem = "pythagorean"): number {
  return subsetRoot(fullName, system, false);
}

/* ------------------------------------------------------------------ */
/* Personal cycles — standard method, fully reduced (no masters)       */
/* ------------------------------------------------------------------ */

/**
 * Personal Year = birth month + birth day + target year, each reduced
 * to a single digit first, then the total reduced to 1–9.
 *
 * Example: born Jan 7, target 2027 → 1 + 7 + (2+0+2+7=11→2) = 10 → 1.
 */
export function personalYear(dob: string | DateParts, target: number | string | DateParts): number {
  const { month, day } = toParts(dob);
  const targetYear =
    typeof target === "number" ? target : toParts(target as string | DateParts).year;
  const sum =
    reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(targetYear));
  return reduceNumber(sum);
}

/** Personal Month = Personal Year + calendar month, fully reduced. */
export function personalMonth(
  dob: string | DateParts,
  target: string | DateParts,
): number {
  const t = toParts(target);
  return reduceNumber(personalYear(dob, t.year) + reduceNumber(t.month));
}

/** Personal Day = Personal Month + calendar day, fully reduced. */
export function personalDay(dob: string | DateParts, target: string | DateParts): number {
  const t = toParts(target);
  return reduceNumber(personalMonth(dob, t) + reduceNumber(t.day));
}

/* ------------------------------------------------------------------ */
/* Aggregated core profile                                             */
/* ------------------------------------------------------------------ */

export interface CoreProfile {
  fullName: string;
  dob: string;
  lifePath: number;
  lifePathCompound: number;
  birthday: number;
  attitude: number;
  destinyPythagorean: number;
  destinyChaldean: number;
  soulUrge: number;
  personality: number;
  chaldeanName: { compound: number; root: number };
  pythagoreanName: { compound: number; root: number };
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  /** The date the personal cycles were computed for (ISO). */
  cycleDate: string;
}

/**
 * Compute the full core profile for a person.
 * `onDate` (ISO, defaults to today) anchors the personal year/month/day.
 */
export function coreProfile(
  fullName: string,
  dob: string | DateParts,
  onDate?: string | DateParts,
): CoreProfile {
  const dobParts = toParts(dob);
  const dobIso =
    typeof dob === "string"
      ? dob
      : `${dobParts.year}-${String(dobParts.month).padStart(2, "0")}-${String(dobParts.day).padStart(2, "0")}`;

  const now = new Date();
  const cycle: DateParts = onDate
    ? toParts(onDate)
    : { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  const cycleIso = `${cycle.year}-${String(cycle.month).padStart(2, "0")}-${String(cycle.day).padStart(2, "0")}`;

  const lp = lifePath(dobParts);
  return {
    fullName,
    dob: dobIso,
    lifePath: lp.value,
    lifePathCompound: lp.compound,
    birthday: birthdayNumber(dobParts),
    attitude: attitudeNumber(dobParts),
    destinyPythagorean: destinyNumber(fullName, "pythagorean"),
    destinyChaldean: destinyNumber(fullName, "chaldean"),
    soulUrge: soulUrgeNumber(fullName),
    personality: personalityNumber(fullName),
    chaldeanName: chaldeanNameNumber(fullName),
    pythagoreanName: pythagoreanNameNumber(fullName),
    personalYear: personalYear(dobParts, cycle),
    personalMonth: personalMonth(dobParts, cycle),
    personalDay: personalDay(dobParts, cycle),
    cycleDate: cycleIso,
  };
}

/**
 * The both-ways display strings for every core-profile field that can
 * hold a master number. This is the canonical "core profile output"
 * the UI renders from — a master value can never appear here without
 * its root pairing (locked by tests/derivatives.test.ts).
 */
export function coreProfileDisplays(core: CoreProfile): Record<string, string> {
  return {
    lifePath: displayNumber(core.lifePath),
    birthday: displayNumber(core.birthday),
    attitude: displayNumber(core.attitude),
    destinyPythagorean: displayNumber(core.destinyPythagorean),
    destinyChaldean: displayNumber(core.destinyChaldean),
    soulUrge: displayNumber(core.soulUrge),
    personality: displayNumber(core.personality),
    chaldeanNameRoot: displayNumber(core.chaldeanName.root),
    pythagoreanNameRoot: displayNumber(core.pythagoreanName.root),
    personalYear: displayNumber(core.personalYear),
    personalMonth: displayNumber(core.personalMonth),
    personalDay: displayNumber(core.personalDay),
  };
}

/* ------------------------------------------------------------------ */
/* Derivatives — Pinnacles, Challenges, and the secondary numbers      */
/*                                                                     */
/* All formulas follow the published Decoz method (worldnumerology    */
/* .com, "How to Do Your Own Numerology Reading", verified Nov 2026): */
/*   PINNACLES — components reduced keeping 11 and 22 (Decoz keeps    */
/*   master numbers in Pinnacle sums; a sum of 33 reduces to 6, the   */
/*   convention his school states for Pinnacles specifically).        */
/*   P1 = month + day · P2 = day + year · P3 = P1 + P2 · P4 = month   */
/*   + year. Timing: the First Pinnacle runs from birth through age   */
/*   36 − (single-digit Life Path root); Second and Third run nine    */
/*   years each; the Fourth runs for the remainder of life.           */
/*   CHALLENGES — components reduced ALL the way to single digits     */
/*   (Decoz: "ignore the Master numbers"); differences of the parts.  */
/*   MATURITY = Life Path + Destiny, masters preserved.               */
/*   BALANCE = initials of the full name; masters do not apply.       */
/*   RATIONAL THOUGHT = first-name letter sum + day of birth;         */
/*   masters do not apply.                                            */
/*   GROWTH = the first name's letters alone, reduced to one digit    */
/*   (the "key number" of the first name in the published tradition). */
/* ------------------------------------------------------------------ */

/** Pinnacle reduction: keep 11 and 22; 33 continues to 6 (Decoz Pinnacle rule). */
export function reducePinnacle(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    if (x === 11 || x === 22) return x;
    x = digitSum(x);
  }
  return x;
}

export interface Pinnacle {
  index: 1 | 2 | 3 | 4;
  value: number;
  /** The arithmetic, with this person's actual components substituted. */
  formula: string;
  /** First age (in years) the pinnacle covers. */
  startAge: number;
  /** Last age covered; null = remainder of life. */
  endAge: number | null;
}

export interface PinnacleSet {
  pinnacles: Pinnacle[];
  /** 36 − Life Path root: the age the First Pinnacle runs through. */
  firstEndAge: number;
  lifePathRoot: number;
}

export function pinnacles(dob: string | DateParts): PinnacleSet {
  const lp = lifePath(dob);
  const m = lp.monthComponent;
  const d = lp.dayComponent;
  const y = lp.yearComponent;
  const p1 = reducePinnacle(m + d);
  const p2 = reducePinnacle(d + y);
  const p3 = reducePinnacle(p1 + p2);
  const p4 = reducePinnacle(m + y);
  const lifePathRoot = reduceNumber(lp.value, false);
  const firstEndAge = 36 - lifePathRoot;
  return {
    lifePathRoot,
    firstEndAge,
    pinnacles: [
      { index: 1, value: p1, formula: `month ${m} + day ${d} = ${m + d} → ${p1}`, startAge: 0, endAge: firstEndAge },
      { index: 2, value: p2, formula: `day ${d} + year ${y} = ${d + y} → ${p2}`, startAge: firstEndAge + 1, endAge: firstEndAge + 9 },
      { index: 3, value: p3, formula: `Pinnacle 1 (${p1}) + Pinnacle 2 (${p2}) = ${p1 + p2} → ${p3}`, startAge: firstEndAge + 10, endAge: firstEndAge + 18 },
      { index: 4, value: p4, formula: `month ${m} + year ${y} = ${m + y} → ${p4}`, startAge: firstEndAge + 19, endAge: null },
    ],
  };
}

export interface ChallengeSet {
  first: number;
  second: number;
  /** The Main (third) Challenge — |first − second|, in force for most of life. */
  main: number;
  fourth: number;
  formulas: { first: string; second: string; main: string; fourth: string };
  /** The fully-reduced components the differences were taken from. */
  components: { month: number; day: number; year: number };
}

export function challenges(dob: string | DateParts): ChallengeSet {
  const { year, month, day } = toParts(dob);
  const m = reduceNumber(month, false);
  const d = reduceNumber(day, false);
  const y = reduceNumber(digitSum(year), false);
  const first = Math.abs(m - d);
  const second = Math.abs(d - y);
  const main = Math.abs(first - second);
  const fourth = Math.abs(m - y);
  return {
    first,
    second,
    main,
    fourth,
    components: { month: m, day: d, year: y },
    formulas: {
      first: `|month ${m} − day ${d}| = ${first}`,
      second: `|day ${d} − year ${y}| = ${second}`,
      main: `|First ${first} − Second ${second}| = ${main}`,
      fourth: `|month ${m} − year ${y}| = ${fourth}`,
    },
  };
}

/** The first name (first word) of a full name, letters only, upper-cased. */
export function firstNameOf(fullName: string): string {
  const words = fullName.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  return words[0] ?? "";
}

function letterSum(word: string, system: NumerologySystem): number {
  return [...word].reduce((acc, ch) => acc + letterValue(ch, system), 0);
}

/** Maturity number — Life Path + Destiny (Pythagorean), masters preserved (Decoz). */
export function maturityNumber(fullName: string, dob: string | DateParts): number {
  return reduceNumber(lifePathNumber(dob) + destinyNumber(fullName, "pythagorean"), true);
}

/** Balance number — the initials of the full name, summed and fully reduced (Decoz: masters do not apply). */
export function balanceNumber(fullName: string): number {
  const initials = fullName
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean)
    .map((w) => w[0]);
  const sum = initials.reduce((acc, ch) => acc + letterValue(ch, "pythagorean"), 0);
  return reduceNumber(sum, false);
}

/**
 * Rational Thought number — first-name letter sum (Pythagorean) + the
 * day of birth, fully reduced (Decoz: masters do not apply). Reducing
 * the day first or not makes no difference to the fully-reduced total.
 */
export function rationalThoughtNumber(fullName: string, dob: string | DateParts): number {
  const { day } = toParts(dob);
  return reduceNumber(letterSum(firstNameOf(fullName), "pythagorean") + day, false);
}

/** Growth number — the first name's letters alone, reduced to a single digit. */
export function growthNumber(fullName: string): number {
  return reduceNumber(letterSum(firstNameOf(fullName), "pythagorean"), false);
}

/**
 * The compound family of a root: every compound in Cheiro's read range
 * (10–52) that reduces to that root — e.g. root 4 → 13, 22, 31, 40, 49.
 * The tradition reads family members as variations on the root's theme,
 * each with its own compound flavour (Cheiro's table).
 */
export function compoundFamily(root: number): number[] {
  const out: number[] = [];
  for (let c = 10; c <= 52; c++) {
    if (reduceNumber(c, false) === root) out.push(c);
  }
  return out;
}
