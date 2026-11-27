/**
 * FIVE ELEMENTS, THREE SYSTEMS (milestone 8) — computed balances side
 * by side, each from the profile's own distributions, each with its
 * method stated:
 *
 *   VEDIC Pancha Bhuta — counted from the seven classical grahas'
 *   SIDEREAL sign elements (Fire→Agni, Earth→Prithvi, Air→Vayu,
 *   Water→Jala). Akasha (space) is handled explicitly: no sign is made
 *   of Akasha; in the classical scheme Akasha is the medium the other
 *   four move in, and its graha correspondence is Jupiter (the
 *   akasha-tattva graha in the tattva tradition). We therefore report
 *   Akasha separately as Jupiter's sidereal dignity note — counted
 *   honestly as "not a sign element", never silently dropped.
 *
 *   CHINESE Wu Xing — counted from the BaZi-lite pillars this site
 *   computes: year pillar (stem + branch elements), day pillar (stem +
 *   branch), and the hour pillar when a birth time exists. Method
 *   stated on the page; the month pillar (solar terms) is not yet
 *   computed and is not claimed.
 *
 *   WESTERN — the chart's elementBalance over the ten bodies, plus the
 *   Spirit/Quintessence note: the fifth element of the Western scheme
 *   is not a placement and is never counted.
 */

import type { ChineseProfile } from "./chinese.ts";
import { dayPillar, hourPillar } from "./chinese.ts";
import type { VedicChart } from "./vedic.ts";
import { signElement, type WesternChart } from "./western.ts";

export interface ElementBalance {
  system: "Vedic Pancha Bhuta" | "Chinese Wu Xing" | "Western";
  counts: Record<string, number>;
  total: number;
  dominant: string;
  lacking: string[];
  derivation: string;
  note: string;
  source: string;
}

const VEDIC_MAP: Record<string, string> = {
  Fire: "Agni", Earth: "Prithvi", Air: "Vayu", Water: "Jala",
};

export function vedicElements(chart: VedicChart): ElementBalance {
  const counts: Record<string, number> = { Agni: 0, Prithvi: 0, Vayu: 0, Jala: 0 };
  for (const g of chart.grahas) {
    counts[VEDIC_MAP[signElement(g.sign)]]++;
  }
  const jupiter = chart.grahas.find((g) => g.body === "Jupiter")!;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    system: "Vedic Pancha Bhuta",
    counts,
    total: 7,
    dominant: sorted[0][0],
    lacking: sorted.filter(([, n]) => n === 0).map(([k]) => k),
    derivation: `Counted from the seven classical grahas' sidereal signs: ${chart.grahas.map((g) => `${g.body} in ${g.sign} (${VEDIC_MAP[signElement(g.sign)]})`).join("; ")}.`,
    note: `Akasha (space), the fifth bhuta, is not a sign element: classically it is the medium the other four move in. Its graha correspondence is Jupiter — yours stands in ${jupiter.sign} sidereal — so Akasha is reported here as Jupiter's placement rather than counted as a placement. Any site that counts Akasha among sign placements is inventing data.`,
    source: "Pancha Bhuta doctrine (classical Ayurveda/Jyotisha tattva tradition); sign elements per the standard sidereal chart.",
  };
}

export function chineseElements(
  profile: ChineseProfile,
  dob: string,
  birthTime?: string,
): ElementBalance {
  const counts: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  const day = dayPillar(dob);
  const hour = hourPillar(dob, birthTime);
  const parts: string[] = [
    `year stem ${profile.element}`,
    `year branch ${profile.animal} — counted via the year's stem/branch pair`,
  ];
  counts[profile.element]++;
  // Year branch element via the day-pillar branch table equivalent: use the profile's zodiac-year stem/branch.
  // The branch element is derived from the animal's branch main qi.
  const branchEl = BRANCH_MAIN_ELEMENT[profile.animal];
  counts[branchEl]++;
  counts[day.stemElement]++;
  counts[day.branchElement]++;
  parts.push(`day stem ${day.stemElement}`, `day branch ${day.branchElement}`);
  if (hour) {
    counts[hour.stemElement]++;
    counts[hour.branchElement]++;
    parts.push(`hour stem ${hour.stemElement}`, `hour branch ${hour.branchElement}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    system: "Chinese Wu Xing",
    counts,
    total,
    dominant: sorted[0][0],
    lacking: sorted.filter(([, n]) => n === 0).map(([k]) => k),
    derivation: `Counted from your computed pillars: ${parts.join("; ")}.${hour ? "" : " No birth time is recorded, so no hour pillar is counted — the balance is computed from year + day pillars only, and says so."}`,
    note: "Method stated: this is the BaZi-lite count (year + day + hour pillars). The month pillar, which needs solar-term boundaries, is not yet computed by this site and is not silently omitted — it is named here as the known gap.",
    source: "Wu Xing (五行) generating/controlling doctrine — traditional; pillar formulas as in the Chinese engine (JDN day cycle, Five Rats hour rule).",
  };
}

const BRANCH_MAIN_ELEMENT: Record<string, string> = {
  Rat: "Water", Ox: "Earth", Tiger: "Wood", Rabbit: "Wood", Dragon: "Earth",
  Snake: "Fire", Horse: "Fire", Goat: "Earth", Monkey: "Metal", Rooster: "Metal",
  Dog: "Earth", Pig: "Water",
};

export function westernElements(chart: WesternChart): ElementBalance {
  const counts: Record<string, number> = { ...chart.elementBalance };
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    system: "Western",
    counts,
    total: 10,
    dominant: sorted[0][0],
    lacking: sorted.filter(([, n]) => n === 0).map(([k]) => k),
    derivation: `Counted from the ten bodies' tropical signs: ${chart.positions.map((p) => `${p.body} in ${p.sign} (${signElement(p.sign)})`).join("; ")}.`,
    note: "Spirit (Quintessence, the fifth essence of the Western scheme) is not a placement and is never counted — it names the whole chart's unity in the classical scheme, not a tenth-of-the-pie slice.",
    source: "Four-element doctrine of Western astrology (classical); counts from this chart's computed distribution.",
  };
}

export function allElementBalances(
  vedic: VedicChart,
  chinese: ChineseProfile,
  western: WesternChart,
  dob: string,
  birthTime?: string,
): ElementBalance[] {
  return [
    vedicElements(vedic),
    chineseElements(chinese, dob, birthTime),
    westernElements(western),
  ];
}
