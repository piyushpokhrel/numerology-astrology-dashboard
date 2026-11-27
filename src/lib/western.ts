/**
 * Western astrology engine — tropical chart on astronomy-engine.
 *
 * POSITIONS (geocentric, true ecliptic of date — the convention of
 * published ephemerides):
 *   Sun     → Astronomy.SunPosition(date).elon
 *   Moon    → Astronomy.EclipticGeoMoon(date).lon
 *   Planets → Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon
 * Cross-checked 2026-11-26 against two independent published
 * ephemerides (astro-seek + SubaAstro) for 2003-01-01 00:00 UT: every
 * body agreed within 0.013° (under one arc-minute). The check is locked
 * in tests/western.test.ts.
 *
 * ANGLES: Local Sidereal Time LST = GAST (Astronomy.SiderealTime,
 * hours × 15) + east longitude. With obliquity ε = 23.4393°:
 *   MC  = atan2( sin LST, cos LST · cos ε )
 *   ASC = atan2( cos LST, −( sin LST · cos ε + tan φ · sin ε ) )
 * (standard textbook formulas; φ = geographic latitude).
 *
 * HOUSES: Whole Sign — the sign of the Ascendant is the 1st house and
 * each following sign the next house (the v1 standard chosen in the
 * knowledge inventory; quadrant houses are a later refinement).
 *
 * ASPECTS (major five) with documented orbs: 6° standard, 8° when the
 * Sun or Moon is involved; sextile 4° / 6° with a luminary. An aspect
 * is returned when the pair's separation is within orb of exact.
 *
 * DETERMINISM: every function here is a pure function of its inputs —
 * same instant and place always give the same chart (trust rule 4).
 */

import * as Astronomy from "astronomy-engine";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const PLANET_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

export type PlanetName = (typeof PLANET_BODIES)[number];

/** Mean obliquity of the ecliptic, degrees (J2000 value; drift is ~0.013°/century). */
export const OBLIQUITY_DEG = 23.4393;

export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function signOf(longitude: number): ZodiacSign {
  return ZODIAC_SIGNS[Math.floor(norm360(longitude) / 30)];
}

export function degreeInSign(longitude: number): number {
  return norm360(longitude) % 30;
}

