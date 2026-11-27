/**
 * Vedic astrology engine — sidereal (Lahiri) chart, nakshatra, and the
 * Vimshottari dasha timeline, in the Parashari tradition.
 *
 * AYANAMSA (Lahiri / Chitrapaksha): the offset between the tropical and
 * sidereal zodiacs.
 *   ayanamsa(date) = 23.857° at 2000-01-01 (the Swiss Ephemeris value)
 *                    + 50.28″ per elapsed year (365.25-day years).
 * Cross-check: this gives 23.899° for 2003-01-01; the published Lahiri
 * value for that date is 23°53′56″ = 23.899°. Locked in tests.
 * A sidereal longitude = tropical longitude − ayanamsa (mod 360).
 *
 * NAKSHATRAS: 27 lunar mansions of 13°20′ (13.333…°) each, starting at
 * 0° sidereal Aries; each divides into 4 padas of 3°20′. The Moon's
 * nakshatra and its lord anchor the Vimshottari dasha.
 *
 * VIMSHOTTARI DASHA (BPHS): a 120-year cycle of nine graha periods —
 * Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16,
 * Saturn 19, Mercury 17. Life begins part-way through the period of
 * the Moon's nakshatra lord: the balance is the untraversed fraction
 * of the nakshatra × that lord's full years. Period lengths are added
 * as mean years of 365.25 days (documented convention).
 *
 * SCOPE NOTE (honesty): Rahu/Ketu longitudes are NOT computed here —
 * astronomy-engine has no lunar-node ephemeris, and inventing them
 * would break the accuracy standard. They arrive with the Swiss
 * Ephemeris upgrade. The dasha needs only the Moon, so the timeline is
 * unaffected. Uranus/Neptune/Pluto are reported separately as modern
 * additions, not classical grahas.
 *
 * DETERMINISM: pure functions of the birth instant — same input, same
 * chart, forever.
 */

import {
  norm360,
  signOf,
  tropicalLongitude,
  ascendantFromLst,
  localSiderealDegrees,
  type ChartInput,
  type PlanetName,
  type ZodiacSign,
} from "./western.ts";

/* ------------------------------------------------------------------ */
/* Ayanamsa                                                            */
/* ------------------------------------------------------------------ */

export const AYANAMSA_AT_2000 = 23.857; // degrees, Lahiri, 2000-01-01
export const AYANAMSA_RATE_ARCSEC_PER_YEAR = 50.28;
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;
const EPOCH_2000 = Date.UTC(2000, 0, 1);

export function lahiriAyanamsa(date: Date): number {
  const years = (date.getTime() - EPOCH_2000) / MS_PER_YEAR;
  return AYANAMSA_AT_2000 + (years * AYANAMSA_RATE_ARCSEC_PER_YEAR) / 3600;
}

export function siderealLongitude(tropical: number, date: Date): number {
  return norm360(tropical - lahiriAyanamsa(date));
}

/* ------------------------------------------------------------------ */
/* Nakshatras                                                          */
/* ------------------------------------------------------------------ */

export const DASHA_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
} as const;

export type DashaLord = keyof typeof DASHA_YEARS;

/** The Vimshottari sequence, in order. */
export const DASHA_SEQUENCE: readonly DashaLord[] = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];

export interface NakshatraInfo {
  index: number; // 0–26
  name: string;
  lord: DashaLord;
  pada: number; // 1–4
  startDeg: number;
  endDeg: number;
  /** Fraction of the nakshatra the Moon has traversed, 0–1. */
  traversed: number;
}

export const NAKSHATRA_SPAN = 360 / 27; // 13°20′
export const PADA_SPAN = NAKSHATRA_SPAN / 4; // 3°20′

const NAKSHATRA_NAMES: readonly string[] = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
  "Revati",
];

/** Nakshatra lords cycle Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury — three times. */
export function nakshatraOf(siderealMoonLongitude: number): NakshatraInfo {
  const lon = norm360(siderealMoonLongitude);
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const startDeg = index * NAKSHATRA_SPAN;
  const into = lon - startDeg;
  return {
    index,
    name: NAKSHATRA_NAMES[index],
    lord: DASHA_SEQUENCE[index % 9],
    pada: Math.floor(into / PADA_SPAN) + 1,
    startDeg,
    endDeg: startDeg + NAKSHATRA_SPAN,
    traversed: into / NAKSHATRA_SPAN,
  };
}

