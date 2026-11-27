/**
 * Chat tools + deterministic fallback assistant (milestone 11).
 *
 * THE TRUST ARCHITECTURE: the AI never invents a number. Every figure
 * in every answer comes from these typed tools, which wrap the site's
 * own engines. The Gemini layer (API route) may only speak through
 * these tools; the fallback calculator (no key configured) answers
 * from the same tools with the same formatting.
 *
 * Each tool returns { text, note } — the note names the engine and
 * source, and the UI shows it under the reply ("Calculated with the
 * Vedic engine · BPHS") so the user SEES the answer was computed.
 */

import {
  analyzeName,
  coreProfile,
  displayNumber,
  lifePath,
  personalDay,
  personalMonth,
  personalYear,
} from "./numerology.ts";
import { bothWays } from "./meanings.ts";
import { checkNameHarmony } from "./namecheck.ts";
import { chineseProfile, fiveYearRelations, RELATION_LABELS, yearOutlook } from "./chinese.ts";
import { dashaAt, antardashaAt, vedicChart } from "./vedic.ts";
import { westernChart, formatInSign } from "./western.ts";
import { panchangaDay, formatLocalTime, DEFAULT_PANCHANGA_LOCATION, type PanchangaLocation } from "./panchanga.ts";
import { jaimini } from "./jaimini.ts";
import { karmaReport } from "./karma.ts";
import { buildRedBook, RED_BOOK_PRICE_CAD } from "./redbook.ts";
import type { Profile } from "./profile.ts";
import type { ChartInput } from "./western.ts";

export interface ChatContext {
  profile: Profile | null;
  chartInput: ChartInput | null;
  today: string; // ISO date
  location?: PanchangaLocation;
}

export interface ToolResult {
  text: string;
  note: string;
}

const NUM_NOTE = "Calculated with the numerology engine · Decoz method (MODERN)";
const CHN_NOTE = "Calculated with the Chinese engine · traditional doctrine";
const VEDIC_NOTE = "Calculated with the Vedic engine · BPHS (classical)";
const WEST_NOTE = "Calculated with the Western engine · astronomy-engine ephemeris";
const PANCH_NOTE = "Calculated with the Panchanga engine · sidereal longitudes, Lahiri";

/* ------------------------------ tools ------------------------------ */

export function toolCoreNumbers(profile: Profile, today: string): ToolResult {
  const core = coreProfile(profile.fullName, profile.dob, today);
  const lp = bothWays(core.lifePath);
  return {
    note: NUM_NOTE,
    text:
      `${profile.fullName}'s core numbers (born ${profile.dob}): Life Path ${lp.display} (compound ${core.lifePathCompound}), ` +
      `Birthday ${displayNumber(core.birthday)}, Attitude ${displayNumber(core.attitude)}, ` +
      `Destiny ${displayNumber(core.destinyPythagorean)} (Pythagorean) / ${displayNumber(core.destinyChaldean)} (Chaldean), ` +
      `Soul Urge ${displayNumber(core.soulUrge)}, Personality ${displayNumber(core.personality)}. ` +
      lp.lines.join(" "),
  };
}

export function toolPersonalCycles(dob: string, dateISO: string): ToolResult {
  const py = personalYear(dob, dateISO);
  const pm = personalMonth(dob, dateISO);
  const pd = personalDay(dob, dateISO);
  return {
    note: NUM_NOTE,
    text: `For ${dateISO}: Personal Year ${py}, Personal Month ${pm}, Personal Day ${pd}. Derived from the birth date ${dob} by the component method (month + day + the year's digits, fully reduced — cycles never keep master numbers).`,
  };
}

export function toolLifePathForDate(dob: string): ToolResult {
  const lp = lifePath(dob);
  const bw = bothWays(lp.value);
  return {
    note: NUM_NOTE,
    text: `Life Path for ${dob}: ${bw.display}, from compound ${lp.compound} (month ${lp.monthComponent} + day ${lp.dayComponent} + year ${lp.yearComponent}). ${bw.lines.join(" ")}`,
  };
}

