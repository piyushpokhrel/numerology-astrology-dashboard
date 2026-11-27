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

/** Back-compat: just the keyword text. Prefer numberMeaning() in new UI. */
export function numberKeyword(n: number): string {
  return numberMeaning(n).text;
}