/* ------------------------------------------------------------------ */
/* Vimshottari dasha                                                   */
/* ------------------------------------------------------------------ */

export interface DashaPeriod {
  lord: DashaLord;
  /** Full period length in years (the first period is the balance). */
  years: number;
  /** True when this is the partial period running at birth. */
  isBalance: boolean;
  startISO: string;
  endISO: string;
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * MS_PER_YEAR);
}

/**
 * The Vimshottari timeline from birth. The first entry is the balance
 * of the Moon's nakshatra lord's period; subsequent entries are full
 * periods in sequence. `count` periods are returned (default 10, which
 * spans the full 120-year cycle from the nakshatra's start).
 */
export function vimshottariTimeline(
  birthUtc: Date,
  siderealMoonLongitude: number,
  count = 10,
): DashaPeriod[] {
  const nak = nakshatraOf(siderealMoonLongitude);
  const startIdx = DASHA_SEQUENCE.indexOf(nak.lord);
  const balanceYears = (1 - nak.traversed) * DASHA_YEARS[nak.lord];

  const periods: DashaPeriod[] = [];
  let cursor = birthUtc;
  for (let i = 0; i < count; i++) {
    const lord = DASHA_SEQUENCE[(startIdx + i) % 9];
    const years = i === 0 ? balanceYears : DASHA_YEARS[lord];
    const end = addYears(cursor, years);
    periods.push({
      lord,
      years: Math.round(years * 10000) / 10000,
      isBalance: i === 0,
      startISO: cursor.toISOString(),
      endISO: end.toISOString(),
    });
    cursor = end;
  }
  return periods;
}

/** The dasha period in force at a given instant, if covered. */
export function dashaAt(periods: readonly DashaPeriod[], when: Date): DashaPeriod | null {
  const t = when.getTime();
  return (
    periods.find(
      (p) => t >= Date.parse(p.startISO) && t < Date.parse(p.endISO),
    ) ?? null
  );
}

/* ------------------------------------------------------------------ */
/* Antardasha (sub-periods) — moved here from redbook.ts in            */
/* milestone 7 so the free Vedic page and the Red Book share one       */
/* implementation (redbook.ts re-exports for compatibility).           */
/* ------------------------------------------------------------------ */

export interface SubPeriod {
  lord: string;
  startISO: string;
  endISO: string;
}

/**
 * Antardashas within one Mahadasha: the nine lords in sequence from
 * the Mahadasha lord, each lasting (its Vimshottari years / 120) of
 * the Mahadasha's actual span — the standard Parashari proportion.
 * Exact for full Mahadashas; for the balance period it divides the
 * remaining span proportionally (stated method).
 */
export function antardashas(maha: DashaPeriod): SubPeriod[] {
  const lords = Object.keys(DASHA_YEARS) as Array<keyof typeof DASHA_YEARS>;
  const startIdx = lords.indexOf(maha.lord as keyof typeof DASHA_YEARS);
  const start = Date.parse(maha.startISO);
  const spanMs = Date.parse(maha.endISO) - start;
  const out: SubPeriod[] = [];
  let cursor = start;
  for (let i = 0; i < 9; i++) {
    const lord = lords[(startIdx + i) % 9];
    const portion = (DASHA_YEARS[lord] / 120) * spanMs;
    const end = i === 8 ? Date.parse(maha.endISO) : cursor + portion;
    out.push({
      lord,
      startISO: new Date(cursor).toISOString(),
      endISO: new Date(end).toISOString(),
    });
    cursor = end;
  }
  return out;
}

/** The Antardasha in force at an instant inside a Mahadasha, if any. */
export function antardashaAt(maha: DashaPeriod, when: Date): SubPeriod | null {
  const t = when.getTime();
  return (
    antardashas(maha).find(
      (s) => t >= Date.parse(s.startISO) && t < Date.parse(s.endISO),
    ) ?? null
  );
}

/* ------------------------------------------------------------------ */
/* Navamsa + pada + the Moon's nakshatra-lord chain (milestone 7)      */
/* ------------------------------------------------------------------ */

