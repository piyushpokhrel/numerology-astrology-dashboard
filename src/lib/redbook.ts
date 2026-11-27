/**
 * THE RED BOOK — the full deep reading.
 *
 * A deterministic content generator: the same profile + chart input +
 * anchor date always produce the identical book, chapter for chapter.
 * Everything is derived from the existing engines (numerology, chinese,
 * western, vedic) and the meanings layer — no new astronomy, no
 * randomness, and every interpretive line carries its source, per the
 * differentiation spec (trust rules 1, 2 and 4).
 *
 * Commercial shape (per the freemium direction, Nov 26 2026):
 *   - The whole rest of the site is the free core, free forever.
 *   - The Red Book is the single paid product: CAD $19, one payment,
 *     no tiers, no subscription. Chapter 1 is the free preview.
 */

import {
  chineseProfile,
  hourPillar,
  relationBetween,
  yearOutlook,
  RELATION_LABELS,
  type ChineseProfile,
} from "./chinese.ts";
import { bothWays, explainNumber, numberKeyword, numberMeaning } from "./meanings.ts";
import {
  balanceNumber,
  challenges,
  compoundFamily,
  coreProfile,
  displayNumber,
  growthNumber,
  maturityNumber,
  personalMonth,
  pinnacles,
  rationalThoughtNumber,
  reduceNumber,
  type CoreProfile,
} from "./numerology.ts";
import type { Profile } from "./profile.ts";
import {
  antardashas,
  antardashaAt,
  dashaAt,
  nakshatraLordChain,
  padaReading,
  vedicChart,
  GRAHA_NUMBERS,
  type VedicChart,
} from "./vedic.ts";
import {
  chartRuler,
  formatInSign,
  qualityBalance,
  tightestAspect,
  westernChart,
  type ChartInput,
  type WesternChart,
} from "./western.ts";
import { karmaReport } from "./karma.ts";
import { ISHTA_EXPLANATION, RESONANCE, RESONANCE_FRAMING, jaimini } from "./jaimini.ts";

/** Back-compat: the Antardasha engine now lives in vedic.ts (milestone 7). */
export { antardashas } from "./vedic.ts";
export type { SubPeriod } from "./vedic.ts";

/* ------------------------------------------------------------------ */
/* Cheiro compound-number meanings (Book of Numbers, 1926)             */
/* ------------------------------------------------------------------ */

/**
 * Brief summaries of Cheiro's compound ("occult") number readings,
 * 10–52, from The Book of Numbers (1926). Compounds above 52 are read
 * through their family (Cheiro reads 34 with 25, 35 with 26, etc. —
 * the compound minus 9 shares the reading); the table encodes that.
 * Labelled MODERN-CLASSICAL wherever displayed: Cheiro's table is his
 * own construction, per the knowledge inventory's honesty flags.
 */
const CHEIRO_COMPOUNDS: Readonly<Record<number, string>> = {
  10: "The Wheel of Fortune — honour and success; a rise that must be held with humility, for the wheel turns.",
  11: "The Muzzled Lion — strength under restraint; hidden opposition and trials met quietly.",
  12: "The Sacrifice — plans that demand giving something up for others; anxiety about the future is the tax.",
  13: "Regeneration — upheaval that clears the ground; destruction of the old so the new can be built. A karmic-debt number in the modern tradition.",
  14: "Magnetic Communication — movement, money and attraction; danger comes through natural forces and hasty words. A karmic-debt number in the modern tradition.",
  15: "The Magician — powerful occult significance; fortunate when used for others, destructive when used only for self.",
  16: "The Shattered Citadel — sudden downfall of built plans; what falls was resting on a false base. A karmic-debt number in the modern tradition.",
  17: "The Star of the Magi — victory of spirit over trials; the number of a lasting legacy, Cheiro's most hopeful compound.",
  18: "Spiritual–Material Conflict — deception and struggle before clarity; war between the inner and outer life.",
  19: "The Prince of Heaven — victory, success and happiness; the Sun's number. A karmic-debt number in the modern tradition when it appears as a compound to be worked through.",
  20: "The Awakening — a spiritual call that overrides delay; slow to start, triumphant through faith.",
  21: "The Crown of the Magi — advancement and universal success after testing.",
  22: "Submission and Caution — error of judgment and folly; a warning to verify before trusting.",
  23: "The Royal Star of the Lion — success with help from those above; a fortunate, protected number.",
  24: "Love, Money and Creativity — gain through love, cooperation and creative work; fortunate.",
  25: "Strength Through Experience — neither fortunate nor unfortunate of itself; power earned by observation.",
  26: "Grave Dangers — difficulty arising through association with others; choose partners carefully.",
  27: "The Sceptre — authority, command and reward; a fortunate number of leadership.",
  28: "The Trusting Lamb — loss through misplaced trust and legal entanglements; verify everything.",
  29: "Trial and Deception — testing through the dishonesty of others; patience is the defence.",
  30: "Retrospection — a mental-plane number; material fortune is neither promised nor denied — the mind is the asset.",
  31: "The Hermit — solitude and inward focus; not a material-fortune number.",
  32: "The Fortunate Communication — lucky speech, writing and negotiation; shares the fortunate vibration of 5.",
  37: "The Royal Star of the Bull — fortunate friendships and gains through love and partnership.",
  42: "A fortunate compound — love, money and creative gain, read with 24 and 33.",
  43: "An unfortunate sign in Cheiro's table — upheaval and the breaking of structures.",
  46: "Read with 37 — fortunate friendships and partnership gains.",
  50: "A strong mental vibration — fortunate where intellect and communication lead, read with the 5 family.",
  51: "The Warrior — advancement, direction and command; fortunate for career and enterprise.",
};

