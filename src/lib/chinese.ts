/**
 * Chinese astrology engine — zodiac animal, heavenly-stem element and
 * sign relations for a date of birth.
 *
 * METHOD
 * ------
 * The Chinese zodiac year does NOT start on Jan 1. It starts on Chinese
 * New Year (CNY, Lunar New Year), which falls between Jan 21 and Feb 20.
 * A person born before CNY in their birth year belongs to the PREVIOUS
 * zodiac year. This engine resolves the boundary with an explicit CNY
 * date table (Gregorian dates, China time) covering 1900–2032, compiled
 * from published Chinese-calendar data (cross-checked against the Hong
 * Kong Observatory conversion tables).
 *
 *   Golden boundary case: CNY 2003 = Feb 1, 2003. A birth on
 *   2003-01-07 is therefore in zodiac year 2002 → Horse, and the stem
 *   for 2002 is Water → Water Horse.
 *
 * ANIMAL / STEM FORMULAS (sexagenary cycle, anchored on 4 AD = Yang
 * Wood Rat, so year 1924, 1984, 2044… are also Yang Wood Rat years):
 *   animalIndex = (zodiacYear − 4) mod 12   → 0 = Rat … 11 = Pig
 *   stemIndex   = (zodiacYear − 4) mod 10   → 0/1 Wood, 2/3 Fire,
 *                 4/5 Earth, 6/7 Metal, 8/9 Water; even = Yang, odd = Yin.
 *
 * RELATIONS (standard published compatibility doctrine):
 *   Secret friend (六合, "six harmonies"): Rat–Ox, Tiger–Pig,
 *     Rabbit–Dog, Dragon–Rooster, Snake–Monkey, Horse–Goat.
 *   Clash / enemy (六冲): the sign six places away (Rat–Horse,
 *     Ox–Goat, Tiger–Monkey, Rabbit–Rooster, Dragon–Dog, Snake–Pig).
 *   Trines (三合): {Rat, Dragon, Monkey}, {Ox, Snake, Rooster},
 *     {Tiger, Horse, Dog}, {Rabbit, Goat, Pig}.
 *
 * ELEMENT CYCLES: the generating (生) cycle runs
 * Wood → Fire → Earth → Metal → Water → Wood; the controlling (克)
 * cycle runs Wood ⊣ Earth ⊣ Water ⊣ Fire ⊣ Metal ⊣ Wood.
 */

import { parseISODate, type DateParts } from "./numerology.ts";

export const ZODIAC_ANIMALS = [
  "Rat",
  "Ox",
  "Tiger",
  "Rabbit",
  "Dragon",
  "Snake",
  "Horse",
  "Goat",
  "Monkey",
  "Rooster",
  "Dog",
  "Pig",
] as const;

export type ZodiacAnimal = (typeof ZODIAC_ANIMALS)[number];

export const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
export type ChineseElement = (typeof ELEMENTS)[number];

/**
 * Gregorian date (ISO) of Chinese New Year for each year 1900–2032.
 * 1929 and 2032 are included as boundary guards: births in Jan/Feb 1930
 * can belong to zodiac 1929, and "current year" lookups in early 2032
 * need the 2032 boundary.
 */