import { ZODIAC_SIGNS, type ZodiacSign as ZSign } from "./western.ts";

/** Traditional sign rulers (used for navamsa/pada readings). */
export const SIGN_RULERS: Readonly<Record<string, string>> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const SIGN_ELEMENT_OF: Readonly<Record<string, string>> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

/**
 * The navamsa (D9) sign of a sidereal longitude: each pada of 3°20′ is
 * one navamsa, counted continuously from Aries — pada 1 of Ashwini
 * (0° Aries) is Aries itself, and the count runs through the zodiac.
 */
export function navamsaSign(siderealLongitude: number): ZSign {
  const idx = Math.floor(norm360(siderealLongitude) / PADA_SPAN) % 12;
  return ZODIAC_SIGNS[idx];
}

/**
 * Pada reading for the Moon's nakshatra, individualised: the pada's
 * navamsa sign, its element and ruler, woven with the Moon's actual
 * position. Tradition reads the pada as the Moon's inner orientation
 * (the D9 colouring of the birth star).
 */
export function padaReading(chart: VedicChart): { heading: string; lines: string[]; source: string } {
  const nak = chart.moonNakshatra;
  const moon = chart.grahas.find((g) => g.body === "Moon")!;
  const nav = navamsaSign(moon.sidereal);
  return {
    heading: `${nak.name}, pada ${nak.pada} — navamsa ${nav}`,
    lines: [
      `Your Moon stands at ${moon.sidereal.toFixed(2)}° sidereal — ${(nak.traversed * 100).toFixed(1)}% through ${nak.name} — which places it in pada ${nak.pada} of 4. Each pada is 3°20′ of arc; pada ${nak.pada} spans ${(nak.startDeg + (nak.pada - 1) * PADA_SPAN).toFixed(2)}°–${(nak.startDeg + nak.pada * PADA_SPAN).toFixed(2)}°.`,
      `Pada ${nak.pada} of ${nak.name} falls in navamsa ${nav} — a ${SIGN_ELEMENT_OF[nav]} sign ruled by ${SIGN_RULERS[nav]}. In the Parashari reading the pada colours the birth star with that sign's temperament: the Moon's ${nak.name} nature, expressed through ${nav}.`,
      `The four padas of ${nak.name} run ${[0, 1, 2, 3].map((i) => navamsaSign(nak.startDeg + i * PADA_SPAN + 0.01)).join(", ")} — yours is the ${["first", "second", "third", "fourth"][nak.pada - 1]}, ${nav}.`,
    ],
    source: "Brihat Parashara Hora Shastra — nakshatra/pada and navamsa doctrine (classical).",
  };
}

export interface LordChainLink {
  text: string;
}

/**
 * The Moon's nakshatra-lord chain: the lord of the Moon's nakshatra,
 * then where THAT lord stands and which nakshatra IT occupies (and its
 * lord). Rahu/Ketu links are stated honestly — this build computes no
 * node longitudes, so the chain reports the dasha consequence instead
 * of inventing a position.
 */
export function nakshatraLordChain(chart: VedicChart): string[] {
  const nak = chart.moonNakshatra;
  const lines: string[] = [
    `Chain link 1 — the Moon's star: ${nak.name} is ruled by ${nak.lord}. That lordship is why your Vimshottari sequence opens with the ${nak.lord} Mahadasha (balance ${(chart.dashas[0]?.years ?? 0).toFixed(2)} years at birth).`,
  ];
  const lordGraha = chart.grahas.find((g) => g.body === (nak.lord as string));
  if (lordGraha) {
    const lordNak = nakshatraOf(lordGraha.sidereal);
    lines.push(
      `Chain link 2 — where the lord stands: ${lordGraha.graha} is at ${lordGraha.sidereal.toFixed(2)}° sidereal in ${lordGraha.sign}, itself occupying ${lordNak.name} (pada ${lordNak.pada}), which is ruled by ${lordNak.lord}. The Moon's timing lord is thus coloured by ${lordNak.name}'s star and answers, in turn, to ${lordNak.lord}.`,
    );
  } else {
    lines.push(
      `Chain link 2 — stated honestly: ${nak.lord} is a node (chaya graha). This build computes no Rahu/Ketu longitudes (astronomy-engine has no node ephemeris), so the chain cannot follow ${nak.lord} to a sign. What is exact is the timing consequence above: the ${nak.lord} period opens your dasha sequence.`,
    );
  }
  return lines;
}

