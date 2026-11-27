/**
 * Interpretation layer v1 — short traditional keywords for the core
 * numbers. Per the differentiation spec (trust rule 2), EVERY
 * interpretation carries its source. These one-liners are modern
 * summaries in the Decoz tradition — labelled MODERN, never presented
 * as classical text or as prediction.
 */

export interface NumberMeaning {
  text: string;
  /** Citation shown wherever the text is displayed. */
  source: string;
  era: "MODERN";
}

const SOURCE = "Modern published numerology (Decoz method) — summary";

const M = (text: string): NumberMeaning => ({ text, source: SOURCE, era: "MODERN" });

export const NUMBER_MEANINGS: Readonly<Record<number, NumberMeaning>> = {
  1: M("The Leader — independence, initiative, new beginnings"),
  2: M("The Diplomat — balance, partnership, sensitivity"),
  3: M("The Creator — expression, optimism, communication"),
  4: M("The Builder — stability, work, foundations"),
  5: M("The Traveller — change, freedom, movement"),
  6: M("The Nurturer — responsibility, home, harmony"),
  7: M("The Seeker — analysis, introspection, truth"),
  8: M("The Powerhouse — ambition, resources, authority"),
  9: M("The Humanitarian — compassion, completion, release"),
  11: M("Master 11 — the Illuminator: intuition, inspiration, heightened sensitivity"),
  22: M("Master 22 — the Master Builder: large-scale practical vision"),
  33: M("Master 33 — the Master Teacher: healing through service"),
};

export function numberMeaning(n: number): NumberMeaning {
  return NUMBER_MEANINGS[n] ?? { text: "", source: SOURCE, era: "MODERN" };
}

/* ------------------------------------------------------------------ */
/* Both-ways readings (milestone 7 — Piyush's direction)               */
/*                                                                     */
/* A master number is ALWAYS explained both ways: the master reading  */
/* AND the root reading, labelled. The display form ("11/2") comes    */
/* from displayNumber() in numerology.ts.                             */
/* ------------------------------------------------------------------ */

import { displayNumber, isMasterNumber, masterRoot } from "./numerology.ts";

export interface BothWaysReading {
  /** "11/2" for a master number, "4" for an ordinary one. */
  display: string;
  isMaster: boolean;
  /** Labelled reading lines — two for a master (master + root), one otherwise. */
  lines: string[];
  source: string;
  era: "MODERN";
}

/** The both-ways reading of one number: master way + root way, labelled. */
export function bothWays(n: number): BothWaysReading {
  const display = displayNumber(n);
  if (!isMasterNumber(n)) {
    return {
      display,
      isMaster: false,
      lines: [`The ${n} reading: ${numberMeaning(n).text}.`],
      source: SOURCE,
      era: "MODERN",
    };
  }
  const root = masterRoot(n)!;
  return {
    display,
    isMaster: true,
    lines: [
      `The master way — ${n}: ${numberMeaning(n).text}. The master number is read at full voltage: the tradition treats it as the root's theme under pressure and promise, never reduced away.`,
      `The root way — ${root}: ${numberMeaning(root).text}. Every master number is also lived at its root on ordinary days; the ${root} reading is the ground the ${n} stands on.`,
    ],
    source: SOURCE,
    era: "MODERN",
  };
}

/**
 * An INDIVIDUALISED explanation of one of a person's numbers: the role
 * it plays, the person's own value (both-ways display), the derivation
 * with their actual figures, and the reading. Two profiles with
 * different values or derivations can never produce the same text.
 */
export function explainNumber(
  role: string,
  value: number,
  derivation: string,
): { heading: string; lines: string[]; source: string } {
  const bw = bothWays(value);
  return {
    heading: `${role} — ${bw.display}`,
    lines: [
      `How yours is derived: ${derivation}`,
      ...bw.lines,
    ],
    source: bw.source,
  };
}

/** Back-compat: just the keyword text. Prefer numberMeaning() in new UI. */
export function numberKeyword(n: number): string {
  return numberMeaning(n).text;
}