export function toolAnalyzeName(name: string): ToolResult {
  const ch = analyzeName(name, "chaldean");
  const py = analyzeName(name, "pythagorean");
  return {
    note: NUM_NOTE,
    text: `"${name}": Chaldean compound ${ch.compound} → root ${displayNumber(ch.root)}; Pythagorean compound ${py.compound} → root ${displayNumber(py.root)}.`,
  };
}

export function toolCheckName(name: string, profile: Profile): ToolResult {
  const r = checkNameHarmony(name, profile.fullName, profile.dob);
  return {
    note: "Calculated with the name checker · deterministic scoring (30/15/20 per system)",
    text: `Name check for "${name}" against ${profile.fullName} (Life Path ${displayNumber(r.lifePath)}, Destiny ${displayNumber(r.destiny)}): score ${r.score}/100 — verdict ${r.verdict}. ${r.reasons.join(" ")}`,
  };
}

export function toolChinese(dob: string, yearsAhead = 3): ToolResult {
  const cp = chineseProfile(dob);
  const rels = fiveYearRelations(cp, new Date().getFullYear(), yearsAhead)
    .map((r) => `${r.year} ${r.element} ${r.animal}: ${RELATION_LABELS[r.relation]}`)
    .join("; ");
  return {
    note: CHN_NOTE,
    text: `Chinese sign for ${dob}: ${cp.element} ${cp.animal} (${cp.polarity}), zodiac year ${cp.zodiacYear}. Secret friend ${cp.secretFriend}; clash ${cp.clash}; trine ${cp.trine.join(", ")}. Coming years — ${rels}.`,
  };
}

export function toolDasha(ctx: ChatContext, dateISO: string): ToolResult | null {
  if (!ctx.chartInput) return null;
  const chart = vedicChart(ctx.chartInput);
  const at = new Date(`${dateISO}T12:00:00Z`);
  const md = dashaAt(chart.dashas, at);
  if (!md) return { note: VEDIC_NOTE, text: `No Mahadasha covers ${dateISO} in the computed timeline.` };
  const ad = antardashaAt(md, at);
  return {
    note: VEDIC_NOTE,
    text: `On ${dateISO}: ${md.lord} Mahadasha (${md.startISO.slice(0, 10)} → ${md.endISO.slice(0, 10)})${ad ? `, inside it ${ad.lord} Antardasha (${ad.startISO.slice(0, 10)} → ${ad.endISO.slice(0, 10)})` : ""}. Moon's nakshatra: ${chart.moonNakshatra.name}, pada ${chart.moonNakshatra.pada}, lord ${chart.moonNakshatra.lord}.`,
  };
}

export function toolWestern(ctx: ChatContext): ToolResult | null {
  if (!ctx.chartInput) return null;
  const chart = westernChart(ctx.chartInput);
  const top = chart.positions.slice(0, 5).map((p) => `${p.body} in ${p.sign} (house ${p.house})`).join("; ");
  return {
    note: WEST_NOTE,
    text: `Western chart: Ascendant ${formatInSign(chart.ascendant)}, MC ${formatInSign(chart.midheaven)}. Elements — Fire ${chart.elementBalance.Fire}, Earth ${chart.elementBalance.Earth}, Air ${chart.elementBalance.Air}, Water ${chart.elementBalance.Water}. ${top}.`,
  };
}