export const CNY_DATES: Readonly<Record<number, string>> = {
  1900: "1900-01-31", 1901: "1901-02-19", 1902: "1902-02-08", 1903: "1903-01-29",
  1904: "1904-02-16", 1905: "1905-02-04", 1906: "1906-01-25", 1907: "1907-02-13",
  1908: "1908-02-02", 1909: "1909-01-22", 1910: "1910-02-10", 1911: "1911-01-30",
  1912: "1912-02-18", 1913: "1913-02-06", 1914: "1914-01-26", 1915: "1915-02-14",
  1916: "1916-02-03", 1917: "1917-01-23", 1918: "1918-02-11", 1919: "1919-02-01",
  1920: "1920-02-20", 1921: "1921-02-08", 1922: "1922-01-28", 1923: "1923-02-16",
  1924: "1924-02-05", 1925: "1925-01-24", 1926: "1926-02-13", 1927: "1927-02-02",
  1928: "1928-01-23", 1929: "1929-02-10", 1930: "1930-01-30", 1931: "1931-02-17",
  1932: "1932-02-06", 1933: "1933-01-26", 1934: "1934-02-14", 1935: "1935-02-04",
  1936: "1936-01-24", 1937: "1937-02-11", 1938: "1938-01-31", 1939: "1939-02-19",
  1940: "1940-02-08", 1941: "1941-01-27", 1942: "1942-02-15", 1943: "1943-02-05",
  1944: "1944-01-25", 1945: "1945-02-13", 1946: "1946-02-02", 1947: "1947-01-22",
  1948: "1948-02-10", 1949: "1949-01-29", 1950: "1950-02-17", 1951: "1951-02-06",
  1952: "1952-01-27", 1953: "1953-02-14", 1954: "1954-02-03", 1955: "1955-01-24",
  1956: "1956-02-12", 1957: "1957-01-31", 1958: "1958-02-18", 1959: "1959-02-08",
  1960: "1960-01-28", 1961: "1961-02-15", 1962: "1962-02-05", 1963: "1963-01-25",
  1964: "1964-02-13", 1965: "1965-02-02", 1966: "1966-01-21", 1967: "1967-02-09",
  1968: "1968-01-30", 1969: "1969-02-17", 1970: "1970-02-06", 1971: "1971-01-27",
  1972: "1972-02-15", 1973: "1973-02-03", 1974: "1974-01-23", 1975: "1975-02-11",
  1976: "1976-01-31", 1977: "1977-02-18", 1978: "1978-02-07", 1979: "1979-01-28",
  1980: "1980-02-16", 1981: "1981-02-05", 1982: "1982-01-25", 1983: "1983-02-13",
  1984: "1984-02-02", 1985: "1985-02-20", 1986: "1986-02-09", 1987: "1987-01-29",
  1988: "1988-02-17", 1989: "1989-02-06", 1990: "1990-01-27", 1991: "1991-02-15",
  1992: "1992-02-04", 1993: "1993-01-23", 1994: "1994-02-10", 1995: "1995-01-31",
  1996: "1996-02-19", 1997: "1997-02-07", 1998: "1998-01-28", 1999: "1999-02-16",
  2000: "2000-02-05", 2001: "2001-01-24", 2002: "2002-02-12", 2003: "2003-02-01",
  2004: "2004-01-22", 2005: "2005-02-09", 2006: "2006-01-29", 2007: "2007-02-18",
  2008: "2008-02-07", 2009: "2009-01-26", 2010: "2010-02-14", 2011: "2011-02-03",
  2012: "2012-01-23", 2013: "2013-02-10", 2014: "2014-01-31", 2015: "2015-02-19",
  2016: "2016-02-08", 2017: "2017-01-28", 2018: "2018-02-16", 2019: "2019-02-05",
  2020: "2020-01-25", 2021: "2021-02-12", 2022: "2022-02-01", 2023: "2023-01-22",
  2024: "2024-02-10", 2025: "2025-01-29", 2026: "2026-02-17", 2027: "2027-02-06",
  2028: "2028-01-26", 2029: "2029-02-13", 2030: "2030-02-03", 2031: "2031-01-23",
  2032: "2032-02-11",
};

const STEM_ELEMENTS: readonly ChineseElement[] = [
  "Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water",
];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function toParts(dob: string | DateParts): DateParts {
  return typeof dob === "string" ? parseISODate(dob) : dob;
}

/**
 * The zodiac year a date falls in: the Gregorian year, minus one when
 * the date precedes that year's Chinese New Year.
 */
export function zodiacYearForDate(date: string | DateParts): number {
  const { year, month, day } = toParts(date);
  const cnyIso = CNY_DATES[year];
  if (!cnyIso) {
    throw new Error(
      `Chinese New Year table covers 1900–2032; cannot resolve zodiac year for ${year}.`,
    );
  }
  const cny = parseISODate(cnyIso);
  const beforeCny = month < cny.month || (month === cny.month && day < cny.day);
  return beforeCny ? year - 1 : year;
}

