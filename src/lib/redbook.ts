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

import { chineseProfile, yearOutlook, type ChineseProfile } from "./chinese.ts";
import { numberKeyword, numberMeaning } from "./meanings.ts";
import {
  coreProfile,
  personalMonth,
  type CoreProfile,
} from "./numerology.ts";
import type { Profile } from "./profile.ts";
import {
  dashaAt,
  vedicChart,
  DASHA_YEARS,
  type DashaPeriod,
  type VedicChart,
} from "./vedic.ts";
import {
  formatInSign,
  westernChart,
  type ChartInput,
  type WesternChart,
} from "./western.ts";

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
/* Antardasha (sub-periods)                                            */
/* ------------------------------------------------------------------ */

export interface SubPeriod {
  lord: string;
  startISO: string;
  endISO: string;
}

const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

/**
 * Antardashas within one Mahadasha: the nine lords in sequence from
 * the Mahadasha lord, each lasting (its Vimshottari years / 120) of
 * the Mahadasha's actual span — the standard Parashari proportion.
 * Exact for full Mahadashas; for the balance period it divides the
 * remaining span proportionally (stated method, shown in the book).
 */
export function antardashas(maha: DashaPeriod): SubPeriod[] {
  const lords = Object.keys(DASHA_YEARS) as Array<keyof typeof DASHA_YEARS>;
  const startIdx = lords.indexOf(maha.lord);
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

function numerologyChapter(core: CoreProfile, dob: string, onDate: string): RedBookChapter {
  const lpCompound = cheiroCompound(core.lifePathCompound);
  const nameCompound = cheiroCompound(core.chaldeanName.compound);
  const rows: Array<[string, number]> = [
    ["Life Path", core.lifePath],
    ["Birthday", core.birthday],
    ["Attitude", core.attitude],
    ["Destiny — Pythagorean", core.destinyPythagorean],
    ["Destiny — Chaldean", core.destinyChaldean],
    ["Soul Urge", core.soulUrge],
    ["Personality", core.personality],
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
  return {
    id: "numbers",
    number: 1,
    title: "The Complete Numbers",
    subtitle: "Numerology in depth — every core number, the compounds, and your next twelve months",
    free: true,
    source: "Engines: this site's test-locked numerology. Keywords: Decoz method (modern). Compounds: Cheiro (1926).",
    sections: [
      {
        heading: "The core numbers, read one by one",
        lines: rows.map(
          ([label, v]) => `${label}: ${v} — ${numberMeaning(v).text}.`,
        ),
      },
      {
        heading: `The compound behind the Life Path — ${core.lifePathCompound}`,
        lines: [
          `Your Life Path reduces from the compound ${core.lifePathCompound}. In Chaldean practice the compound is read before the root: ${lpCompound.text}`,
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
        heading: "The next twelve personal months",
        lines: months,
      },
    ],
  };
}

function chineseChapter(profile: ChineseProfile, onDate: string): RedBookChapter {
  const startYear = Number(onDate.slice(0, 4));
  const years: string[] = [];
  for (let i = 0; i < 5; i++) {
    const o = yearOutlook(profile, startYear + i);
    years.push(
      `${o.year} — ${o.element} ${o.animal} (${o.relation}): ${o.headline} ${o.notes[0]}`,
    );
  }
  return {
    id: "chinese",
    number: 2,
    title: "The Year and Its Allies",
    subtitle: "Chinese astrology in depth — your sign, its alliances, and the years ahead",
    free: false,
    source: "Traditional Chinese compatibility doctrine (secret friend 六合, clash 六冲, trine 三合; generating/controlling element cycles).",
    sections: [
      {
        heading: "Your sign",
        lines: [
          `${profile.element} ${profile.animal} (${profile.polarity}), zodiac year ${profile.zodiacYear}, opened on Lunar New Year ${profile.cnyDate}.`,
          `Secret friend: ${profile.secretFriend} — the ally sign; tradition says help from this quarter arrives quietly.`,
          `Clash: ${profile.clash} — the opposite sign; friction years ask for patience, not retreat.`,
          `Trine allies: ${profile.trine.join(", ")} — the signs that share your rhythm.`,
        ],
      },
      { heading: "Year by year", lines: years },
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
  return {
    id: "western",
    number: 3,
    title: "The Tropical Chart in Depth",
    subtitle: "Western astrology — every placement and major aspect, interpreted",
    free: false,
    source: "Positions: astronomy-engine ephemeris, verified within 0.013°. Aspect tones: traditional aspect doctrine — summary.",
    sections: [
      {
        heading: "Angles and element balance",
        lines: [
          `Ascendant ${formatInSign(chart.ascendant)} · Midheaven ${formatInSign(chart.midheaven)}.`,
          `Element balance across the chart: ${balance}. The leading element is the chart's habitual mode — read the placements below through it.`,
        ],
      },
      { heading: "Every placement", lines: placements },
      {
        heading: `Major aspects (${chart.aspects.length})`,
        lines: aspects.length ? aspects : ["No major aspects fall within orb in this chart."],
      },
    ],
  };
}

function vedicChapter(chart: VedicChart, onDate: string): RedBookChapter {
  const nak = chart.moonNakshatra;
  const current = dashaAt(chart.dashas, new Date(`${onDate}T12:00:00`));
  const subs = current ? antardashas(current) : [];
  const currentSub = current
    ? subs.find(
        (s) =>
          Date.parse(`${onDate}T12:00:00`) >= Date.parse(s.startISO) &&
          Date.parse(`${onDate}T12:00:00`) < Date.parse(s.endISO),
      )
    : undefined;
  return {
    id: "vedic",
    number: 4,
    title: "Nakshatra and the Dasha Timeline",
    subtitle: "Vedic astrology in depth — your Moon's star, and the full Vimshottari sequence",
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

function synthesisChapter(
  core: CoreProfile,
  chinese: ChineseProfile,
  western: WesternChart,
  vedic: VedicChart,
  onDate: string,
): RedBookChapter {
  const dominantElement = Object.entries(western.elementBalance).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
  const current = dashaAt(vedic.dashas, new Date(`${onDate}T12:00:00`));
  const outlook = yearOutlook(chinese, Number(onDate.slice(0, 4)));
  return {
    id: "synthesis",
    number: 6,
    title: "Where All Systems Agree",
    subtitle: "The combined summary — convergences across the four traditions",
    free: false,
    source: "Synthesis of this book's own chapters — every claim traces to a chapter above.",
    sections: [
      {
        heading: "The convergences",
        lines: [
          `Number theme: Life Path ${core.lifePath} (${numberKeyword(core.lifePath)}) with Destiny ${core.destinyPythagorean} (Pythagorean) / ${core.destinyChaldean} (Chaldean) — where the two numerology systems point the same way, the tradition treats the theme as settled character, not passing weather.`,
          `Element theme: your Chinese sign is ${chinese.element} ${chinese.animal}; your Western chart leans ${dominantElement}. Two independent systems, one elemental emphasis — read your year outlooks through it.`,
          `Timing, as of ${onDate}: Personal Year ${core.personalYear} (${numberKeyword(core.personalYear)}), ${current ? `${current.lord} Mahadasha in the Vedic sequence` : "Vedic dasha unavailable"}, and a ${outlook.relation} year in the Chinese cycle (${outlook.element} ${outlook.animal}). Three clocks, read together in the chapters above.`,
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
      numerologyChapter(core, profile.dob, onDate),
      chineseChapter(chinese, onDate),
      westernChapter(western),
      vedicChapter(vedic, onDate),
      karmaChapter(core, vedic, western),
      synthesisChapter(core, chinese, western, vedic, onDate),
    ],
  };
}