export function toolPanchanga(ctx: ChatContext, dateISO: string): ToolResult {
  const loc = ctx.location ?? DEFAULT_PANCHANGA_LOCATION;
  const d = panchangaDay(dateISO, loc);
  const ft = (x: Date | null) => (x ? formatLocalTime(x, loc) : "—");
  return {
    note: PANCH_NOTE,
    text:
      `Panchanga for ${dateISO} at ${loc.label}${loc.approximate ? " (default location — approximate)" : ""}: ` +
      `${d.weekday} (lord ${d.weekdayLord}); Tithi ${d.tithi.paksha} ${d.tithi.name} (ends ${ft(d.tithiEndsAt)}); ` +
      `Nakshatra ${d.nakshatra.name} pada ${d.nakshatra.pada}; Yoga ${d.yoga.name}; Karana ${d.karanaFirst.name} / ${d.karanaSecond.name}. ` +
      `Sunrise ${ft(d.sunrise)}, sunset ${ft(d.sunset)}. Shubh Sahit: Abhijit ${d.abhijit ? `${ft(d.abhijit.start)}–${ft(d.abhijit.end)}` : "—"}, ` +
      `Amrit Kalam ${d.amritKalam ? `${ft(d.amritKalam.start)}–${ft(d.amritKalam.end)}` : "none begins this day"}. ` +
      `Rahu Kalam ${d.rahuKalam ? `${ft(d.rahuKalam.start)}–${ft(d.rahuKalam.end)}` : "—"}.`,
  };
}

export function toolIshta(ctx: ChatContext): ToolResult | null {
  if (!ctx.chartInput) return null;
  const j = jaimini(vedicChart(ctx.chartInput));
  return {
    note: "Calculated with the Jaimini engine · BPHS, 7-karaka scheme (TRADITIONAL)",
    text: `Atmakaraka: ${j.atmakaraka.body} (${j.atmakaraka.degreeInSign.toFixed(2)}° in sign). Karakamsa: ${j.karakamsa}. ${j.ishtaRule} Ishta Devta: ${j.ishtaDeity} (planet ${j.ishtaPlanet}). Amatyakaraka (guide): ${j.amatyakaraka.body}.`,
  };
}

export function toolKarma(ctx: ChatContext): ToolResult | null {
  if (!ctx.chartInput || !ctx.profile) return null;
  const core = coreProfile(ctx.profile.fullName, ctx.profile.dob, ctx.today);
  const report = karmaReport(core, westernChart(ctx.chartInput), vedicChart(ctx.chartInput));
  return {
    note: "Calculated with the karma engine · indicators only, never invented stories",
    text: `True Purpose, assembled from computed indicators: ${report.purpose.join(" ")}`,
  };
}

export function toolRedBook(ctx: ChatContext): ToolResult | null {
  if (!ctx.chartInput || !ctx.profile) return null;
  const book = buildRedBook(ctx.profile, ctx.chartInput, ctx.today);
  const free = book.chapters[0];
  const locked = book.chapters.slice(1).map((c) => `Ch. ${c.number} "${c.title}"`).join("; ");
  return {
    note: "From the Red Book engine · free chapter in full, locked chapters summary-only (paywall respected)",
    text:
      `The Red Book (CAD $${RED_BOOK_PRICE_CAD}, one payment) — free Chapter 1 "${free.title}": ` +
      free.sections.map((s) => `${s.heading}: ${s.lines[0] ?? ""}`).join(" | ") +
      `. Locked chapters (summary only): ${locked}.`,
  };
}

/* --------------------- fallback calculator --------------------- */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function extractYear(q: string): number | null {
  const m = q.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function extractISODate(q: string, today: string): string | null {
  const iso = q.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/);
  if (iso) return iso[0];
  const named = q.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+((?:19|20)\d{2}))?/i);
  if (named) {
    const year = named[3] ? Number(named[3]) : Number(today.slice(0, 4));
    const mm = String(MONTHS[named[1].slice(0, 3).toLowerCase()]).padStart(2, "0");
    const dd = String(Number(named[2])).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }
  if (/\btomorrow\b/.test(q)) {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (/\btoday\b/.test(q)) return today;
  return null;
}

function extractDob(q: string): string | null {
  const iso = q.match(/\bborn\s+((?:19|20)\d{2}-\d{2}-\d{2})\b/) ?? q.match(/\b((?:19|20)\d{2}-\d{2}-\d{2})\b/);
  return iso ? iso[1] : null;
}

export interface FallbackAnswer extends ToolResult {
  intent: string;
}

/**
 * The deterministic assistant — used when no Gemini key is configured,
 * and it RESPECTS CREDITS exactly like the AI mode (it is still the
 * chat). Parses the common intents and answers from the engines.
 */