/** "16°57′" style rendering of a longitude's position inside its sign. */
export function formatInSign(longitude: number): string {
  const d = degreeInSign(longitude);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′ ${signOf(longitude)}`;
}

/** Geocentric tropical ecliptic longitude of one body at an instant. */
export function tropicalLongitude(body: PlanetName, date: Date): number {
  switch (body) {
    case "Sun":
      return norm360(Astronomy.SunPosition(date).elon);
    case "Moon":
      return norm360(Astronomy.EclipticGeoMoon(date).lon);
    default:
      return norm360(
        Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[body], date, true)).elon,
      );
  }
}

/** Local sidereal time in degrees for an instant and east longitude. */
export function localSiderealDegrees(date: Date, longitudeEast: number): number {
  return norm360(Astronomy.SiderealTime(date) * 15 + longitudeEast);
}

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function deg(r: number): number {
  return (r * 180) / Math.PI;
}

/** Midheaven longitude from LST (degrees). */
export function midheavenFromLst(lstDeg: number): number {
  const t = rad(lstDeg);
  const e = rad(OBLIQUITY_DEG);
  return norm360(deg(Math.atan2(Math.sin(t), Math.cos(t) * Math.cos(e))));
}

/** Ascendant longitude from LST (degrees) and geographic latitude. */
export function ascendantFromLst(lstDeg: number, latitude: number): number {
  const t = rad(lstDeg);
  const e = rad(OBLIQUITY_DEG);
  const phi = rad(latitude);
  return norm360(
    deg(Math.atan2(Math.cos(t), -(Math.sin(t) * Math.cos(e) + Math.tan(phi) * Math.sin(e)))),
  );
}

/* ------------------------------------------------------------------ */
/* Aspects                                                             */
/* ------------------------------------------------------------------ */

export type AspectType = "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";

export const ASPECT_ANGLES: Readonly<Record<AspectType, number>> = {
  Conjunction: 0,
  Sextile: 60,
  Square: 90,
  Trine: 120,
  Opposition: 180,
};

/** Orb allowance: base orb, widened when the Sun or Moon takes part. */
export function aspectOrb(type: AspectType, a: string, b: string): number {
  const luminary = a === "Sun" || a === "Moon" || b === "Sun" || b === "Moon";
  if (type === "Sextile") return luminary ? 6 : 4;
  return luminary ? 8 : 6;
}

export interface Aspect {
  a: PlanetName;
  b: PlanetName;
  type: AspectType;
  /** Degrees away from exact (0 = exact). */
  orb: number;
  /** The pair's actual angular separation, 0–180. */
  separation: number;
}

export function angularSeparation(lon1: number, lon2: number): number {
  const d = Math.abs(norm360(lon1) - norm360(lon2)) % 360;
  return d > 180 ? 360 - d : d;
}

export function findAspects(
  positions: ReadonlyArray<{ body: PlanetName; longitude: number }>,
): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const sep = angularSeparation(positions[i].longitude, positions[j].longitude);
      for (const type of Object.keys(ASPECT_ANGLES) as AspectType[]) {
        const orb = Math.abs(sep - ASPECT_ANGLES[type]);
        if (orb <= aspectOrb(type, positions[i].body, positions[j].body)) {
          out.push({
            a: positions[i].body,
            b: positions[j].body,
            type,
            orb: Math.round(orb * 100) / 100,
            separation: Math.round(sep * 100) / 100,
          });
          break; // a pair can only form one major aspect
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/* ------------------------------------------------------------------ */
/* Whole chart                                                         */
/* ------------------------------------------------------------------ */

export interface PlanetPosition {
  body: PlanetName;
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
  /** Whole-sign house (1–12), counted from the Ascendant sign. */
  house: number;
}

export interface WesternChart {
  /** The exact UTC instant the chart was computed for (ISO). */
  utcISO: string;
  latitude: number;
  longitudeEast: number;
  lstDegrees: number;
  ascendant: number;
  ascendantSign: ZodiacSign;
  midheaven: number;
  midheavenSign: ZodiacSign;
  positions: PlanetPosition[];
  aspects: Aspect[];
  elementBalance: Record<"Fire" | "Earth" | "Air" | "Water", number>;
  /** Calculation provenance — shown in the UI ("show the math"). */
  method: string;
}

const SIGN_ELEMENTS: ReadonlyArray<"Fire" | "Earth" | "Air" | "Water"> = [
  "Fire", "Earth", "Air", "Water", "Fire", "Earth",
  "Air", "Water", "Fire", "Earth", "Air", "Water",
];

export function wholeSignHouse(longitude: number, ascendantLongitude: number): number {
  const signIdx = Math.floor(norm360(longitude) / 30);
  const ascIdx = Math.floor(norm360(ascendantLongitude) / 30);
  return ((signIdx - ascIdx + 12) % 12) + 1;
}

export interface ChartInput {
  /** The birth instant, already converted to UTC. */
  utc: Date;
  latitude: number;
  /** East-positive longitude, degrees. */
  longitudeEast: number;
}

/* ------------------------------------------------------------------ */
/* Derivatives (milestone 7): quality balance, chart ruler, tightest   */
/* aspect — all read off THIS chart's computed distribution.           */
/* ------------------------------------------------------------------ */

export type Quality = "Cardinal" | "Fixed" | "Mutable";

const SIGN_QUALITIES: ReadonlyArray<Quality> = [
  "Cardinal", "Fixed", "Mutable", "Cardinal", "Fixed", "Mutable",
  "Cardinal", "Fixed", "Mutable", "Cardinal", "Fixed", "Mutable",
];

export function qualityOf(sign: ZodiacSign): Quality {
  return SIGN_QUALITIES[ZODIAC_SIGNS.indexOf(sign)];
}

export function signElement(sign: ZodiacSign): "Fire" | "Earth" | "Air" | "Water" {
  return SIGN_ELEMENTS[ZODIAC_SIGNS.indexOf(sign)];
}

/** Count of the ten bodies by quality (mode) in this chart. */
export function qualityBalance(chart: WesternChart): Record<Quality, number> {
  const out: Record<Quality, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of chart.positions) out[qualityOf(p.sign)]++;
  return out;
}

/** Traditional sign rulers (pre-telescope doctrine). */
export const SIGN_RULERS: Readonly<Record<ZodiacSign, PlanetName>> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn",
  Pisces: "Jupiter",
};

/** Modern co-rulers, shown only where the modern school adds one. */
export const SIGN_MODERN_CO_RULERS: Readonly<Partial<Record<ZodiacSign, PlanetName>>> = {
  Scorpio: "Pluto",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

export interface ChartRuler {
  ruler: PlanetName;
  modernCoRuler: PlanetName | null;
  position: PlanetPosition;
  note: string;
}

/**
 * The chart ruler: the traditional ruler of the Ascendant sign, and
 * where that ruler actually sits in THIS chart (sign + whole-sign
 * house). Classical doctrine reads the ruler's placement as the
 * chart's steering wheel.
 */
export function chartRuler(chart: WesternChart): ChartRuler {
  const ruler = SIGN_RULERS[chart.ascendantSign];
  const position = chart.positions.find((p) => p.body === ruler)!;
  const modernCoRuler = SIGN_MODERN_CO_RULERS[chart.ascendantSign] ?? null;
  return {
    ruler,
    modernCoRuler,
    position,
    note: `Your Ascendant is ${chart.ascendantSign}, ruled in the traditional scheme by ${ruler}. In this chart ${ruler} stands in ${position.sign}, house ${position.house} — the tradition reads the whole chart's direction from that placement: the Ascendant proposes, the ruler disposes.`,
  };
}

/** The tightest aspect in the chart (smallest orb), or null when none is in orb. */
export function tightestAspect(chart: WesternChart): Aspect | null {
  return chart.aspects.length ? chart.aspects[0] : null;
}

export function westernChart(input: ChartInput): WesternChart {
  const { utc, latitude, longitudeEast } = input;
  const lst = localSiderealDegrees(utc, longitudeEast);
  const ascendant = ascendantFromLst(lst, latitude);
  const midheaven = midheavenFromLst(lst);

  const positions: PlanetPosition[] = PLANET_BODIES.map((body) => {
    const longitude = tropicalLongitude(body, utc);
    return {
      body,
      longitude,
      sign: signOf(longitude),
      degreeInSign: degreeInSign(longitude),
      house: wholeSignHouse(longitude, ascendant),
    };
  });

  const elementBalance: WesternChart["elementBalance"] = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of positions) {
    elementBalance[SIGN_ELEMENTS[ZODIAC_SIGNS.indexOf(p.sign)]]++;
  }

  return {
    utcISO: utc.toISOString(),
    latitude,
    longitudeEast,
    lstDegrees: Math.round(lst * 10000) / 10000,
    ascendant,
    ascendantSign: signOf(ascendant),
    midheaven,
    midheavenSign: signOf(midheaven),
    positions,
    aspects: findAspects(positions),
    elementBalance,
    method:
      "Geocentric apparent longitudes, true ecliptic of date, via astronomy-engine (Sun: SunPosition; Moon: EclipticGeoMoon; planets: Ecliptic∘GeoVector with aberration). Angles from local sidereal time; Whole Sign houses.",
  };
}
