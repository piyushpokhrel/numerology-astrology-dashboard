/**
 * PANCHANGA engine (milestone 9) — the five limbs of the Hindu
 * almanac day, computed from real sidereal Sun/Moon longitudes
 * (astronomy-engine tropical − Lahiri ayanamsa, the site's Vedic
 * engine), plus the day's timings from real sunrise/sunset.
 *
 * CONVENTIONS, stated honestly on the page:
 *  - The panchanga day runs sunrise → next sunrise. The five limbs
 *    are READ AT SUNRISE (the classical convention); end times are
 *    found by root-finding on the elongation/longitude.
 *  - Tithi = Moon−Sun elongation ÷ 12°. Yoga = (Sun+Moon) ÷ 13°20′.
 *    Karana = half-tithi (elongation ÷ 6°) with the fixed karanas at
 *    the cycle's head and tail.
 *  - Kshaya/Vriddhi: comparing the tithi at this sunrise with the
 *    tithi at the next sunrise — a skipped number = kshaya (lost
 *    tithi), a repeated number = vriddhi (expanded tithi). This is
 *    exactly the almanac definition, computed, not asserted.
 *  - Rahu Kalam / Yamaganda / Gulika Kalam: daylight ÷ 8, weekday
 *    segment table (verified against three published references,
 *    Nov 2026): Rahu {Sun 8, Mon 2, Tue 7, Wed 5, Thu 6, Fri 4,
 *    Sat 3}; Yamaganda {5,4,3,2,1,7,6}; Gulika {7,6,5,4,3,2,1}.
 *  - Abhijit Muhurat: the 8th of 15 daytime muhurtas (centred on
 *    solar noon). Brahma Muhurta: the two muhurtas before sunrise,
 *    shown as sunrise−96m → sunrise−48m.
 *  - Amrit Kalam: a window of 4 ghatis (4/60 of the Moon's transit
 *    through its nakshatra) starting at the nakshatra's Amrita
 *    ghati — the classical table as published in modern panchanga
 *    references (vedicdrishti.in; Ashwini 42, Bharani 48, Krittika
 *    54, Anuradha 34 cross-checked in the published table).
 *  - Hora: daylight and night each divided into 12; the first day
 *    hora is the weekday lord's; the sequence follows the Chaldean
 *    order (Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon).
 */

import { Body, EclipticGeoMoon, Observer, SearchRiseSet, SunPosition } from "astronomy-engine";
import { lahiriAyanamsa, nakshatraOf } from "./vedic.ts";
import { norm360 } from "./western.ts";

export interface PanchangaLocation {
  label: string;
  latitude: number;
  longitudeEast: number;
  /** IANA time zone for civil-date conversion; when absent, utcOffsetMinutes is used. */
  timeZone?: string;
  utcOffsetMinutes?: number;
  /** True when this is the labelled default (Toronto), not a chosen place. */
  approximate?: boolean;
}

export const DEFAULT_PANCHANGA_LOCATION: PanchangaLocation = {
  label: "Toronto, Canada (default)",
  latitude: 43.65,
  longitudeEast: -79.38,
  timeZone: "America/Toronto",
  approximate: true,
};

/** UTC offset (minutes) of a time zone at a given UTC instant, via Intl. */
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(at).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

export function locationOffsetMinutes(loc: PanchangaLocation, at: Date): number {
  return loc.timeZone ? tzOffsetMinutes(loc.timeZone, at) : (loc.utcOffsetMinutes ?? 0);
}

/** The UTC instant of local midnight starting the given civil date at the location. */
export function localMidnightUTC(dateISO: string, loc: PanchangaLocation): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  // First guess with offset 0, then refine once with the real offset.
  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const off1 = locationOffsetMinutes(loc, new Date(guess));
  guess = Date.UTC(y, m - 1, d) - off1 * 60000;
  const off2 = locationOffsetMinutes(loc, new Date(guess));
  if (off2 !== off1) guess = Date.UTC(y, m - 1, d) - off2 * 60000;
  return new Date(guess);
}

