/**
 * METAPHYSICS layer (milestone 8) — traditional correspondences,
 * labelled TRADITIONAL or MODERN, never dressed as physics.
 *
 *   Planet → metal + weekday: the classical table compiled in
 *   Agrippa's Three Books of Occult Philosophy and carried in every
 *   standard correspondence reference since (Sun–gold–Sunday,
 *   Moon–silver–Monday, Mars–iron–Tuesday, Mercury–quicksilver–
 *   Wednesday, Jupiter–tin–Thursday, Venus–copper–Friday,
 *   Saturn–lead–Saturday). The outer planets have no classical
 *   weekday/metal — stated, not invented.
 *
 *   Planet → tone: Hans Cousto's "Cosmic Octave" (1978) — the orbital
 *   frequency doubled by octaves into the audible range. The
 *   arithmetic is exact; the correspondence is a MODERN method and is
 *   labelled as such wherever it appears.
 *
 *   Planet → number: the graha–number (Mulank) correspondence from
 *   vedic.ts, MODERN Indian numerology.
 *
 * "CHANGE IN ENERGY" is expressed ONLY as the traditions express it:
 * computed cycle-phase changes since birth (personal year then vs
 * now, Mahadasha at birth vs now, Chinese year-relation change) —
 * real dates and positions, traditional interpretation, labelled.
 */

import { GRAHA_NUMBERS, type DashaLord } from "./vedic.ts";
import { SIDEREAL_PERIODS_DAYS } from "./science.ts";

export interface Correspondence {
  planet: string;
  number: number | null; // graha–number (MODERN); null for outer planets
  metal: string | null; // classical table; null where the classical table has none
  weekday: string | null;
  /** Cousto Cosmic Octave tone in Hz (audible octave of the orbital frequency). */
  toneHz: number;
  toneNote: string;
}

const CLASSICAL: Readonly<Record<string, { metal: string; weekday: string }>> = {
  Sun: { metal: "Gold", weekday: "Sunday" },
  Moon: { metal: "Silver", weekday: "Monday" },
  Mars: { metal: "Iron", weekday: "Tuesday" },
  Mercury: { metal: "Quicksilver (mercury)", weekday: "Wednesday" },
  Jupiter: { metal: "Tin", weekday: "Thursday" },
  Venus: { metal: "Copper", weekday: "Friday" },
  Saturn: { metal: "Lead", weekday: "Saturday" },
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Cousto's method: f = (1 / period in seconds) × 2^n, raised to the audible range. */
export function cosmicOctaveHz(periodDays: number): { hz: number; note: string } {
  let f = 1 / (periodDays * 86400);
  while (f < 100) f *= 2;
  while (f >= 200) f /= 2;
  // Nearest equal-tempered note (A4 = 440 Hz reference).
  const semis = Math.round(12 * Math.log2(f / 440));
  const note = NOTE_NAMES[((semis % 12) + 12 + 9) % 12]; // A is index 9 offset from C
  return { hz: Math.round(f * 100) / 100, note };
}

export function correspondence(planet: string): Correspondence {
  const classical = CLASSICAL[planet];
  const period = SIDEREAL_PERIODS_DAYS[planet];
  const tone = period ? cosmicOctaveHz(period) : { hz: 0, note: "—" };
  const number =
    planet in GRAHA_NUMBERS ? GRAHA_NUMBERS[planet as DashaLord] : null;
  return {
    planet,
    number,
    metal: classical?.metal ?? null,
    weekday: classical?.weekday ?? null,
    toneHz: tone.hz,
    toneNote: tone.note,
  };
}

export const ALL_PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
  "Uranus", "Neptune", "Pluto",
] as const;

export function allCorrespondences(): Correspondence[] {
  return ALL_PLANETS.map((p) => correspondence(p));
}

export const CORRESPONDENCE_SOURCE =
  "Metals and weekdays: the classical planetary table as compiled in Agrippa, Three Books of Occult Philosophy (1533), carried in standard correspondence references — TRADITIONAL. Tones: Hans Cousto, The Cosmic Octave (1978) — MODERN method; the arithmetic is shown, the correspondence is a modern convention. Numbers: graha–number (Mulank) correspondence — MODERN Indian numerology.";