/** Animal for a zodiac year (e.g. 2002 → Horse). */
export function animalForZodiacYear(zodiacYear: number): ZodiacAnimal {
  return ZODIAC_ANIMALS[mod(zodiacYear - 4, 12)];
}

/** Heavenly-stem element + polarity for a zodiac year (e.g. 2002 → Water, Yang). */
export function stemForZodiacYear(zodiacYear: number): {
  element: ChineseElement;
  polarity: "Yang" | "Yin";
  stemIndex: number;
} {
  const stemIndex = mod(zodiacYear - 4, 10);
  return {
    element: STEM_ELEMENTS[stemIndex],
    polarity: stemIndex % 2 === 0 ? "Yang" : "Yin",
    stemIndex,
  };
}

/* ------------------------------------------------------------------ */
/* Sign relations                                                      */
/* ------------------------------------------------------------------ */

const SECRET_FRIEND_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // Rat–Ox
  [2, 11], // Tiger–Pig
  [3, 10], // Rabbit–Dog
  [4, 9], // Dragon–Rooster
  [5, 8], // Snake–Monkey
  [6, 7], // Horse–Goat
];

const TRINE_GROUPS: ReadonlyArray<readonly number[]> = [
  [0, 4, 8], // Rat, Dragon, Monkey
  [1, 5, 9], // Ox, Snake, Rooster
  [2, 6, 10], // Tiger, Horse, Dog
  [3, 7, 11], // Rabbit, Goat, Pig
];

function animalIndex(animal: ZodiacAnimal): number {
  return ZODIAC_ANIMALS.indexOf(animal);
}

/** The "secret friend" (六合) of a sign — its closest quiet ally. */
export function secretFriend(animal: ZodiacAnimal): ZodiacAnimal {
  const idx = animalIndex(animal);
  for (const [a, b] of SECRET_FRIEND_PAIRS) {
    if (a === idx) return ZODIAC_ANIMALS[b];
    if (b === idx) return ZODIAC_ANIMALS[a];
  }
  throw new Error(`No secret-friend pair for ${animal}`);
}

/** The clash / enemy sign (六冲) — six places around the wheel. */
export function clashSign(animal: ZodiacAnimal): ZodiacAnimal {
  return ZODIAC_ANIMALS[mod(animalIndex(animal) + 6, 12)];
}

/** The three animals of a sign's trine (三合), including the sign itself. */
export function trineGroup(animal: ZodiacAnimal): ZodiacAnimal[] {
  const idx = animalIndex(animal);
  const group = TRINE_GROUPS.find((g) => g.includes(idx));
  if (!group) throw new Error(`No trine group for ${animal}`);
  return group.map((i) => ZODIAC_ANIMALS[i]);
}

export type SignRelation =
  | "own-sign"
  | "secret-friend"
  | "trine"
  | "clash"
  | "neutral";

/** How sign `a` stands to sign `b`. */
export function relationBetween(a: ZodiacAnimal, b: ZodiacAnimal): SignRelation {
  if (a === b) return "own-sign";
  if (secretFriend(a) === b) return "secret-friend";
  if (clashSign(a) === b) return "clash";
  if (trineGroup(a).includes(b)) return "trine";
  return "neutral";
}

/* ------------------------------------------------------------------ */
/* Element interaction                                                 */
/* ------------------------------------------------------------------ */

/** The generating cycle: each element feeds the next. */
const GENERATES: Readonly<Record<ChineseElement, ChineseElement>> = {
  Wood: "Fire",
  Fire: "Earth",
  Earth: "Metal",
  Metal: "Water",
  Water: "Wood",
};

/** The controlling cycle: each element restrains the next. */
const CONTROLS: Readonly<Record<ChineseElement, ChineseElement>> = {
  Wood: "Earth",
  Earth: "Water",
  Water: "Fire",
  Fire: "Metal",
  Metal: "Wood",
};

export type ElementRelation =
  | "same"
  | "year-feeds-you"
  | "you-feed-year"
  | "year-controls-you"
  | "you-control-year";