/* ------------------------- astronomy core ------------------------- */

export function siderealLongitudes(at: Date): { sun: number; moon: number; ayanamsa: number } {
  const ayanamsa = lahiriAyanamsa(at);
  const sun = norm360(SunPosition(at).elon - ayanamsa);
  const moon = norm360(EclipticGeoMoon(at).lon - ayanamsa);
  return { sun, moon, ayanamsa };
}

const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima",
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Amavasya",
];

export function tithiAt(at: Date): { number: number; name: string; paksha: "Shukla" | "Krishna"; elongation: number } {
  const { sun, moon } = siderealLongitudes(at);
  const elongation = norm360(moon - sun);
  const number = Math.floor(elongation / 12) + 1;
  return {
    number,
    name: TITHI_NAMES[number - 1],
    paksha: number <= 15 ? "Shukla" : "Krishna",
    elongation,
  };
}

const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha",
  "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

export function yogaAt(at: Date): { number: number; name: string; sum: number } {
  const { sun, moon } = siderealLongitudes(at);
  const sum = norm360(sun + moon);
  const number = Math.floor(sum / (360 / 27)) + 1;
  return { number, name: YOGA_NAMES[number - 1], sum };
}

const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];

export function karanaAt(at: Date): { name: string; halfIndex: number } {
  const { sun, moon } = siderealLongitudes(at);
  const elongation = norm360(moon - sun);
  const half = Math.floor(elongation / 6); // 0..59
  if (half === 0) return { name: "Kimstughna", halfIndex: half };
  if (half === 57) return { name: "Shakuni", halfIndex: half };
  if (half === 58) return { name: "Chatushpada", halfIndex: half };
  if (half === 59) return { name: "Naga", halfIndex: half };
  return { name: MOVABLE_KARANAS[(half - 1) % 7], halfIndex: half };
}

/** Find when a monotonically increasing angle crosses the next boundary after `from`. */
function crossingTime(from: Date, angleAt: (d: Date) => number, boundaryStep: number): Date {
  const start = angleAt(from);
  const target = (Math.floor(start / boundaryStep) + 1) * boundaryStep;
  let lo = from.getTime();
  let hi = lo + 36 * 3600_000;
  const angleFromStart = (t: number) => {
    const a = angleAt(new Date(t)) - start;
    return a < -180 ? a + 360 : a;
  };
  const needed = target - start;
  while (hi - lo > 30_000) {
    const mid = (lo + hi) / 2;
    if (angleFromStart(mid) < needed) lo = mid;
    else hi = mid;
  }
  return new Date(hi);
}

/* ------------------------- rise / set ------------------------- */

function riseSet(body: Body, loc: PanchangaLocation, from: Date, direction: 1 | -1): Date | null {
  const obs = new Observer(loc.latitude, loc.longitudeEast, 0);
  const t = SearchRiseSet(body, obs, direction, from, 2);
  return t ? t.date : null;
}

/* ------------------------- the day ------------------------- */

export interface DayWindow { start: Date; end: Date }
export interface HoraEntry extends DayWindow { lord: string; day: boolean }

export interface PanchangaDay {
  dateISO: string;
  location: PanchangaLocation;
  weekday: string;
  weekdayLord: string;
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  tithi: ReturnType<typeof tithiAt>;
  tithiEndsAt: Date;
  /** "kshaya" | "vriddhi" | null — from sunrise-to-sunrise tithi comparison. */
  tithiNote: "kshaya" | "vriddhi" | null;
  nakshatra: ReturnType<typeof nakshatraOf>;
  nakshatraEndsAt: Date;
  yoga: ReturnType<typeof yogaAt>;
  karanaFirst: ReturnType<typeof karanaAt>;
  karanaSecond: ReturnType<typeof karanaAt>;
  longitudes: { sun: number; moon: number; ayanamsa: number };
  abhijit: DayWindow | null;
  brahmaMuhurta: DayWindow | null;
  amritKalam: (DayWindow & { nakshatra: string }) | null;
  rahuKalam: DayWindow | null;
  yamaganda: DayWindow | null;
  gulikaKalam: DayWindow | null;
  horas: HoraEntry[];
  method: string;
}

const WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // index: JS getDay() (0=Sun)
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
// Segment tables (1-based part of 8), index 0 = Sunday. Verified Nov 2026 (three published references).
const RAHU_SEGMENT = [8, 2, 7, 5, 6, 4, 3];
const YAMA_SEGMENT = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_SEGMENT = [7, 6, 5, 4, 3, 2, 1];

/** Amrita-ghati start per nakshatra index (classical table, published in modern panchanga references). */
export const AMRITA_GHATI: ReadonlyArray<number> = [
  42, 48, 54, 46, 48, 42, 48, 44, 54, // Ashwini … Ashlesha
  46, 48, 50, 42, 46, 44, 42, 34, 42, // Magha … Jyeshtha
  46, 48, 50, 44, 42, 46, 48, 50, 48, // Mula … Revati
];

export function panchangaDay(dateISO: string, loc: PanchangaLocation): PanchangaDay {
  const midnight = localMidnightUTC(dateISO, loc);
  const weekdayIdx = new Date(`${dateISO}T12:00:00Z`).getUTCDay();
  const sunrise = riseSet(Body.Sun, loc, midnight, 1);
  const sunset = sunrise ? riseSet(Body.Sun, loc, sunrise, -1) : null;
  const moonrise = riseSet(Body.Moon, loc, midnight, 1);
  const moonset = riseSet(Body.Moon, loc, midnight, -1);
  const anchor = sunrise ?? midnight; // limbs read at sunrise; polar fallback = midnight, stated
  const nextSunrise = sunrise ? riseSet(Body.Sun, loc, new Date(sunrise.getTime() + 12 * 3600_000), 1) : null;

  const tithi = tithiAt(anchor);
  const tithiEndsAt = crossingTime(anchor, (d) => tithiAt(d).elongation, 12);
  let tithiNote: PanchangaDay["tithiNote"] = null;
  if (nextSunrise) {
    const next = tithiAt(nextSunrise).number;
    const expected = tithi.number === 30 ? 1 : tithi.number + 1;
    if (next === tithi.number) tithiNote = "vriddhi";
    else if (next !== expected) tithiNote = "kshaya";
  }

  const longitudes = siderealLongitudes(anchor);
  const nakshatra = nakshatraOf(longitudes.moon);
  const nakshatraEndsAt = crossingTime(anchor, (d) => siderealLongitudes(d).moon, 360 / 27);

  const yoga = yogaAt(anchor);
  const karanaFirst = karanaAt(anchor);
  // The second karana of the tithi begins when the elongation crosses the next 6° line.
  const karanaChange = crossingTime(anchor, (d) => tithiAt(d).elongation, 6);
  const karanaSecond = karanaAt(new Date(karanaChange.getTime() + 60_000));

  let abhijit: DayWindow | null = null;
  let brahmaMuhurta: DayWindow | null = null;
  let rahuKalam: DayWindow | null = null;
  let yamaganda: DayWindow | null = null;
  let gulikaKalam: DayWindow | null = null;
  const horas: HoraEntry[] = [];

  if (sunrise && sunset) {
    const dayMs = sunset.getTime() - sunrise.getTime();
    const muhurta = dayMs / 15;
    abhijit = { start: new Date(sunrise.getTime() + 7 * muhurta), end: new Date(sunrise.getTime() + 8 * muhurta) };
    brahmaMuhurta = { start: new Date(sunrise.getTime() - 96 * 60_000), end: new Date(sunrise.getTime() - 48 * 60_000) };
    const seg = dayMs / 8;
    const pick = (table: number[]) => ({
      start: new Date(sunrise.getTime() + (table[weekdayIdx] - 1) * seg),
      end: new Date(sunrise.getTime() + table[weekdayIdx] * seg),
    });
    rahuKalam = pick(RAHU_SEGMENT);
    yamaganda = pick(YAMA_SEGMENT);
    gulikaKalam = pick(GULIKA_SEGMENT);

    // Horas — day (12 divisions of daylight), then night (12 of the
    // night). Lords step through the Chaldean order cyclically
    // (Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon → Saturn…)
    // starting from the weekday lord.
    const horaLen = dayMs / 12;
    let idx = CHALDEAN_ORDER.indexOf(WEEKDAY_LORDS[weekdayIdx]);
    for (let i = 0; i < 12; i++) {
      horas.push({
        lord: CHALDEAN_ORDER[idx % 7],
        start: new Date(sunrise.getTime() + i * horaLen),
        end: new Date(sunrise.getTime() + (i + 1) * horaLen),
        day: true,
      });
      idx++;
    }
    if (nextSunrise) {
      const nightMs = nextSunrise.getTime() - sunset.getTime();
      const nightLen = nightMs / 12;
      for (let i = 0; i < 12; i++) {
        horas.push({
          lord: CHALDEAN_ORDER[idx % 7],
          start: new Date(sunset.getTime() + i * nightLen),
          end: new Date(sunset.getTime() + (i + 1) * nightLen),
          day: false,
        });
        idx++;
      }
    }
  }

  // Amrit Kalam — from the Moon's nakshatra transit containing sunrise.
  let amritKalam: PanchangaDay["amritKalam"] = null;
  {
    const nakStart = (() => {
      // Bisect backwards for the nakshatra start before the anchor.
      const span = 360 / 27;
      const startBoundary = Math.floor(longitudes.moon / span) * span;
      let lo = anchor.getTime() - 36 * 3600_000;
      let hi = anchor.getTime();
      const moonAt = (t: number) => siderealLongitudes(new Date(t)).moon;
      const wrapped = (t: number) => {
        const a = moonAt(t) - startBoundary;
        return a < -180 ? a + 360 : a;
      };
      while (hi - lo > 30_000) {
        const mid = (lo + hi) / 2;
        if (wrapped(mid) < 0) lo = mid;
        else hi = mid;
      }
      return new Date(hi);
    })();
    const transitMs = nakshatraEndsAt.getTime() - nakStart.getTime();
    const ghati = AMRITA_GHATI[nakshatra.index];
    const start = new Date(nakStart.getTime() + (ghati / 60) * transitMs);
    const end = new Date(start.getTime() + (4 / 60) * transitMs);
    const dayEnd = nextSunrise ?? new Date(anchor.getTime() + 24 * 3600_000);
    if (end > anchor && start < dayEnd) {
      amritKalam = { start, end, nakshatra: nakshatra.name };
    }
  }

  return {
    dateISO,
    location: loc,
    weekday: WEEKDAY_NAMES[weekdayIdx],
    weekdayLord: WEEKDAY_LORDS[weekdayIdx],
    sunrise,
    sunset,
    moonrise,
    moonset,
    tithi,
    tithiEndsAt,
    tithiNote,
    nakshatra,
    nakshatraEndsAt,
    yoga,
    karanaFirst,
    karanaSecond,
    longitudes,
    abhijit,
    brahmaMuhurta,
    amritKalam,
    rahuKalam,
    yamaganda,
    gulikaKalam,
    horas,
    method:
      "Limbs read at local sunrise (classical convention) from sidereal longitudes: astronomy-engine tropical − Lahiri ayanamsa. Tithi = elongation ÷ 12°; Yoga = (Sun + Moon) ÷ 13°20′; Karana = elongation ÷ 6° with fixed karanas at the head (Kimstughna) and tail (Shakuni, Chatushpada, Naga). Rise/set: astronomy-engine SearchRiseSet. Kalam windows: daylight ÷ 8 with the published weekday segment tables. Hora: Chaldean order from the weekday lord.",
  };
}

/** Format an instant as a local clock time at the location. */
export function formatLocalTime(at: Date, loc: PanchangaLocation): string {
  if (loc.timeZone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: loc.timeZone, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(at);
  }
  const shifted = new Date(at.getTime() + (loc.utcOffsetMinutes ?? 0) * 60000);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(shifted);
}
