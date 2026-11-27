/**
 * Milestone 9 — Panchanga golden checks.
 *
 * Published anchors:
 *  - FULL MOON: 2026-01-03, 10:03 UTC (timeanddate). At that instant
 *    the elongation is 180° by definition, so just before it the
 *    tithi is 15 (Purnima, Shukla paksha) and just after it the
 *    tithi is 16 (Krishna Pratipada).
 *  - TORONTO SUNRISE: 2026-06-21 = 5:35 AM EDT (timeanddate), i.e.
 *    09:35 UTC ± a few minutes; sunset 9:02 PM EDT = 01:02 UTC next day.
 *  - SEGMENT TABLES: Rahu/Yama/Gulika weekday parts verified against
 *    three published references (Nov 2026) — asserted structurally:
 *    the three windows never overlap and each is exactly 1/8 of daylight.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  panchangaDay,
  tithiAt,
  DEFAULT_PANCHANGA_LOCATION,
  type PanchangaLocation,
} from "../src/lib/panchanga.ts";
import { coreProfile } from "../src/lib/numerology.ts";

const TORONTO: PanchangaLocation = {
  label: "Toronto, Canada",
  latitude: 43.65,
  longitudeEast: -79.38,
  timeZone: "America/Toronto",
};

test("PANCHANGA golden: tithi at the published full-moon instant (2026-01-03 10:03 UTC)", () => {
  const before = tithiAt(new Date("2026-01-03T09:30:00Z"));
  assert.equal(before.number, 15);
  assert.equal(before.name, "Purnima");
  assert.equal(before.paksha, "Shukla");
  const after = tithiAt(new Date("2026-01-03T12:00:00Z"));
  assert.equal(after.number, 16);
  assert.equal(after.paksha, "Krishna");
});

test("PANCHANGA golden: Toronto sunrise 2026-06-21 ≈ 09:35 UTC (5:35 AM EDT, timeanddate)", () => {
  const day = panchangaDay("2026-06-21", TORONTO);
  assert.ok(day.sunrise);
  const mins = (day.sunrise!.getTime() - Date.UTC(2026, 5, 21)) / 60000;
  assert.ok(Math.abs(mins - (9 * 60 + 35)) <= 4, `sunrise at ${day.sunrise!.toISOString()}`);
  assert.ok(day.sunset);
  const sunsetMins = (day.sunset!.getTime() - Date.UTC(2026, 5, 22)) / 60000;
  assert.ok(Math.abs(sunsetMins - (1 * 60 + 2)) <= 4, `sunset at ${day.sunset!.toISOString()}`);
  assert.equal(day.weekday, "Sunday");
  assert.equal(day.weekdayLord, "Sun");
});

test("PANCHANGA structure: five limbs present, karana pair, 24 horas, kalam windows tile daylight", () => {
  const day = panchangaDay("2026-11-27", TORONTO);
  assert.ok(day.tithi.number >= 1 && day.tithi.number <= 30);
  assert.ok(day.nakshatra.index >= 0 && day.nakshatra.index <= 26);
  assert.ok(day.yoga.number >= 1 && day.yoga.number <= 27);
  assert.ok(day.karanaFirst.name.length > 0 && day.karanaSecond.name.length > 0);
  assert.equal(day.horas.length, 24);
  assert.equal(day.horas[0].lord, "Venus"); // Friday's first hora = Venus
  const dayMs = day.sunset!.getTime() - day.sunrise!.getTime();
  for (const w of [day.rahuKalam, day.yamaganda, day.gulikaKalam]) {
    assert.ok(w);
    assert.ok(Math.abs(w!.end.getTime() - w!.start.getTime() - dayMs / 8) < 60_000);
    assert.ok(w!.start >= day.sunrise! && w!.end <= day.sunset!);
  }
  const windows = [day.rahuKalam!, day.yamaganda!, day.gulikaKalam!].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  assert.ok(windows[0].end <= windows[1].start && windows[1].end <= windows[2].start, "kalam windows never overlap");
  // Friday (2026-11-27): Rahu = part 4, Gulika = part 2, Yama = part 7.
  assert.equal(Math.round((day.gulikaKalam!.start.getTime() - day.sunrise!.getTime()) / (dayMs / 8)), 1);
  assert.equal(Math.round((day.rahuKalam!.start.getTime() - day.sunrise!.getTime()) / (dayMs / 8)), 3);
  // Abhijit is the 8th muhurta: starts at sunrise + 7/15 of daylight.
  assert.ok(Math.abs(day.abhijit!.start.getTime() - (day.sunrise!.getTime() + (7 / 15) * dayMs)) < 60_000);
});

test("PANCHANGA individuality: the profile cycles section differs per profile", () => {
  // The day+dasha section is driven by coreProfile(dob, chosenDate):
  // different DOBs must give different Personal Day / cycles.
  const a = coreProfile("Piyush Pokhrel", "2003-01-07", "2026-12-22");
  const b = coreProfile("Jane Doe", "1990-05-15", "2026-12-22");
  assert.notDeepEqual(
    [a.personalYear, a.personalMonth, a.personalDay],
    [b.personalYear, b.personalMonth, b.personalDay],
  );
  assert.equal(a.personalYear, 9); // 2026: 1 + 7 + (2026→1) = 9
  const a27 = coreProfile("Piyush Pokhrel", "2003-01-07", "2027-06-01");
  assert.equal(a27.personalYear, 1); // golden: Personal Year 2027 = 1
});

test("PANCHANGA default location is labelled approximate", () => {
  assert.equal(DEFAULT_PANCHANGA_LOCATION.approximate, true);
  const day = panchangaDay("2026-11-27", DEFAULT_PANCHANGA_LOCATION);
  assert.ok(day.sunrise); // still fully computed — approximate is a label, not a refusal
});