const CHEIRO_SOURCE =
  "Cheiro, The Book of Numbers (1926) — summary of his compound-number table";

/** Cheiro reading for a compound number, following his family rule. */
export function cheiroCompound(compound: number): { text: string; source: string } {
  let n = compound;
  while (n > 52) n -= 9;
  // Cheiro's family readings: 33→24, 34→25, 35→26, 36→27, 38→29,
  // 39→30, 40→31, 41→32, 44→26, 45→27, 47→30, 48→31, 49→32, 52→43.
  const FAMILY: Readonly<Record<number, number>> = {
    33: 24, 34: 25, 35: 26, 36: 27, 38: 29, 39: 30, 40: 31, 41: 32,
    44: 26, 45: 27, 47: 30, 48: 31, 49: 32, 52: 43,
  };
  const key = FAMILY[n] ?? n;
  const text = CHEIRO_COMPOUNDS[key];
  if (text) return { text, source: CHEIRO_SOURCE };
  return {
    text: `Compound ${compound} reduces to ${rootOf(compound)} — read it through its root: ${numberKeyword(rootOf(compound))}.`,
    source: CHEIRO_SOURCE,
  };
}

function rootOf(n: number): number {
  let x = n;
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) {
    x = String(x).split("").reduce((a, d) => a + Number(d), 0);
  }
  return x;
}

/* ------------------------------------------------------------------ */
/* The book                                                            */
/* ------------------------------------------------------------------ */

export interface RedBookSection {
  heading: string;
  lines: string[];
}

export interface RedBookChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  /** Chapter 1 is the free preview; the rest sit behind the paywall. */
  free: boolean;
  source: string;
  sections: RedBookSection[];
}

export interface RedBook {
  title: string;
  profileName: string;
  profileKey: string;
  generatedFor: string; // ISO date the cycles/dashas were anchored to
  priceCAD: 19;
  chapters: RedBookChapter[];
}

export const RED_BOOK_PRICE_CAD = 19;

/** Stable entitlement key for a profile (name + DOB). */
export function redBookProfileKey(profile: Pick<Profile, "fullName" | "dob">): string {
  return `${profile.fullName.trim().toLowerCase()}|${profile.dob}`;
}

const ENTITLEMENT_KEY = "astro-numerology:redbook:v1";

export function loadRedBookEntitlements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENTITLEMENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function grantRedBookEntitlement(profileKey: string): void {
  if (typeof window === "undefined") return;
  const current = loadRedBookEntitlements();
  if (!current.includes(profileKey)) {
    window.localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify([...current, profileKey]));
  }
}

export function hasRedBookEntitlement(profileKey: string): boolean {
  return loadRedBookEntitlements().includes(profileKey);
}

/* ------------------------- chapter builders ----------------------- */

