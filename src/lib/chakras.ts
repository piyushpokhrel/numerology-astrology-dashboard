/**
 * SEVEN CHAKRAS (milestone 8) — labelled MODERN/METAPHYSICAL.
 * Correspondence, not medicine.
 *
 * The planet pairing used here is the modern Vedic bridge published
 * identically in two independent modern tables (withashoka.com's
 * chakra reference and celesian.com's sign–chakra table, both
 * consulted Nov 2026): Saturn–Root, Jupiter–Sacral, Mars–Solar
 * Plexus, Venus–Heart, Mercury–Throat, Moon–Third Eye, Sun–Crown.
 * David Frawley's published system (Astrology of the Seers, ch. 12)
 * agrees on Saturn/Jupiter/Mars/Venus/Mercury and pairs Sun+Moon
 * jointly at the Third Eye, treating the Crown as beyond the
 * planetary scheme — the variance is stated, not hidden. Chakra
 * ELEMENTS are the classical yoga attributions (Sat-Chakra-Nirupana
 * tradition). Chakra NUMBERS use the graha–number (Mulank)
 * correspondence, MODERN.
 *
 * The "strength indicator" is COMPUTED from the chart: the associated
 * planet's classical dignity in this chart (own sign / exaltation =
 * strong; detriment / fall = challenged; otherwise placed), whether
 * it sits in an angular house (1, 4, 7, 10 — whole sign), and whether
 * its number appears among the profile's core numbers. It is an
 * indicator inside a spiritual framework — NOT a medical or health
 * assessment, and this module contains no health claims.
 */

import { GRAHA_NUMBERS, type DashaLord } from "./vedic.ts";
import type { CoreProfile } from "./numerology.ts";
import type { WesternChart } from "./western.ts";

export interface ChakraDef {
  index: number;
  name: string;
  sanskrit: string;
  planet: string;
  element: string;
  theme: string;
}

export const CHAKRAS: ReadonlyArray<ChakraDef> = [
  { index: 1, name: "Root", sanskrit: "Muladhara", planet: "Saturn", element: "Earth", theme: "grounding, structure, survival, patience" },
  { index: 2, name: "Sacral", sanskrit: "Svadhisthana", planet: "Jupiter", element: "Water", theme: "expansion, creativity, abundance, faith" },
  { index: 3, name: "Solar Plexus", sanskrit: "Manipura", planet: "Mars", element: "Fire", theme: "will, drive, courage, personal power" },
  { index: 4, name: "Heart", sanskrit: "Anahata", planet: "Venus", element: "Air", theme: "love, beauty, connection, harmony" },
  { index: 5, name: "Throat", sanskrit: "Vishuddha", planet: "Mercury", element: "Akasha (ether)", theme: "speech, intellect, expression, truth-telling" },
  { index: 6, name: "Third Eye", sanskrit: "Ajna", planet: "Moon", element: "Light / mind", theme: "intuition, perception, inner vision" },
  { index: 7, name: "Crown", sanskrit: "Sahasrara", planet: "Sun", element: "Beyond the elements", theme: "consciousness, identity, vitality, unity" },
];

/** Classical dignities (Western traditional): own sign, exaltation, detriment, fall. */
const DIGNITIES: Readonly<Record<string, { own: string[]; exalted: string; detriment: string[]; fall: string }>> = {
  Sun: { own: ["Leo"], exalted: "Aries", detriment: ["Aquarius"], fall: "Libra" },
  Moon: { own: ["Cancer"], exalted: "Taurus", detriment: ["Capricorn"], fall: "Scorpio" },
  Mercury: { own: ["Gemini", "Virgo"], exalted: "Virgo", detriment: ["Sagittarius", "Pisces"], fall: "Pisces" },
  Venus: { own: ["Taurus", "Libra"], exalted: "Pisces", detriment: ["Aries", "Scorpio"], fall: "Virgo" },
  Mars: { own: ["Aries", "Scorpio"], exalted: "Capricorn", detriment: ["Taurus", "Libra"], fall: "Cancer" },
  Jupiter: { own: ["Sagittarius", "Pisces"], exalted: "Cancer", detriment: ["Gemini", "Virgo"], fall: "Capricorn" },
  Saturn: { own: ["Capricorn", "Aquarius"], exalted: "Libra", detriment: ["Cancer", "Leo"], fall: "Aries" },
};

export type DignityState = "own sign" | "exalted" | "placed" | "detriment" | "fall";

export function dignityOf(planet: string, sign: string): DignityState {
  const d = DIGNITIES[planet];
  if (!d) return "placed";
  if (d.own.includes(sign)) return "own sign";
  if (d.exalted === sign) return "exalted";
  if (d.detriment.includes(sign)) return "detriment";
  if (d.fall === sign) return "fall";
  return "placed";
}

export interface ChakraReading {
  def: ChakraDef;
  number: number;
  dignity: DignityState;
  sign: string;
  house: number;
  angular: boolean;
  numberPresent: boolean;
  /** Plain-language strength word from the computed indicator. */
  indicator: "strong" | "steady" | "quiet";
  text: string;
}

export function chakraReadings(chart: WesternChart, core: CoreProfile): ChakraReading[] {
  const coreNumbers = new Set([
    core.lifePath, core.birthday, core.attitude, core.destinyPythagorean,
    core.destinyChaldean, core.soulUrge, core.personality,
  ]);
  return CHAKRAS.map((def) => {
    const pos = chart.positions.find((p) => p.body === def.planet)!;
    const dignity = dignityOf(def.planet, pos.sign);
    const angular = [1, 4, 7, 10].includes(pos.house);
    const number = GRAHA_NUMBERS[def.planet as DashaLord];
    const numberPresent = coreNumbers.has(number);
    const score =
      (dignity === "own sign" || dignity === "exalted" ? 2 : dignity === "placed" ? 1 : 0) +
      (angular ? 1 : 0) +
      (numberPresent ? 1 : 0);
    const indicator = score >= 3 ? "strong" : score >= 1 ? "steady" : "quiet";
    return {
      def,
      number,
      dignity,
      sign: pos.sign,
      house: pos.house,
      angular,
      numberPresent,
      indicator,
      text: `${def.sanskrit} (the ${def.name} centre, theme: ${def.theme}) is paired with ${def.planet} in the modern table. In YOUR chart ${def.planet} stands in ${pos.sign}, house ${pos.house}${angular ? " — an angular house, which the tradition reads as prominent" : ""}, dignity: ${dignity}. ${def.planet}'s number is ${number}${numberPresent ? `, and that number appears among your core numerology numbers — the correspondence is doubly anchored in your profile` : `, which does not appear among your core numbers, so this centre's anchor is the planet's placement alone`}. Indicator from these computed facts: ${indicator}.`,
    };
  });
}

export const CHAKRA_SOURCE =
  "Planet pairing: modern Vedic bridge as published in the withashoka.com chakra reference and celesian.com's sign–chakra table (consulted Nov 2026); Frawley's Astrology of the Seers (ch. 12) agrees except pairing Sun+Moon jointly at the Third Eye and placing the Crown beyond the scheme — tables vary by school and this one is named. Elements: classical yoga attribution (Sat-Chakra-Nirupana tradition). Dignities: classical Western tables. Numbers: graha–number (Mulank) — MODERN.";

export const CHAKRA_HONESTY_NOTE =
  "Chakra work is a spiritual framework, not a medical assessment. Nothing on this page diagnoses, treats, or describes your health; the 'strength indicator' is a computed correspondence inside that framework — the dignity and placement of the associated planet in your chart — and nothing more.";
