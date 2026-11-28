/**
 * VOICE NARRATION engine (milestone 13) — a full spoken reading of a
 * profile, built ONLY from the site's existing engines.
 *
 * Every number, placement, period and window spoken here comes from
 * numerology.ts / western.ts / vedic.ts / chinese.ts / panchanga.ts /
 * meanings.ts / chakras.ts (dignity table). Nothing is invented, and
 * nothing is copied from the paid Red Book chapters — the convergence
 * checks in the closing section are recomputed here from the same
 * underlying figures, in narration's own words.
 *
 * The script is written for the ear: short sentences, no markdown, no
 * symbols that read badly aloud, master numbers spoken both ways
 * ("11, with its root 2"). Interpretations are the traditional /
 * modern readings those engines already publish, labelled as such.
 * No past-life stories are invented, no fear language is used, and
 * nothing here is medical or financial advice.
 */

import {
  challenges,
  coreProfile,
  displayNumber,
  isMasterNumber,
  lifePath,
  masterRoot,
  parseISODate,
  personalDay,
  personalMonth,
  personalYear,
  pinnacles,
  reduceNumber,
  type CoreProfile,
} from "./numerology.ts";
import { bothWays, numberMeaning } from "./meanings.ts";
import { chineseProfile, yearOutlook, type ChineseProfile } from "./chinese.ts";
import {
  chartRuler,
  formatInSign,
  tightestAspect,
  westernChart,
  type ChartInput,
  type WesternChart,
} from "./western.ts";
import {
  antardashaAt,
  dashaAt,
  GRAHA_NUMBERS,
  vedicChart,
  type VedicChart,
} from "./vedic.ts";
import { dignityOf } from "./chakras.ts";
import {
  formatLocalTime,
  panchangaDay,
  type PanchangaLocation,
} from "./panchanga.ts";
import { PLACE_PRESETS, DEFAULT_LOCATION } from "./geo.ts";
import { formatLongDate, type Profile } from "./profile.ts";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface NarrationSection {
  id: "opening" | "details" | "challenges" | "fruitful" | "closing";
  title: string;
  /** Natural speech — safe to hand to speechSynthesis as-is. */
  spokenText: string;
  /** The same content for reading on screen (may show symbols/formulas). */
  displayText: string;
}

export interface Narration {
  profileName: string;
  generatedFor: string;
  sections: NarrationSection[];
  /** All sections joined, titles included — the downloadable script. */
  fullText: string;
  wordCount: number;
  /** Rough listening time at ~150 spoken words per minute. */
  estimatedMinutes: number;
}

export interface NarrationOptions {
  /** The exact chart input the report page is using. When omitted, a
   *  deterministic input is derived from the profile (birth time or
   *  noon; birth-place preset when the place text matches one). */
  chartInput?: ChartInput;
  /** Panchanga windows are spoken ONLY when a real location is passed
   *  here — never guessed. Null/omitted = that part is honestly left out. */
  panchangaLocation?: PanchangaLocation | null;
}

/* ------------------------------------------------------------------ */
/* Speech helpers                                                      */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "09:50" → "9:50 AM" — a clock time phrased for listening. */
export function spokenTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const hh = Number(m[1]);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return m[2] === "00" ? `${h12} ${suffix}` : `${h12}:${m[2]} ${suffix}`;
}