function numerologyChapter(
  core: CoreProfile,
  fullName: string,
  dob: string,
  onDate: string,
): RedBookChapter {
  const lpCompound = cheiroCompound(core.lifePathCompound);
  const nameCompound = cheiroCompound(core.chaldeanName.compound);
  const rows: Array<[string, number, string]> = [
    ["Life Path", core.lifePath, "the road itself — the lesson the whole chart is organised around"],
    ["Birthday", core.birthday, "the inborn talent carried into every year"],
    ["Attitude", core.attitude, "the first response — how new situations are met"],
    ["Destiny — Pythagorean", core.destinyPythagorean, "the expression the name calls for"],
    ["Destiny — Chaldean", core.destinyChaldean, "the same name read in Cheiro's table"],
    ["Soul Urge", core.soulUrge, "the vowels' number — what the heart asks for"],
    ["Personality", core.personality, "the consonants' number — the face the world meets first"],
  ];
  // Next 12 personal months, starting from the anchor month.
  const [y, m] = onDate.split("-").map(Number);
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const yy = y + Math.floor((m - 1 + i) / 12);
    const mm = ((m - 1 + i) % 12) + 1;
    const iso = `${yy}-${String(mm).padStart(2, "0")}-01`;
    const value = personalMonth(dob, iso);
    months.push(`${iso.slice(0, 7)} — Personal Month ${value}: ${numberKeyword(value)}`);
  }

  // Derivatives (milestone 7), each with its derivation in the text.
  const pin = pinnacles(dob);
  const chal = challenges(dob);
  const growth = growthNumber(fullName);
  const rational = rationalThoughtNumber(fullName, dob);
  const maturity = maturityNumber(fullName, dob);
  const balance = balanceNumber(fullName);
  const lpFamily = compoundFamily(reduceNumber(core.lifePath, false));
  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;

  const lpExplain = explainNumber(
    "Life Path",
    core.lifePath,
    `your birth date ${dob} reduces by the component method — month, day and year each reduced first (masters kept), then summed: the components meet at the compound ${core.lifePathCompound}, which reduces to ${displayNumber(core.lifePath)}.`,
  );

  return {
    id: "numbers",
    number: 1,
    title: "The Complete Numbers",
    subtitle: "Numerology in depth — every core number read both ways, the compounds, the derivatives, and your next twelve months",
    free: true,
    source: "Engines: this site's test-locked numerology. Keywords + derivatives: Decoz method (modern published numerology). Compounds: Cheiro (1926).",
    sections: [
      {
        heading: lpExplain.heading,
        lines: lpExplain.lines,
      },
      {
        heading: "The core numbers, read one by one — both ways where a master appears",
        lines: rows.map(([label, v, role]) => {
          const bw = bothWays(v);
          return `${label}: ${bw.display} — ${role}. ${bw.lines.join(" ")}`;
        }),
      },
      {
        heading: `The compound behind the Life Path — ${core.lifePathCompound}`,
        lines: [
          `Your Life Path reduces from the compound ${core.lifePathCompound}. In Chaldean practice the compound is read before the root: ${lpCompound.text}`,
          `Its family: every compound that reduces to ${reduceNumber(core.lifePath, false)} in Cheiro's read range — ${lpFamily.join(", ")} — shares the root's theme with its own flavour. Your ${core.lifePathCompound} is the family member your birth date actually produced; the others are shown so the family resemblance is visible, not hidden.`,
          `Source: ${lpCompound.source}.`,
        ],
      },
      {
        heading: `The compound in your name — ${core.chaldeanName.compound}`,
        lines: [
          `Your full name in the Chaldean table sums to ${core.chaldeanName.compound}, root ${core.chaldeanName.root}. ${nameCompound.text}`,
          `Source: ${nameCompound.source}.`,
        ],
      },
      {
        heading: "Your Pinnacles — the four great chapters of timing",
        lines: [
          ...pin.pinnacles.map(
            (p) =>
              `Pinnacle ${p.index}: ${displayNumber(p.value)} — ages ${p.startAge}–${p.endAge === null ? "end of life" : p.endAge}. Derived: ${p.formula}. Reading: ${bothWays(p.value).lines.join(" ")}`,
          ),
          `The clock itself: your Life Path root is ${pin.lifePathRoot}, so the First Pinnacle runs through age 36 − ${pin.lifePathRoot} = ${pin.firstEndAge}; the Second and Third run nine years each; the Fourth is lifelong. (Decoz timing convention, masters kept in the sums.)`,
        ],
      },
      {
        heading: "Your Challenges — the friction numbers",
        lines: [
          `First Challenge ${chal.first} (early life) — derived: ${chal.formulas.first}. Second Challenge ${chal.second} (the adult years) — derived: ${chal.formulas.second}. Main Challenge ${chal.main} (in force across the life) — derived: ${chal.formulas.main}. Fourth Challenge ${chal.fourth} (the later years) — derived: ${chal.formulas.fourth}.`,
          `The components were reduced all the way down first (month ${chal.components.month}, day ${chal.components.day}, year ${chal.components.year}) — Decoz's rule for Challenges is that master numbers do NOT survive here; the differences are taken from single digits only. A Challenge names a recurring friction to be worked with, in the tradition's framing — a teacher, not a threat.`,
          `Your Main Challenge is ${chal.main} — ${chal.main === 0 ? "the 'choice' challenge in the Decoz tradition: no single theme dominates, all of them are available, and the work is choosing among them." : `read through its number: ${numberKeyword(chal.main)}.`}`,
        ],
      },
      {
        heading: "The derived numbers — Growth, Rational Thought, Maturity, Balance",
        lines: [
          `Growth ${growth}: the letters of your first name ${firstName} alone, in the Pythagorean table, reduced to one digit — the tradition's "key number": the quality whose development unlocks the rest of the chart. Reading: ${numberKeyword(growth)}.`,
          `Rational Thought ${rational}: your first name's letter sum plus your birth day (${dob.slice(8)}), fully reduced — how the mind prefers to decide, in the Decoz reading. Reading: ${numberKeyword(rational)}.`,
          `Maturity ${displayNumber(maturity)}: Life Path ${displayNumber(core.lifePath)} + Destiny ${displayNumber(core.destinyPythagorean)}, ${bothWays(maturity).isMaster ? "kept as a master number" : "reduced"} — the number the tradition says you grow INTO from mid-life onward. ${bothWays(maturity).lines.join(" ")}`,
          `Balance ${balance}: the initials of ${fullName} summed in the Pythagorean table and fully reduced — the resource the tradition says you fall back on under pressure. Reading: ${numberKeyword(balance)}.`,
        ],
      },
      {
        heading: "The next twelve personal months",
        lines: months,
      },
    ],
  };
}

const ELEMENT_RELATION_TEXT: Readonly<Record<string, string>> = {
  same: "the year's element is your own — your natural mode, amplified",
  "year-feeds-you": "the year's element generates yours (feeding cycle) — a resourcing year",
  "you-feed-year": "your element generates the year's — an output year; pace yourself",
  "year-controls-you": "the year's element restrains yours (controlling cycle) — friction to manage, not fear",
  "you-control-year": "your element restrains the year's — your discipline shapes outcomes",
};