export function elementRelation(
  yours: ChineseElement,
  yearElement: ChineseElement,
): ElementRelation {
  if (yours === yearElement) return "same";
  if (GENERATES[yearElement] === yours) return "year-feeds-you";
  if (GENERATES[yours] === yearElement) return "you-feed-year";
  if (CONTROLS[yearElement] === yours) return "year-controls-you";
  return "you-control-year";
}

/* ------------------------------------------------------------------ */
/* Profiles and year outlooks                                          */
/* ------------------------------------------------------------------ */

export interface ChineseProfile {
  animal: ZodiacAnimal;
  element: ChineseElement;
  polarity: "Yang" | "Yin";
  /** The zodiac year the birth date resolves to (after the CNY boundary). */
  zodiacYear: number;
  /** ISO date of the CNY that opened that zodiac year. */
  cnyDate: string;
  secretFriend: ZodiacAnimal;
  clash: ZodiacAnimal;
  trine: ZodiacAnimal[];
}

/** Full Chinese profile for a date of birth. */
export function chineseProfile(dob: string | DateParts): ChineseProfile {
  const zodiacYear = zodiacYearForDate(dob);
  const animal = animalForZodiacYear(zodiacYear);
  const stem = stemForZodiacYear(zodiacYear);
  return {
    animal,
    element: stem.element,
    polarity: stem.polarity,
    zodiacYear,
    // Births in Jan 1900 (before CNY) resolve to zodiac 1899, whose CNY
    // predates the table; fall back to an empty string for that one edge.
    cnyDate: CNY_DATES[zodiacYear] ?? "",
    secretFriend: secretFriend(animal),
    clash: clashSign(animal),
    trine: trineGroup(animal),
  };
}

export interface YearOutlook {
  /** The zodiac year being read (its animal rules from that year's CNY). */
  year: number;
  animal: ZodiacAnimal;
  element: ChineseElement;
  polarity: "Yang" | "Yin";
  relation: SignRelation;
  elementRelation: ElementRelation;
  headline: string;
  notes: string[];
  /** Citation for the interpretation text (differentiation spec, trust rule 2). */
  source: string;
  era: "TRADITIONAL";
}

const RELATION_HEADLINES: Readonly<Record<SignRelation, string>> = {
  "own-sign": "Your own-sign year — a reset year; tradition says move deliberately.",
  "secret-friend":
    "A secret-friend year — the ruling sign is your closest ally, so help tends to arrive quietly.",
  trine: "A trine-ally year — the ruling sign shares your rhythm; cooperative efforts fare well.",
  clash:
    "A clash year — the ruling sign is your opposite; tradition advises patience and no impulsive leaps.",
  neutral: "A neutral year — no special alliance or clash with the ruling sign.",
};

const ELEMENT_NOTES: Readonly<Record<ElementRelation, string>> = {
  same: "The year's element matches your own — your natural mode is amplified.",
  "year-feeds-you":
    "The year's element generates yours in the feeding cycle — a resourcing year.",
  "you-feed-year":
    "Your element generates the year's — an output year; give energy out, and pace yourself.",
  "year-controls-you":
    "The year's element restrains yours in the controlling cycle — expect friction to manage, not fear.",
  "you-control-year":
    "Your element restrains the year's — a year where your discipline shapes outcomes.",
};

/**
 * Outlook for a birth sign in a given zodiac year, e.g. a Horse profile
 * read against 2027 (Fire Goat, from Feb 6, 2027).
 */
export function yearOutlook(
  profile: ChineseProfile,
  targetYear: number,
): YearOutlook {
  const animal = animalForZodiacYear(targetYear);
  const stem = stemForZodiacYear(targetYear);
  const relation = relationBetween(profile.animal, animal);
  const elRel = elementRelation(profile.element, stem.element);
  return {
    year: targetYear,
    animal,
    element: stem.element,
    polarity: stem.polarity,
    relation,
    elementRelation: elRel,
    headline: RELATION_HEADLINES[relation],
    notes: [ELEMENT_NOTES[elRel]],
    source:
      "Traditional Chinese compatibility doctrine (secret friend 六合, clash 六冲, trine 三合; generating/controlling element cycles)",
    era: "TRADITIONAL",
  };
}