/**
 * Graha–number correspondence of modern Indian numerology (the Mulank
 * tradition): Sun 1, Moon 2, Jupiter 3, Rahu 4, Mercury 5, Venus 6,
 * Ketu 7, Saturn 8, Mars 9. Used only for cross-system convergence
 * checks, and labelled MODERN wherever it appears.
 */
export const GRAHA_NUMBERS: Readonly<Record<DashaLord, number>> = {
  Sun: 1, Moon: 2, Jupiter: 3, Rahu: 4, Mercury: 5,
  Venus: 6, Ketu: 7, Saturn: 8, Mars: 9,
};

/* ------------------------------------------------------------------ */
/* Whole sidereal chart                                                */
/* ------------------------------------------------------------------ */

export interface GrahaPosition {
  graha: string;
  body: PlanetName;
  tropical: number;
  sidereal: number;
  sign: ZodiacSign;
  degreeInSign: number;
}

const CLASSICAL_GRAHAS: ReadonlyArray<{ graha: string; body: PlanetName }> = [
  { graha: "Surya (Sun)", body: "Sun" },
  { graha: "Chandra (Moon)", body: "Moon" },
  { graha: "Mangala (Mars)", body: "Mars" },
  { graha: "Budha (Mercury)", body: "Mercury" },
  { graha: "Guru (Jupiter)", body: "Jupiter" },
  { graha: "Shukra (Venus)", body: "Venus" },
  { graha: "Shani (Saturn)", body: "Saturn" },
];

const OUTER_BODIES: readonly PlanetName[] = ["Uranus", "Neptune", "Pluto"];

export interface VedicChart {
  utcISO: string;
  ayanamsa: number;
  lagna: { sidereal: number; sign: ZodiacSign; degreeInSign: number };
  grahas: GrahaPosition[];
  /** Uranus/Neptune/Pluto — modern additions, NOT classical grahas. */
  outerPlanets: GrahaPosition[];
  moonNakshatra: NakshatraInfo;
  dashas: DashaPeriod[];
  method: string;
}

export function vedicChart(input: ChartInput): VedicChart {
  const { utc, latitude, longitudeEast } = input;
  const ayanamsa = lahiriAyanamsa(utc);

  const toGraha = (graha: string, body: PlanetName): GrahaPosition => {
    const tropical = tropicalLongitude(body, utc);
    const sidereal = norm360(tropical - ayanamsa);
    return {
      graha,
      body,
      tropical,
      sidereal,
      sign: signOf(sidereal),
      degreeInSign: sidereal % 30,
    };
  };

  const grahas = CLASSICAL_GRAHAS.map(({ graha, body }) => toGraha(graha, body));
  const outerPlanets = OUTER_BODIES.map((body) => toGraha(body, body));

  const moonSidereal = grahas.find((g) => g.body === "Moon")!.sidereal;
  const moonNakshatra = nakshatraOf(moonSidereal);

  const lst = localSiderealDegrees(utc, longitudeEast);
  const tropicalAsc = ascendantFromLst(lst, latitude);
  const siderealAsc = norm360(tropicalAsc - ayanamsa);

  return {
    utcISO: utc.toISOString(),
    ayanamsa: Math.round(ayanamsa * 10000) / 10000,
    lagna: {
      sidereal: siderealAsc,
      sign: signOf(siderealAsc),
      degreeInSign: siderealAsc % 30,
    },
    grahas,
    outerPlanets,
    moonNakshatra,
    dashas: vimshottariTimeline(utc, moonSidereal),
    method:
      "Sidereal = tropical (astronomy-engine, as in the Western engine) − Lahiri ayanamsa (23.857° @ 2000 + 50.28″/yr). Nakshatra from the Moon's sidereal longitude; Vimshottari dasha per BPHS with 365.25-day years. Rahu/Ketu longitudes are not computed in this build (no node ephemeris in astronomy-engine).",
  };
}