function chineseChapter(
  profile: ChineseProfile,
  dob: string,
  birthTime: string | undefined,
  onDate: string,
): RedBookChapter {
  const startYear = Number(onDate.slice(0, 4));
  const years: string[] = [];
  for (let i = 0; i < 5; i++) {
    const o = yearOutlook(profile, startYear + i);
    years.push(
      `${o.year} — ${o.element} ${o.animal}: relation to your ${profile.animal} is ${RELATION_LABELS[o.relation]}; element relation — ${ELEMENT_RELATION_TEXT[o.elementRelation]}. ${o.headline}`,
    );
  }
  const hp = hourPillar(dob, birthTime);
  const hourSection = hp
    ? {
        heading: `Your hour pillar — ${hp.stem}-${hp.branch} (${hp.animal})`,
        lines: [
          `Born at ${birthTime} (double-hour ${hp.window}), your BaZi hour pillar is ${hp.stem}-${hp.branch}: stem element ${hp.stemElement}, branch element ${hp.branchElement}, branch animal ${hp.animal}. It is derived from your day pillar by the Five Rats rule — the day stem sets the Zi-hour stem, then one stem per double-hour.`,
          `Against your year sign ${profile.animal}: the hour branch's ${hp.animal} stands in ${RELATION_LABELS[relationBetween(profile.animal, hp.animal)]} relation. In the traditional reading the hour pillar colours the later years and one's works — the part of the chart that ripens last.`,
          hp.note,
          "Method stated honestly: this is a BaZi-lite derivation (year + day + hour pillars from published calendar formulas). The full Four Pillars reading — month pillar by solar terms, true solar time — is a deeper module and is not claimed here.",
        ],
      }
    : {
        heading: "Your hour pillar — not computed",
        lines: [
          "No birth time is recorded on this profile, so no hour pillar is shown. The hour pillar (BaZi) needs the double-hour of birth; rather than assume a time, this book leaves it out. Add the birth time to the profile and this section computes itself.",
        ],
      };
  return {
    id: "chinese",
    number: 2,
    title: "The Year and Its Allies",
    subtitle: "Chinese astrology in depth — your sign, its alliances, your hour pillar, and the years ahead",
    free: false,
    source: "Traditional Chinese compatibility doctrine (secret friend 六合, clash 六冲, trine 三合; generating/controlling element cycles). Hour pillar: sexagenary day cycle (Y.T. Liu's JDN formula) + Five Rats rule — classical BaZi method.",
    sections: [
      {
        heading: "Your sign",
        lines: [
          `${profile.element} ${profile.animal} (${profile.polarity}), zodiac year ${profile.zodiacYear}, opened on Lunar New Year ${profile.cnyDate}. Your birth date ${dob} resolves to zodiac year ${profile.zodiacYear} against that boundary — the derivation every page of this site uses.`,
          `Secret friend: ${profile.secretFriend} — the ally sign; tradition says help from this quarter arrives quietly.`,
          `Clash: ${profile.clash} — the opposite sign; friction years ask for patience, not retreat.`,
          `Trine allies: ${profile.trine.join(", ")} — the signs that share your rhythm.`,
        ],
      },
      hourSection,
      { heading: "Year by year — the next five", lines: years },
    ],
  };
}

const SIGN_TRAITS: Readonly<Record<string, string>> = {
  Aries: "Fire · cardinal — initiative and directness",
  Taurus: "Earth · fixed — steadiness and material craft",
  Gemini: "Air · mutable — mind, speech and exchange",
  Cancer: "Water · cardinal — protection and memory",
  Leo: "Fire · fixed — expression and presence",
  Virgo: "Earth · mutable — precision and service",
  Libra: "Air · cardinal — balance and partnership",
  Scorpio: "Water · fixed — depth and transformation",
  Sagittarius: "Fire · mutable — philosophy and reach",
  Capricorn: "Earth · cardinal — structure and ascent",
  Aquarius: "Air · fixed — systems and the collective",
  Pisces: "Water · mutable — compassion and dissolution",
};

const ASPECT_TONES: Readonly<Record<string, string>> = {
  Conjunction: "a fusion — the two functions act as one",
  Sextile: "an opportunity — the two functions cooperate when used",
  Square: "a tension — the two functions demand adjustment and work",
  Trine: "a flow — the two functions support each other naturally",
  Opposition: "a polarity — the two functions must be balanced consciously",
};