export function calculatorAnswer(question: string, ctx: ChatContext): FallbackAnswer {
  const q = question.toLowerCase();
  const profile = ctx.profile;
  const needProfile = (intent: string): FallbackAnswer => ({
    intent,
    note: "Calculator mode",
    text: "I need an active profile for that. Create your profile first (name + birth date — the place is optional), then ask again. Meanwhile I can compute a life path for any date: ask “life path for 1990-05-15”.",
  });

  if (/\bishta\b/.test(q)) {
    const r = ctx.chartInput ? toolIshta(ctx) : null;
    return r ? { intent: "ishta", ...r } : needProfile("ishta");
  }
  if (/\b(panchanga|panchang|tithi|muhurat|rahu kalam)\b/.test(q)) {
    const date = extractISODate(q, ctx.today) ?? ctx.today;
    return { intent: "panchanga", ...toolPanchanga(ctx, date) };
  }
  if (/\b(dasha|mahadasha|antardasha)\b/.test(q)) {
    const date = extractISODate(q, ctx.today) ?? ctx.today;
    const r = ctx.chartInput ? toolDasha(ctx, date) : null;
    return r ? { intent: "dasha", ...r } : needProfile("dasha");
  }
  if (/\bcheck\b.*\bname\b|\bname check\b|\bcheck the name\b/.test(q)) {
    const nameMatch = question.match(/name\s+(.+?)\s*$/i) ?? question.match(/check\s+(?:the\s+)?(.+?)\s*$/i);
    if (!profile) return needProfile("name-check");
    if (nameMatch) return { intent: "name-check", ...toolCheckName(nameMatch[1].trim(), profile) };
  }
  if (/\b(personal year|personal month|personal day|cycle)\b/.test(q)) {
    if (!profile) return needProfile("cycles");
    const year = extractYear(q);
    const date = extractISODate(q, ctx.today) ?? (year ? `${year}-06-01` : ctx.today);
    return { intent: "cycles", ...toolPersonalCycles(profile.dob, date) };
  }
  if (/\b(chinese|zodiac sign|animal sign)\b/.test(q)) {
    const dob = extractDob(q) ?? profile?.dob;
    if (!dob) return needProfile("chinese");
    return { intent: "chinese", ...toolChinese(dob) };
  }
  if (/\b(karma|purpose|past life)\b/.test(q)) {
    const r = toolKarma(ctx);
    return r ? { intent: "karma", ...r } : needProfile("karma");
  }
  if (/\b(red book|chapter)\b/.test(q)) {
    const r = toolRedBook(ctx);
    return r ? { intent: "redbook", ...r } : needProfile("redbook");
  }
  if (/\b(western|ascendant|rising|chart)\b/.test(q)) {
    const r = toolWestern(ctx);
    return r ? { intent: "western", ...r } : needProfile("western");
  }
  if (/\b(life path|core numbers|my numbers)\b/.test(q)) {
    const dob = extractDob(q);
    if (dob && !/\bmy\b/.test(q)) return { intent: "life-path", ...toolLifePathForDate(dob) };
    if (!profile) return needProfile("core");
    return { intent: "core", ...toolCoreNumbers(profile, ctx.today) };
  }
  if (/\bname\b/.test(q) && /\b(number|value|mean)\b/.test(q)) {
    const m = question.match(/name\s+(.+?)\s*$/i);
    if (m) return { intent: "name-value", ...toolAnalyzeName(m[1].trim()) };
  }
  return {
    intent: "help",
    note: "Calculator mode",
    text:
      "Calculator mode can answer, with full calculations: “What is my life path and how is it derived?”, “my personal year for 2027”, “check the name Aurora Labs”, “what dasha am I in?”, “show today's Panchanga” (or “panchanga for Dec 22”), “what is my Chinese sign?”, “who is my Ishta Devta?”, “what does the Red Book contain?”. Every answer is computed by the site's engines — no number is invented.",
  };
}
