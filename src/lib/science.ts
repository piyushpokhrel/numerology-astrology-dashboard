/**
 * SCIENCE layer (milestone 8) — measured astronomy and physics, and
 * nothing else. Every figure here comes from astronomy-engine vectors
 * or from arithmetic on them:
 *
 *   distance      — magnitude of the geocentric vector (AU and km;
 *                   1 AU = 149,597,870.7 km, the exact IAU value).
 *   longitude     — geocentric ecliptic longitude of date.
 *   speed         — finite difference of longitude over ±0.5 day.
 *   retrograde    — the sign of that speed (apparent motion).
 *   light time    — distance ÷ c, c = 299,792.458 km/s (exact, SI).
 *   orbits done   — elapsed days ÷ published sidereal orbital period.
 *
 * THE HONESTY PANEL (the product's trust signature, shown verbatim on
 * the Science page): the measured gravitational and electromagnetic
 * influence of the planets on a person is effectively zero, and this
 * product does not claim otherwise. This layer is position, distance
 * and motion data — exact and checkable. Meaning, where offered, lives
 * in the clearly-labelled TRADITION/METAPHYSICS layers.
 */

import { Body, Ecliptic, GeoVector } from "astronomy-engine";
import { norm360, type PlanetName } from "./western.ts";

export const AU_KM = 149_597_870.7; // IAU 2012, exact by definition
export const LIGHT_SPEED_KM_S = 299_792.458; // SI, exact

export const SCIENCE_BODIES: ReadonlyArray<{ name: PlanetName | "Moon"; body: Body }> = [
  { name: "Sun", body: Body.Sun },
  { name: "Moon", body: Body.Moon },
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
  { name: "Uranus", body: Body.Uranus },
  { name: "Neptune", body: Body.Neptune },
  { name: "Pluto", body: Body.Pluto },
];

/** Published sidereal orbital periods, days (standard references — JPL/NASA fact sheets). */
export const SIDEREAL_PERIODS_DAYS: Readonly<Record<string, number>> = {
  Sun: 365.256, // the Sun's apparent geocentric cycle = Earth's sidereal year
  Moon: 27.3217,
  Mercury: 87.969,
  Venus: 224.701,
  Mars: 686.98,
  Jupiter: 4332.589,
  Saturn: 10759.22,
  Uranus: 30688.5,
  Neptune: 60182,
  Pluto: 90560,
};

export interface PlanetState {
  name: string;
  distanceAU: number;
  distanceKm: number;
  /** Geocentric ecliptic longitude of date, degrees. */
  longitude: number;
  /** Apparent speed, degrees/day (signed). */
  speedDegPerDay: number;
  retrograde: boolean;
  /** Light-travel time from the body to Earth, seconds. */
  lightSeconds: number;
}

function stateAt(body: Body, name: string, when: Date): PlanetState {
  const vec = GeoVector(body, when, true);
  const distAU = Math.hypot(vec.x, vec.y, vec.z);
  const lon = Ecliptic(vec).elon;
  const h = 0.5 * 86400_000;
  const lonBefore = Ecliptic(GeoVector(body, new Date(when.getTime() - h), true)).elon;
  const lonAfter = Ecliptic(GeoVector(body, new Date(when.getTime() + h), true)).elon;
  let delta = lonAfter - lonBefore;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const speed = delta / 1; // per day (±0.5 day span = 1 day)
  const distanceKm = distAU * AU_KM;
  return {
    name,
    distanceAU: distAU,
    distanceKm,
    longitude: norm360(lon),
    speedDegPerDay: speed,
    retrograde: speed < 0,
    lightSeconds: distanceKm / LIGHT_SPEED_KM_S,
  };
}

/** The full measured state of every body at one instant. */
export function planetStates(when: Date): PlanetState[] {
  return SCIENCE_BODIES.map(({ name, body }) => stateAt(body, name, when));
}

export interface PlanetChange {
  name: string;
  atBirth: PlanetState;
  today: PlanetState;
  /** Signed distance change, km (today − birth). */
  distanceDeltaKm: number;
  /** Total degrees travelled along its orbit since birth (mean motion × elapsed time). */
  degreesTravelled: number;
  /** Full orbits completed since birth. */
  orbitsCompleted: number;
  periodDays: number;
}

/** Birth → today change table: real arithmetic on the two measured states. */
export function planetChanges(birth: Date, today: Date): PlanetChange[] {
  const elapsedDays = (today.getTime() - birth.getTime()) / 86400_000;
  const birthStates = planetStates(birth);
  const todayStates = planetStates(today);
  return SCIENCE_BODIES.map(({ name }, i) => {
    const period = SIDEREAL_PERIODS_DAYS[name];
    const travelled = (elapsedDays / period) * 360;
    return {
      name,
      atBirth: birthStates[i],
      today: todayStates[i],
      distanceDeltaKm: todayStates[i].distanceKm - birthStates[i].distanceKm,
      degreesTravelled: travelled,
      orbitsCompleted: Math.floor(elapsedDays / period),
      periodDays: period,
    };
  });
}

/** Format a light-travel time in seconds as a human string. */
export function formatLightTime(seconds: number): string {
  if (seconds < 120) return `${seconds.toFixed(1)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${minutes.toFixed(1)} minutes`;
  const hours = minutes / 60;
  return `${hours.toFixed(2)} hours`;
}

export const SCIENCE_HONESTY_PANEL = [
  "What this page is: exact positions, distances and motions of the planets at your birth instant and today — computed from the same ephemeris the rest of this site uses, and checkable against any published ephemeris.",
  "What this page is not: a claim of physical influence. The measured gravitational pull of a planet on a person is effectively zero — smaller than the pull of nearby furniture — and planetary electromagnetic radiation reaching you is negligible. This product does not claim otherwise, anywhere.",
  "Where this site offers meaning — cycles, dashas, correspondences — it is labelled TRADITION or METAPHYSICS and cited to its source. Science measures; tradition interprets. The two are never blended on this site.",
] as const;