function westernChapter(chart: WesternChart): RedBookChapter {
  const placements = chart.positions.map(
    (p) =>
      `${p.body} in ${p.sign} (${formatInSign(p.longitude)}), house ${p.house} — ${SIGN_TRAITS[p.sign]}.`,
  );
  const aspects = chart.aspects.map(
    (a) => `${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(2)}°) — ${ASPECT_TONES[a.type]}.`,
  );
  const balance = Object.entries(chart.elementBalance)
    .map(([el, n]) => `${el} ${n}`)
    .join(" · ");
  const qualities = qualityBalance(chart);
  const dominantQuality = (Object.entries(qualities).sort((a, b) => b[1] - a[1])[0] ?? ["Cardinal", 0]) as [string, number];
  const lackingQuality = (Object.entries(qualities).sort((a, b) => a[1] - b[1])[0] ?? ["Mutable", 0]) as [string, number];
  const ruler = chartRuler(chart);
  const tightest = tightestAspect(chart);
  const dominantElement = Object.entries(chart.elementBalance).sort((a, b) => b[1] - a[1])[0] as [string, number];
  const lackingElement = Object.entries(chart.elementBalance).sort((a, b) => a[1] - b[1])[0] as [string, number];
  return {
    id: "western",
    number: 3,
    title: "The Tropical Chart in Depth",
    subtitle: "Western astrology — every placement and major aspect, interpreted, with the chart's own balances read from its distribution",
    free: false,
    source: "Positions: astronomy-engine ephemeris, verified within 0.013°. Aspect tones + rulerships: traditional aspect/rulership doctrine — summary.",
    sections: [
      {
        heading: "Angles and element balance — read from this chart's distribution",
        lines: [
          `Ascendant ${formatInSign(chart.ascendant)} · Midheaven ${formatInSign(chart.midheaven)}.`,
          `Element balance across your ten bodies: ${balance}. The count is this chart's own: ${dominantElement[0]} leads with ${dominantElement[1]} of 10 placements — the tradition reads the leading element as the chart's habitual mode, its default weather. ${lackingElement[1] === 0 ? `${lackingElement[0]} has no placements at all — the tradition reads a missing element as the function that must be built consciously rather than assumed.` : `${lackingElement[0]} is lightest with ${lackingElement[1]} — present, but not the chart's reflex.`}`,
          `Quality (mode) balance: Cardinal ${qualities.Cardinal} · Fixed ${qualities.Fixed} · Mutable ${qualities.Mutable}. ${dominantQuality[0]} dominates with ${dominantQuality[1]} of 10 — ${dominantQuality[0] === "Cardinal" ? "a chart that initiates: it starts things and meets the world head-on." : dominantQuality[0] === "Fixed" ? "a chart that consolidates: it holds, deepens and finishes what it starts." : "a chart that adapts: it adjusts, translates and keeps moving."} ${lackingQuality[0]} is the least-used mode (${lackingQuality[1]} of 10).`,
        ],
      },
      {
        heading: `Your chart ruler — ${ruler.ruler} in ${ruler.position.sign}, house ${ruler.position.house}`,
        lines: [
          ruler.note,
          `${ruler.ruler} stands at ${formatInSign(ruler.position.longitude)} (longitude ${ruler.position.longitude.toFixed(2)}°). ${ruler.modernCoRuler ? `The modern school adds ${ruler.modernCoRuler} as co-ruler of ${chart.ascendantSign}; in this chart ${ruler.modernCoRuler} is in ${chart.positions.find((p) => p.body === ruler.modernCoRuler)?.sign} — both are shown; the classical reading above follows the traditional ruler.` : "No modern co-ruler is assigned to this Ascendant in the standard tables."}`,
        ],
      },
      { heading: "Every placement", lines: placements },
      {
        heading: `Major aspects (${chart.aspects.length})`,
        lines: aspects.length ? aspects : ["No major aspects fall within orb in this chart."],
      },
      {
        heading: "The tightest aspect — the chart's loudest conversation",
        lines: tightest
          ? [
              `${tightest.a} ${tightest.type} ${tightest.b}, orb just ${tightest.orb.toFixed(2)}° (actual separation ${tightest.separation.toFixed(2)}°). Of your ${chart.aspects.length} major aspects this is the closest to exact, so the tradition gives it the loudest voice: ${ASPECT_TONES[tightest.type]}. ${tightest.a} stands in ${chart.positions.find((p) => p.body === tightest.a)?.sign}, ${tightest.b} in ${chart.positions.find((p) => p.body === tightest.b)?.sign} — the conversation runs between those two houses of your life: house ${chart.positions.find((p) => p.body === tightest.a)?.house} and house ${chart.positions.find((p) => p.body === tightest.b)?.house}.`,
            ]
          : ["This chart has no major aspect within orb, so there is no single loudest conversation — the placements speak individually rather than in pairs."],
      },
    ],
  };
}

function vedicChapter(chart: VedicChart, onDate: string): RedBookChapter {
  const nak = chart.moonNakshatra;
  const current = dashaAt(chart.dashas, new Date(`${onDate}T12:00:00`));
  const subs = current ? antardashas(current) : [];
  const currentSub = current ? antardashaAt(current, new Date(`${onDate}T12:00:00`)) : null;
  const pada = padaReading(chart);
  const chain = nakshatraLordChain(chart);
  return {
    id: "vedic",
    number: 4,
    title: "Nakshatra and the Dasha Timeline",
    subtitle: "Vedic astrology in depth — your Moon's star, its pada and lord-chain, and the full Vimshottari sequence",
    free: false,
    source: "Brihat Parashara Hora Shastra — classical. Ayanamsa: Lahiri. Sub-periods by the standard Parashari proportion.",
    sections: [
      {
        heading: "Your nakshatra profile",
        lines: [
          `The Moon stands in ${nak.name}, pada ${nak.pada} — ruled by ${nak.lord}.`,
          `The Moon had traversed ${Math.round(nak.traversed * 100)}% of the nakshatra at birth, which sets the balance of the first Mahadasha.`,
          `Lagna (sidereal): ${formatInSign(chart.lagna.sidereal)}. Ayanamsa applied: ${chart.ayanamsa.toFixed(4)}°.`,
        ],
      },
      {
        heading: pada.heading,
        lines: pada.lines,
      },
      {
        heading: "The Moon's nakshatra-lord chain",
        lines: chain,
      },
      {
        heading: current
          ? `Where you stand now — ${current.lord} Mahadasha${currentSub ? `, ${currentSub.lord} Antardasha` : ""}`
          : "Where you stand now",
        lines: current
          ? [
              `As of ${onDate} you are in the ${current.lord} Mahadasha (${current.startISO.slice(0, 10)} → ${current.endISO.slice(0, 10)})${currentSub ? `, inside it the ${currentSub.lord} Antardasha (${currentSub.startISO.slice(0, 10)} → ${currentSub.endISO.slice(0, 10)})` : ""}. The full sub-period table follows in the next section.`,
            ]
          : ["No Mahadasha covers the anchor date."],
      },
      {
        heading: "The full Vimshottari timeline",
        lines: chart.dashas.map(
          (d) =>
            `${d.lord} Mahadasha — ${d.startISO.slice(0, 10)} → ${d.endISO.slice(0, 10)}${d.isBalance ? " (balance period, running at birth)" : ""}`,
        ),
      },
      {
        heading: current
          ? `Inside the current Mahadasha — ${current.lord} (sub-periods)`
          : "Sub-periods",
        lines: current
          ? [
              ...subs.map(
                (s) =>
                  `${current.lord} / ${s.lord} — ${s.startISO.slice(0, 10)} → ${s.endISO.slice(0, 10)}${currentSub && s.lord === currentSub.lord && s.startISO === currentSub.startISO ? " ← you are here" : ""}`,
              ),
              "Sub-periods divide the Mahadasha by the standard Parashari proportion (each lord's Vimshottari years ÷ 120 of the whole).",
            ]
          : ["No Mahadasha covers the anchor date."],
      },
    ],
  };
}