/** "2003-01-07" → "January 7, 2003" — a date phrased for listening. */
export function spokenDate(iso: string): string {
  const { year, month, day } = parseISODate(iso.slice(0, 10));
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** Strip symbols that read badly aloud from an existing reading line. */
function speakable(text: string): string {
  return text
    .replace(/—/g, ", ")
    .replace(/–/g, " to ")
    .replace(/°/g, " degrees")
    .replace(/[′']/g, "")
    .replace(/·/g, ", ")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A number phrased both ways when it is a master number: "11, with its root 2". */
function spokenNumber(n: number): string {
  if (isMasterNumber(n)) return `${n}, with its root ${masterRoot(n)}`;
  return String(n);
}

/** The keyword theme of a number, phrased for speech ("" when none exists, e.g. Challenge 0 is handled by its caller). */
function spokenTheme(n: number): string {
  const m = numberMeaning(n);
  return m.text ? speakable(m.text) : "";
}

function ageOn(dobISO: string, onDateISO: string): number {
  const dob = parseISODate(dobISO);
  const on = parseISODate(onDateISO);
  let age = on.year - dob.year;
  if (on.month < dob.month || (on.month === dob.month && on.day < dob.day)) age--;
  return age;
}

/* ------------------------------------------------------------------ */
/* Default chart input (only used when the caller passes none)         */
/* ------------------------------------------------------------------ */

function defaultChartInput(profile: Profile): ChartInput {
  const place = (profile.birthPlace ?? "").toLowerCase();
  const preset =
    PLACE_PRESETS.find((p) => place.includes(p.label.split(",")[0].toLowerCase())) ?? null;
  const loc = preset ?? DEFAULT_LOCATION;
  const time = profile.birthTime || "12:00";
  const [y, m, d] = profile.dob.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - loc.utcOffsetHours * 3600_000;
  return { utc: new Date(utcMs), latitude: loc.latitude, longitudeEast: loc.longitudeEast };
}

/* ------------------------------------------------------------------ */
/* Section builders                                                    */
/* ------------------------------------------------------------------ */

function openingSection(
  profile: Profile,
  core: CoreProfile,
  chinese: ChineseProfile,
): NarrationSection {
  const lp = lifePath(profile.dob);
  const firstName = profile.fullName.trim().split(/\s+/)[0];
  const spoken = [
    `Welcome, ${firstName}. This is your full voice reading from AstroNumerology, computed from the birth profile you saved. Every figure you are about to hear comes from the same engines that power the free pages of this site, and every interpretation is a traditional reading, labelled as such.`,
    `Your details first. You were born on ${spokenDate(profile.dob)}${profile.birthPlace ? `, in ${profile.birthPlace}` : ""}${profile.birthTime ? `, at ${spokenTime(profile.birthTime)}` : ""}. In the Chinese cycle you are a ${chinese.element} ${chinese.animal}, from the zodiac year ${chinese.zodiacYear}.`,
    `Now your core numbers. Your Life Path is ${spokenNumber(core.lifePath)}. It is derived by the component method: your birth month reduces to ${lp.monthComponent}, your birth day to ${lp.dayComponent}, and your birth year to ${lp.yearComponent}, and those three add to ${lp.compound}, which reduces to ${core.lifePath}. In the modern numerology reading, ${spokenTheme(core.lifePath)}.`,
    `Your Birthday number is ${spokenNumber(core.birthday)}: it comes straight from your day of birth, day ${parseISODate(profile.dob).day}, reduced only where the method requires it, with the master numbers 11 and 22 kept. Your Attitude number is ${spokenNumber(core.attitude)}, from your birth month and day added together.`,
    `Your Destiny, or Expression, number is ${spokenNumber(core.destinyPythagorean)} in the Pythagorean table, and ${core.destinyChaldean} in the Chaldean table, where your full name gives a compound of ${core.chaldeanName.compound}. Your Soul Urge, from the vowels of your name, is ${spokenNumber(core.soulUrge)}. Your Personality, from the consonants, is ${spokenNumber(core.personality)}.`,
    `Taken together, the tradition reads these as the outline of a life: the Life Path is the road, the Destiny is the work, and the Soul Urge is the quiet reason underneath both. The next section fills in the detail, chart by chart.`,
  ].join(" ");

  const display = [
    `${profile.fullName} — born ${formatLongDate(profile.dob)}${profile.birthTime ? ` at ${profile.birthTime}` : ""}${profile.birthPlace ? ` · ${profile.birthPlace}` : ""}.`,
    `Life Path ${displayNumber(core.lifePath)} (components ${lp.monthComponent} + ${lp.dayComponent} + ${lp.yearComponent} = ${lp.compound}) · Birthday ${displayNumber(core.birthday)} · Attitude ${displayNumber(core.attitude)}`,
    `Destiny ${displayNumber(core.destinyPythagorean)} (Pythagorean) / ${core.destinyChaldean} (Chaldean, compound ${core.chaldeanName.compound}) · Soul Urge ${displayNumber(core.soulUrge)} · Personality ${displayNumber(core.personality)}`,
    `Chinese: ${chinese.element} ${chinese.animal} (zodiac year ${chinese.zodiacYear}).`,
    ...bothWays(core.lifePath).lines,
  ].join("\n");

  return { id: "opening", title: "Opening and your details", spokenText: spoken, displayText: display };
}

function detailsSection(
  western: WesternChart,
  vedic: VedicChart,
  chinese: ChineseProfile,
  onDateISO: string,
): NarrationSection {
  const sun = western.positions.find((p) => p.body === "Sun")!;
  const moon = western.positions.find((p) => p.body === "Moon")!;
  const ruler = chartRuler(western);
  const tight = tightestAspect(western);
  const dominantElement = (Object.entries(western.elementBalance) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])[0];
  const currentDasha = dashaAt(vedic.dashas, new Date(`${onDateISO}T12:00:00`));
  const nak = vedic.moonNakshatra;

  const spoken = [
    `Details in depth, starting with your Western chart, the tropical chart. Your Sun is in ${sun.sign}, in house ${sun.house}. Your Moon is in ${moon.sign}, in house ${moon.house}. Your Rising sign, the Ascendant, is ${western.ascendantSign}, and your Midheaven is in ${western.midheavenSign}.`,
    `The ruler of your Ascendant is ${ruler.ruler}, and in your chart ${ruler.ruler} stands in ${ruler.position.sign}, in house ${ruler.position.house}. The tradition reads the whole chart's direction from that placement.`,
    tight
      ? `Your tightest major aspect is ${tight.a} ${tight.type.toLowerCase()} ${tight.b}, within ${Math.round(tight.orb * 10) / 10} degrees of exact. Across all ten placements, your chart leans ${dominantElement[0]}, with ${dominantElement[1]} of the ten bodies in ${dominantElement[0]} signs.`
      : `No major aspect falls within the standard orbs in your chart, and across all ten placements your chart leans ${dominantElement[0]}, with ${dominantElement[1]} of the ten bodies in ${dominantElement[0]} signs.`,
    `Now your Vedic chart, the sidereal chart in the Lahiri system. Your Lagna, the Vedic ascendant, is ${vedic.lagna.sign}. Your Moon stands in the nakshatra ${nak.name}, pada ${nak.pada} of 4. ${nak.name} is ruled by ${nak.lord}, and that lordship sets the order of your Vimshottari dasha, the great timing sequence of the Vedic tradition.`,
    currentDasha
      ? `As of ${spokenDate(onDateISO)}, you are in your ${currentDasha.lord} Mahadasha, the ${currentDasha.lord} major period, which runs from ${spokenDate(currentDasha.startISO)} to ${spokenDate(currentDasha.endISO)}. The dasha section later in this reading looks at what that means for your timing.`
      : `The Vimshottari timeline computed from your Moon covers the periods listed on the Vedic page of this site.`,
    `Finally, your Chinese sign in detail. You are a ${chinese.polarity} ${chinese.element} ${chinese.animal}. Your secret friend, your closest quiet ally in the tradition, is the ${chinese.secretFriend}. Your clash sign, the opposite point of the wheel, is the ${chinese.clash}. Your trine, the three signs that share your rhythm, is ${chinese.trine.join(", ")}.`,
  ].join(" ");

  const display = [
    `Western (tropical): Sun ${formatInSign(sun.longitude)}, house ${sun.house} · Moon ${formatInSign(moon.longitude)}, house ${moon.house} · Ascendant ${formatInSign(western.ascendant)} · Midheaven ${formatInSign(western.midheaven)}`,
    `Chart ruler ${ruler.ruler} in ${ruler.position.sign}, house ${ruler.position.house}${tight ? ` · Tightest aspect: ${tight.a} ${tight.type} ${tight.b} (orb ${tight.orb.toFixed(2)}°)` : ""} · Element balance: ${Object.entries(western.elementBalance).map(([k, v]) => `${k} ${v}`).join(" · ")}`,
    `Vedic (sidereal, Lahiri ${vedic.ayanamsa.toFixed(2)}°): Lagna ${vedic.lagna.sign} · Moon in ${nak.name}, pada ${nak.pada} (lord ${nak.lord})${currentDasha ? ` · Current Mahadasha: ${currentDasha.lord} (${currentDasha.startISO.slice(0, 10)} to ${currentDasha.endISO.slice(0, 10)})` : ""}`,
    `Chinese: ${chinese.polarity} ${chinese.element} ${chinese.animal} · Secret friend ${chinese.secretFriend} · Clash ${chinese.clash} · Trine ${chinese.trine.join(", ")}`,
  ].join("\n");

  return { id: "details", title: "Details in depth", spokenText: spoken, displayText: display };
}

function challengesSection(
  profile: Profile,
  western: WesternChart,
): NarrationSection {
  const chal = challenges(profile.dob);
  const c = chal.components;
  const classical = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const challenged = western.positions
    .filter((p) => classical.includes(p.body))
    .map((p) => ({ body: p.body, sign: p.sign, dignity: dignityOf(p.body, p.sign) }))
    .filter((p) => p.dignity === "detriment" || p.dignity === "fall");

  const mainReading =
    chal.main === 0
      ? "Yours is 0, which the Decoz tradition calls the choice challenge: no single theme dominates, all of them are available, and the work is choosing among them."
      : `Read through its number, your Main Challenge carries the theme: ${spokenTheme(chal.main)}.`;

  const spoken = [
    `Now the challenges. In numerology, a Challenge number names a recurring friction to work with. The tradition is clear that a challenge is a teacher, not a threat, and this reading follows that: nothing in this section is a warning, and none of it is about health or money.`,
    `Here is how yours are derived, with your own figures. For Challenges, every component is reduced all the way to a single digit, and master numbers do not survive. Your birth month reduces to ${c.month}, your birth day to ${c.day}, and your birth year to ${c.year}.`,
    `Your First Challenge, the challenge of early life, is the difference between month and day: that gives ${chal.first}. Your Second Challenge, the challenge of the adult years, is the difference between day and year: that gives ${chal.second}. Your Main Challenge, in force across most of the life, is the difference between the first and second challenges: that gives ${chal.main}. Your Fourth Challenge, the challenge of the later years, is the difference between month and year: that gives ${chal.fourth}.`,
    `So the number to know is your Main Challenge, ${chal.main}. ${mainReading} The tradition's advice with a challenge is simple: it softens exactly where you practise its opposite, patience where there is friction, and honesty where there is avoidance.`,
    challenged.length > 0
      ? `One more computed indicator, from your Western chart. In the classical dignity tables, ${challenged.map((p) => `${p.body} in ${p.sign} is in ${p.dignity}`).join(", and ")}. The tradition reads a planet in detriment or fall as working under a handicap in that area of life, an indicator only, inside that framework, and many charts carry one. Yours is listed on screen so you can check the maths yourself.`
      : `One more computed check, from your Western chart. In the classical dignity tables, none of your seven classical planets sits in detriment or fall. That is a fact of this chart's placements, stated plainly, not a promise that life has no friction. Your friction numbers are the Challenges above.`,
  ].join(" ");

  const display = [
    `Challenge components (fully reduced): month ${c.month} · day ${c.day} · year ${c.year}`,
    `First Challenge ${chal.first} — derived: ${chal.formulas.first}`,
    `Second Challenge ${chal.second} — derived: ${chal.formulas.second}`,
    `Main Challenge ${chal.main} — derived: ${chal.formulas.main}`,
    `Fourth Challenge ${chal.fourth} — derived: ${chal.formulas.fourth}`,
    challenged.length > 0
      ? `Challenged dignity indicators (classical tables): ${challenged.map((p) => `${p.body} in ${p.sign} — ${p.dignity}`).join("; ")}. Indicators inside the traditional framework only.`
      : "Challenged dignity indicators (classical tables): none of the seven classical planets is in detriment or fall in this chart.",
    "A Challenge names a recurring friction to be worked with — a teacher, not a threat (Decoz tradition).",
  ].join("\n");

  return { id: "challenges", title: "Challenges", spokenText: spoken, displayText: display };
}

function fruitfulSection(
  profile: Profile,
  core: CoreProfile,
  chinese: ChineseProfile,
  vedic: VedicChart,
  onDateISO: string,
  panchangaLocation: PanchangaLocation | null | undefined,
): NarrationSection {
  const pin = pinnacles(profile.dob);
  const age = ageOn(profile.dob, onDateISO);
  const active = pin.pinnacles.find(
    (p) => age >= p.startAge && (p.endAge === null || age <= p.endAge),
  ) ?? pin.pinnacles[pin.pinnacles.length - 1];
  const py = personalYear(profile.dob, onDateISO);
  const pm = personalMonth(profile.dob, onDateISO);
  const pd = personalDay(profile.dob, onDateISO);
  const onDate = new Date(`${onDateISO}T12:00:00`);
  const currentDasha = dashaAt(vedic.dashas, onDate);
  const currentAntar = currentDasha ? antardashaAt(currentDasha, onDate) : null;
  const outlookYear = parseISODate(onDateISO).year;
  const outlook = yearOutlook(chinese, outlookYear);

  const spokenParts = [
    `Now the fruitful times, the timing the traditions consider well lit. First, your Pinnacles, the four great chapters of timing in the Decoz method.`,
    ...pin.pinnacles.map(
      (p) =>
        `Pinnacle ${p.index} is ${spokenNumber(p.value)}, covering ages ${p.startAge} to ${p.endAge === null ? "the end of life" : p.endAge}. Its theme, in the tradition, is ${spokenTheme(p.value)}.`,
    ),
    `You are ${age} on ${spokenDate(onDateISO)}, so the Pinnacle active for you right now is Pinnacle ${active.index}, the ${spokenNumber(active.value)} Pinnacle, running from age ${active.startAge} to ${active.endAge === null ? "the end of life" : `age ${active.endAge}`}. The tradition treats the active Pinnacle as the season you are farming: its theme is where effort tends to compound.`,
    `Your personal cycles for ${spokenDate(onDateISO)} are these. Your Personal Year is ${py}. In the tradition, a ${py} Personal Year carries this theme: ${spokenTheme(py)}. Your Personal Month is ${pm}, and your Personal Day is ${pd}. The year sets the weather, the month sets the task, and the day is best spent in the same direction.`,
    currentDasha
      ? `On the Vedic clock, your ${currentDasha.lord} Mahadasha runs from ${spokenDate(currentDasha.startISO)} to ${spokenDate(currentDasha.endISO)}${currentAntar ? `, and inside it, your current Antardasha, the sub period, is ${currentAntar.lord}, running to ${spokenDate(currentAntar.endISO)}` : ""}. Long periods like these are read as background seasons: they colour the years rather than deciding single days.`
      : `On the Vedic clock, the dasha timeline on the Vedic page of this site lists your major periods in full.`,
    `In the Chinese cycle, ${outlookYear} is a ${outlook.element} ${outlook.animal} year. For a ${chinese.animal}, the tradition reads it this way. ${speakable(outlook.headline)} ${speakable(outlook.notes[0] ?? "")}`,
  ];

  const displayParts = [
    ...pin.pinnacles.map(
      (p) =>
        `Pinnacle ${p.index}: ${displayNumber(p.value)} — ages ${p.startAge}–${p.endAge === null ? "end of life" : p.endAge}. Derived: ${p.formula}.${p.index === active.index ? " ACTIVE NOW." : ""}`,
    ),
    `Personal Year ${py} · Personal Month ${pm} · Personal Day ${pd} (for ${onDateISO}, recomputed for that date). Personal Year theme: ${numberMeaning(py).text}.`,
    currentDasha
      ? `Current Mahadasha: ${currentDasha.lord} (${currentDasha.startISO.slice(0, 10)} to ${currentDasha.endISO.slice(0, 10)})${currentAntar ? ` · Antardasha: ${currentAntar.lord} (to ${currentAntar.endISO.slice(0, 10)})` : ""}.`
      : "Current Mahadasha: see the Vedic page timeline.",
    `Chinese outlook ${outlookYear}: ${outlook.element} ${outlook.animal} — ${outlook.headline} ${outlook.notes[0] ?? ""}`,
  ];

  // Panchanga windows — ONLY when a real location was supplied.
  if (panchangaLocation) {
    try {
      const day = panchangaDay(onDateISO, panchangaLocation);
      const ft = (d: Date | null) => (d ? formatLocalTime(d, panchangaLocation) : null);
      const bits: string[] = [];
      const displayBits: string[] = [];
      if (day.abhijit) {
        bits.push(
          `the Shubh Sahit window, the Abhijit Muhurat, runs from ${ft(day.abhijit.start)} to ${ft(day.abhijit.end)}`,
        );
        displayBits.push(`Abhijit (Shubh Sahit): ${ft(day.abhijit.start)} to ${ft(day.abhijit.end)}`);
      }
      if (day.amritKalam) {
        bits.push(
          `the Amrit Kalam, drawn from the Moon's ${day.amritKalam.nakshatra} transit, runs from ${ft(day.amritKalam.start)} to ${ft(day.amritKalam.end)}`,
        );
        displayBits.push(`Amrit Kalam (${day.amritKalam.nakshatra}): ${ft(day.amritKalam.start)} to ${ft(day.amritKalam.end)}`);
      }
      if (bits.length > 0) {
        spokenParts.push(
          `And for today itself, ${spokenDate(onDateISO)}, the Panchanga almanac computed for ${panchangaLocation.label}${panchangaLocation.approximate ? ", the labelled default location, so treat these times as approximate" : ""} gives two well lit windows: ${bits.join("; and ")}. The almanac tradition favours beginnings and important acts inside such windows.`,
        );
        displayParts.push(
          `Panchanga for ${onDateISO} at ${panchangaLocation.label}${panchangaLocation.approximate ? " (labelled default — approximate)" : ""}: ${displayBits.join(" · ")}`,
        );
      }
    } catch {
      // No usable sunrise for this place/date — honestly omit, as specified.
    }
  }

  return {
    id: "fruitful",
    title: "Fruitful times",
    spokenText: spokenParts.join(" "),
    displayText: displayParts.join("\n"),
  };
}

function closingSection(
  profile: Profile,
  core: CoreProfile,
  vedic: VedicChart,
  onDateISO: string,
): NarrationSection {
  const onDate = new Date(`${onDateISO}T12:00:00`);
  const current = dashaAt(vedic.dashas, onDate);
  const lpRoot = reduceNumber(core.lifePath, false);
  const nakLord = vedic.moonNakshatra.lord;
  const nakLordNumber = GRAHA_NUMBERS[nakLord];
  const check1Agree = nakLordNumber === lpRoot;
  const dashaNumber = current ? GRAHA_NUMBERS[current.lord] : null;
  const check2Agree = current !== null && dashaNumber === core.personalYear;
  const destRoot = reduceNumber(core.destinyPythagorean, false);
  const check3Agree = destRoot === core.destinyChaldean;
  const checks = [check1Agree, check2Agree, check3Agree];
  const agreed = checks.filter(Boolean).length;

  const spoken = [
    `To close, here is where the systems agree, computed, not blended. This reading ran three checks, and ${agreed} of the three agree.`,
    check1Agree
      ? `First check, an agreement. Your Life Path ${core.lifePath} roots to ${lpRoot}, and your Moon's nakshatra, ${vedic.moonNakshatra.name}, is ruled by ${nakLord}, whose number in the graha and number correspondence is also ${nakLordNumber}. Two independent systems land on the same root.`
      : `First check, no agreement, reported as it stands. Your Life Path ${core.lifePath} roots to ${lpRoot}, while your Moon's nakshatra, ${vedic.moonNakshatra.name}, is ruled by ${nakLord}, whose number is ${nakLordNumber}. Different numbers, both left standing.`,
    current
      ? check2Agree
        ? `Second check, an agreement. Your current Mahadasha lord is ${current.lord}, whose graha number is ${dashaNumber}, the same as your Personal Year ${core.personalYear}. The Vedic long clock and the numerology year clock strike the same number this year.`
        : `Second check, no agreement. Your current Mahadasha lord is ${current.lord}, whose graha number is ${dashaNumber}, while your Personal Year is ${core.personalYear}. The two clocks strike different numbers this year, and both are reported, not merged.`
      : `Second check could not be run, because no dasha period covers ${spokenDate(onDateISO)} in the computed timeline.`,
    check3Agree
      ? `Third check, an agreement. Your name's Destiny is ${core.destinyPythagorean} in the Pythagorean table and ${core.destinyChaldean} in the Chaldean table, and both root to ${destRoot}. Two different letter tables give your name the same root.`
      : `Third check, no agreement. Your name's Destiny computes to ${core.destinyPythagorean} in the Pythagorean table, root ${destRoot}, but ${core.destinyChaldean} in the Chaldean table. The tables genuinely disagree about your name, and this reading leaves them separate.`,
    `That is your full reading, ${profile.fullName.trim().split(/\s+/)[0]}. A reminder, in plain words: every calculation you heard is exact and reproducible from your profile on this site, and every interpretation is a traditional indication, offered for reflection and entertainment. None of it is medical, financial, or legal advice, and none of it is certainty. What you do with a fruitful season, and what you learn from a challenge, remains entirely yours. Thank you for listening.`,
  ].join(" ");

  const display = [
    `Convergence checks (computed for ${onDateISO}): ${agreed} of 3 agree.`,
    `1. Life Path root ${lpRoot} vs nakshatra lord ${nakLord} (graha number ${nakLordNumber}): ${check1Agree ? "AGREE" : "no agreement"}.`,
    current
      ? `2. Mahadasha lord ${current.lord} (graha number ${dashaNumber}) vs Personal Year ${core.personalYear}: ${check2Agree ? "AGREE" : "no agreement"}.`
      : `2. Mahadasha check not runnable for ${onDateISO}.`,
    `3. Destiny Pythagorean ${displayNumber(core.destinyPythagorean)} (root ${destRoot}) vs Destiny Chaldean ${core.destinyChaldean}: ${check3Agree ? "AGREE" : "no agreement"}.`,
    "Interpretations are traditional indications, for reflection and entertainment — not medical, financial or legal advice.",
  ].join("\n");

  return { id: "closing", title: "Where the systems agree, and closing", spokenText: spoken, displayText: display };
}

/* ------------------------------------------------------------------ */
/* The builder                                                         */
/* ------------------------------------------------------------------ */

/**
 * Build the complete voice narration for a profile as of a date.
 * Pure and deterministic: identical (profile, onDate, options) always
 * produces the identical script.
 */
export function buildNarration(
  profile: Profile,
  onDateISO: string,
  options: NarrationOptions = {},
): Narration {
  const core = coreProfile(profile.fullName, profile.dob, onDateISO);
  const chinese = chineseProfile(profile.dob);
  const chartInput = options.chartInput ?? defaultChartInput(profile);
  const western = westernChart(chartInput);
  const vedic = vedicChart(chartInput);

  const sections: NarrationSection[] = [
    openingSection(profile, core, chinese),
    detailsSection(western, vedic, chinese, onDateISO),
    challengesSection(profile, western),
    fruitfulSection(profile, core, chinese, vedic, onDateISO, options.panchangaLocation),
    closingSection(profile, core, vedic, onDateISO),
  ];

  const fullText = sections.map((s) => `${s.title}\n\n${s.spokenText}`).join("\n\n");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  return {
    profileName: profile.fullName,
    generatedFor: onDateISO,
    sections,
    fullText,
    wordCount,
    estimatedMinutes: Math.round((wordCount / 150) * 10) / 10,
  };
}