function karmaChapter(
  core: CoreProfile,
  vedic: VedicChart,
  western: WesternChart,
): RedBookChapter {
  const karmicDebt = [13, 14, 16, 19];
  const debtHits: string[] = [];
  if (karmicDebt.includes(core.lifePathCompound))
    debtHits.push(`Life Path compound ${core.lifePathCompound}`);
  if (karmicDebt.includes(core.chaldeanName.compound))
    debtHits.push(`Chaldean name compound ${core.chaldeanName.compound}`);
  const saturn = vedic.grahas.find((g) => g.body === "Saturn");
  const moon = western.positions.find((p) => p.body === "Moon");
  return {
    id: "karma",
    number: 5,
    title: "Karma and Life Themes",
    subtitle: "A synthesis of the traditional indicators — read as themes, never as verdicts",
    free: false,
    source: "Modern synthesis of traditional indicators (Decoz karmic-debt compounds; Parashari Saturn and nakshatra doctrine) — labelled MODERN synthesis.",
    sections: [
      {
        heading: "The karmic-debt compounds",
        lines: debtHits.length
          ? [
              `Your chart carries ${debtHits.join(" and ")} — among the four compounds (13, 14, 16, 19) the modern tradition reads as karmic-debt numbers: lessons a life is structured to work through, not punishments.`,
              "The tradition's framing is constructive: the debt number names the theme; the root number names the way through it.",
            ]
          : [
              "None of your key compounds (Life Path, Chaldean name) falls in the modern tradition's karmic-debt set (13, 14, 16, 19). In that reading, this life's themes are chosen rather than owed.",
            ],
      },
      {
        heading: "Saturn — the taskmaster's placement",
        lines: saturn
          ? [
              `Shani (Saturn) stands in ${saturn.sign} (sidereal), house-sign of discipline in the Parashari reading: the area of life where results come slowly and stay permanently.`,
              "Classical framing: Saturn delays, it does not deny — what it builds, it builds to last.",
            ]
          : ["Saturn's placement was not available in this chart."],
      },
      {
        heading: "The Moon — the inherited mind",
        lines: moon
          ? [
              `Tropical Moon in ${moon.sign}; sidereal Moon in ${vedic.moonNakshatra.name} nakshatra. Both traditions read the Moon as the inherited pattern — habit, memory and the mother's line — the closest either system comes to a 'past-life' indicator, and both present it as tendency, not biography.`,
              "This book reports indicators only. It does not invent past-life stories — no classical text licenses that, and we will not sell it.",
            ]
          : ["The Moon's placement was not available in this chart."],
      },
    ],
  };
}

export interface ConvergenceCheck {
  title: string;
  /** true = the systems converge; false = computed and absent (stated honestly); null = not comparable. */
  agree: boolean | null;
  text: string;
  source: string;
}

/**
 * Cross-system convergence checks (milestone 7) — each one COMPUTED
 * from this profile's own values, quoted with its figures, and allowed
 * to come back negative. A synthesis that can only agree is marketing;
 * this one reports what the arithmetic actually finds.
 */
export function convergenceChecks(
  core: CoreProfile,
  chinese: ChineseProfile,
  western: WesternChart,
  vedic: VedicChart,
  onDate: string,
): ConvergenceCheck[] {
  const checks: ConvergenceCheck[] = [];

  // Check 1 — Life Path root vs the Moon's nakshatra lord's graha number.
  const lpRoot = reduceNumber(core.lifePath, false);
  const nakLord = vedic.moonNakshatra.lord;
  const nakLordNumber = GRAHA_NUMBERS[nakLord];
  checks.push({
    title: "Life Path root vs Moon's nakshatra lord",
    agree: lpRoot === nakLordNumber,
    text:
      lpRoot === nakLordNumber
        ? `CONVERGENCE — your Life Path ${displayNumber(core.lifePath)} roots to ${lpRoot}, and your Moon's nakshatra ${vedic.moonNakshatra.name} is ruled by ${nakLord}, whose number in the graha–number correspondence is also ${nakLordNumber}. Two independent systems — the birth-date arithmetic and the Moon's star — land on the same root number, ${lpRoot}: ${numberKeyword(lpRoot)}.`
        : `NO CONVERGENCE — computed and reported plainly: your Life Path ${displayNumber(core.lifePath)} roots to ${lpRoot}, while your Moon's nakshatra ${vedic.moonNakshatra.name} is ruled by ${nakLord} (graha number ${nakLordNumber}). The numbers differ, so no shared theme is claimed here; each is read in its own chapter.`,
    source: "Graha–number correspondence of modern Indian numerology (Mulank tradition) — MODERN; nakshatra lordship per BPHS — classical.",
  });

  // Check 2 — Western dominant element vs the Chinese birth element.
  const dominantElement = Object.entries(western.elementBalance).sort(
    (a, b) => b[1] - a[1],
  )[0] as [string, number];
  const SHARED = ["Fire", "Earth", "Water"];
  if (!SHARED.includes(chinese.element)) {
    checks.push({
      title: "Western dominant element vs Chinese birth element",
      agree: null,
      text: `NOT DIRECTLY COMPARABLE — your Chinese birth element is ${chinese.element}, which has no counterpart in the Western four-element scheme (the Western scheme instead has Air, which Wu Xing lacks). Your Western chart leans ${dominantElement[0]} (${dominantElement[1]} of 10 placements). The two systems carve the world differently here, and this book says so rather than forcing a match.`,
      source: "Element schemes as published in each tradition — the mismatch is a fact of the systems, stated honestly.",
    });
  } else {
    const agree = dominantElement[0] === chinese.element;
    checks.push({
      title: "Western dominant element vs Chinese birth element",
      agree,
      text: agree
        ? `CONVERGENCE — your Chinese sign is ${chinese.element} ${chinese.animal}, and your Western chart independently leans ${dominantElement[0]} with ${dominantElement[1]} of 10 placements. The same element leads in both systems — read your year outlooks and your chart through ${chinese.element}.`
        : `NO CONVERGENCE — your Chinese birth element is ${chinese.element} (${chinese.animal}), but your Western chart leans ${dominantElement[0]} (${dominantElement[1]} of 10 placements; ${chinese.element} holds ${western.elementBalance[chinese.element as keyof typeof western.elementBalance]}). The systems emphasise different elements for you; both readings stand in their chapters, unmerged.`,
      source: "Western element balance from this chart's computed distribution; Chinese stem element from the sexagenary year — both computed above.",
    });
  }

  // Check 3 — current Mahadasha lord's number vs the Personal Year.
  const current = dashaAt(vedic.dashas, new Date(`${onDate}T12:00:00`));
  if (current) {
    const dashaNumber = GRAHA_NUMBERS[current.lord];
    const agree = dashaNumber === core.personalYear;
    checks.push({
      title: "Current Mahadasha lord vs Personal Year",
      agree,
      text: agree
        ? `CONVERGENCE — as of ${onDate} your ${current.lord} Mahadasha is running, and ${current.lord}'s graha number is ${dashaNumber} — the same as your Personal Year ${core.personalYear} (${numberKeyword(core.personalYear)}). The Vedic long clock and the numerology year clock strike the same number this year.`
        : `NO CONVERGENCE — as of ${onDate} your ${current.lord} Mahadasha is running (graha number ${dashaNumber}), while your Personal Year is ${core.personalYear} (${numberKeyword(core.personalYear)}). The two clocks are striking different numbers this year — ${dashaNumber} for the long period, ${core.personalYear} for the year — and both are reported, not blended.`,
      source: "Vimshottari dasha per BPHS — classical; Personal Year per the Decoz cycle method — MODERN; graha numbers per the Mulank correspondence — MODERN.",
    });
  }

  // Check 4 — the two Destiny numbers against each other.
  const destPythRoot = reduceNumber(core.destinyPythagorean, false);
  const agree4 = destPythRoot === core.destinyChaldean;
  checks.push({
    title: "Destiny in both numerology systems",
    agree: agree4,
    text: agree4
      ? `CONVERGENCE — your name's Destiny is ${displayNumber(core.destinyPythagorean)} in the Pythagorean table and ${core.destinyChaldean} in Cheiro's Chaldean table; both root to ${destPythRoot}. Two different letter tables, independently computed from "${core.fullName}", give your name the same root — the tradition treats that as settled character, not passing weather.`
      : `NO CONVERGENCE — your name's Destiny computes to ${displayNumber(core.destinyPythagorean)} (Pythagorean, root ${destPythRoot}) but ${core.destinyChaldean} in Cheiro's Chaldean table. The two tables genuinely disagree about your name; Chapter 1 reads each in its own system rather than averaging them.`,
    source: "Both letter tables as published (Pythagorean modern standard; Cheiro 1926) — computed in Chapter 1.",
  });

  return checks;
}

function synthesisChapter(
  core: CoreProfile,
  chinese: ChineseProfile,
  western: WesternChart,
  vedic: VedicChart,
  onDate: string,
): RedBookChapter {
  const current = dashaAt(vedic.dashas, new Date(`${onDate}T12:00:00`));
  const outlook = yearOutlook(chinese, Number(onDate.slice(0, 4)));
  const checks = convergenceChecks(core, chinese, western, vedic, onDate);
  const agreed = checks.filter((c) => c.agree === true).length;
  return {
    id: "synthesis",
    number: 6,
    title: "Where All Systems Agree",
    subtitle: "The combined summary — explicit convergence checks, computed from your profile, including the ones that come back negative",
    free: false,
    source: "Synthesis of this book's own chapters — every check below is computed from figures derived in Chapters 1–5 and quoted with them.",
    sections: [
      {
        heading: `The convergence checks — ${agreed} of ${checks.length} agree`,
        lines: checks.map((c) => `${c.title}: ${c.text} [Source: ${c.source}]`),
      },
      {
        heading: "The three clocks, read together",
        lines: [
          `Timing, as of ${onDate}: Personal Year ${core.personalYear} (${numberKeyword(core.personalYear)}), ${current ? `${current.lord} Mahadasha in the Vedic sequence` : "Vedic dasha unavailable"}, and a ${outlook.relation} year in the Chinese cycle (${outlook.element} ${outlook.animal}). Three clocks, each derived in its own chapter — this summary reports where they strike together (above) and leaves them separate where they do not.`,
        ],
      },
      {
        heading: "How to use this book",
        lines: [
          "Every figure in this book can be reproduced from your profile on the free pages of this site — the Red Book adds depth and synthesis, never different numbers.",
          "Interpretations are traditional indications from the sources cited in each chapter. They are offered for reflection — not as medical, financial or legal advice, and never as certainty.",
        ],
      },
    ],
  };
}

/**
 * Build the complete Red Book for a profile. Pure and deterministic:
 * identical (profile, chartInput, onDate) → identical book.
 */
function karmaPurposeChapter(
  core: CoreProfile,
  western: WesternChart,
  vedic: VedicChart,
): RedBookChapter {
  const report = karmaReport(core, western, vedic);
  return {
    id: "karma-purpose",
    number: 7,
    title: "Past Life Karma and the True Purpose of This Lifetime",
    subtitle: "The node axis, Saturn, the 12th house and the debt compounds — indicators, computed and explained, never invented stories",
    free: false,
    source: "BPHS node/Saturn doctrine (classical) · Western karmic astrology (modern tradition) · Cheiro (1926) · mean nodes per Meeus.",
    sections: [
      { heading: "The framework — read this first", lines: report.framework },
      ...report.indicators.map((i) => ({ heading: i.title, lines: i.lines })),
      { heading: "The True Purpose of this lifetime — assembled only from the indicators above", lines: report.purpose },
    ],
  };
}

function ishtaChapter(core: CoreProfile, vedic: VedicChart): RedBookChapter {
  const j = jaimini(vedic);
  const resonance = RESONANCE[j.ishtaPlanet] ?? [];
  void core;
  return {
    id: "ishta-devta",
    number: 8,
    title: "Ishta Devta and the Resonating Beings",
    subtitle: "The Jaimini karakas, your soul's sign, the deity form your chart points to — and its archetype parallels across the old civilizations",
    free: false,
    source: "Jaimini/BPHS karaka + Ishta Devta doctrine (classical, 7-karaka scheme) · deity forms per the standard published mapping (TRADITIONAL) · resonance table: COMPARATIVE MYTHOLOGY, modern compilation.",
    sections: [
      { heading: "What Ishta Devta means", lines: ISHTA_EXPLANATION },
      {
        heading: "Your Chara Karakas — the derivation, degree by degree",
        lines: [
          "The seven grahas ranked by degree-in-sign (7-karaka scheme; Rahu excluded, as the scheme states):",
          ...j.karakas.map(
            (k) => `${k.name} (${k.short}) — ${k.body} at ${k.degreeInSign.toFixed(2)}° in its sign: ${k.signifies}.`,
          ),
          `Your Atmakaraka is ${j.atmakaraka.body} — the graha of ${j.atmakaraka.signifies}. Your Amatyakaraka, the supporting guide karaka, is ${j.amatyakaraka.body} — ${j.amatyakaraka.signifies}.`,
        ],
      },
      {
        heading: `Karakamsa ${j.karakamsa} → Ishta Devta: ${j.ishtaDeity} (${j.ishtaPlanet})`,
        lines: [
          `${j.atmakaraka.body} (Atmakaraka) sits in navamsa ${j.karakamsa} — that sign is your Karakamsa, the soul's seat in the D9.`,
          j.ishtaRule,
          `The tradition's deity form for ${j.ishtaPlanet} is ${j.ishtaDeity}. This is reported as the tradition's pointer for spiritual practice — educational, respectful, and with no instruction and no promise attached.`,
          `Your navamsa placements, for the full derivation: ${j.navamsa.map((n) => `${n.body}: ${n.rashiSign} → D9 ${n.navamsaSign}`).join("; ")}. Lagna → D9 ${j.lagnaNavamsa}.`,
        ],
      },
      {
        heading: `Resonating beings — the ${j.ishtaPlanet} principle across old civilizations`,
        lines: [
          RESONANCE_FRAMING,
          ...resonance.map(
            (r) => `${r.civilization}: ${r.being ?? "no direct parallel"} — ${r.note}.`,
          ),
        ],
      },
    ],
  };
}

export function buildRedBook(
  profile: Profile,
  chartInput: ChartInput,
  onDate: string,
): RedBook {
  const core = coreProfile(profile.fullName, profile.dob, onDate);
  const chinese = chineseProfile(profile.dob);
  const western = westernChart(chartInput);
  const vedic = vedicChart(chartInput);
  return {
    title: "The Red Book",
    profileName: profile.fullName,
    profileKey: redBookProfileKey(profile),
    generatedFor: onDate,
    priceCAD: RED_BOOK_PRICE_CAD,
    chapters: [
      numerologyChapter(core, profile.fullName, profile.dob, onDate),
      chineseChapter(chinese, profile.dob, profile.birthTime, onDate),
      westernChapter(western),
      vedicChapter(vedic, onDate),
      karmaChapter(core, vedic, western),
      synthesisChapter(core, chinese, western, vedic, onDate),
      karmaPurposeChapter(core, western, vedic),
      ishtaChapter(core, vedic),
    ],
  };
}
