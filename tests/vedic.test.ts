import { test } from "node:test";
import assert from "node:assert/strict";

import {
  dashaAt,
  lahiriAyanamsa,
  nakshatraOf,
  siderealLongitude,
  vedicChart,
  vimshottariTimeline,
} from "../src/lib/vedic.ts";
import { tropicalLongitude } from "../src/lib/western.ts";

/* ------------------------------------------------------------------ */
/* CROSS-CHECKS vs published values                                    */
/* ------------------------------------------------------------------ */

test("CROSS-CHECK: Lahiri ayanamsa for 2003-01-01 = 23.899° (published 23°53′56″)", () => {
  const a = lahiriAyanamsa(new Date(Date.UTC(2003, 0, 1)));
  assert.ok(Math.abs(a - 23.899) < 0.01, `ayanamsa ${a}`);
});

test("CROSS-CHECK: Moon on 2003-01-01 00:00 UT → sidereal Scorpio, Jyeshtha pada 2, Mercury dasha", () => {
  // Published tropical Moon: 16°02′ Sagittarius = 256.033°.
  // Sidereal = 256.033 − 23.899 = 232.134° → Scorpio.
  // Nakshatra: 232.134 / 13.333° = 17.41 → index 17 = Jyeshtha
  // (226°40′–240°), pada = (232.134 − 226.667) / 3.333 = 1.64 → pada 2.
  // Jyeshtha's lord is Mercury.
  const chart = vedicChart({
    utc: new Date(Date.UTC(2003, 0, 1, 0, 0, 0)),
    latitude: 28.61,
    longitudeEast: 77.21,
  });
  const moon = chart.grahas.find((g) => g.body === "Moon")!;
  assert.equal(moon.sign, "Scorpio");
  assert.equal(chart.moonNakshatra.name, "Jyeshtha");
  assert.equal(chart.moonNakshatra.pada, 2);
  assert.equal(chart.moonNakshatra.lord, "Mercury");
  // Sidereal Sun: 280.136 − 23.899 = 256.24 → Sagittarius.
  const sun = chart.grahas.find((g) => g.body === "Sun")!;
  assert.equal(sun.sign, "Sagittarius");
});

test("Dasha balance for the cross-check Moon ≈ 10.03 years of Mercury", () => {
  // Traversed fraction of Jyeshtha ≈ (232.137 − 226.667) / 13.333 ≈ 0.410
  // Balance = (1 − 0.410) × 17 ≈ 10.03 years.
  const moonSidereal = siderealLongitude(
    tropicalLongitude("Moon", new Date(Date.UTC(2003, 0, 1))),
    new Date(Date.UTC(2003, 0, 1)),
  );
  const periods = vimshottariTimeline(new Date(Date.UTC(2003, 0, 1)), moonSidereal);
  assert.equal(periods[0].lord, "Mercury");
  assert.equal(periods[0].isBalance, true);
  assert.ok(Math.abs(periods[0].years - 10.03) < 0.1, `balance ${periods[0].years}`);
  // Sequence after Mercury wraps to Ketu (7y), then Venus (20y).
  assert.equal(periods[1].lord, "Ketu");
  assert.equal(periods[1].years, 7);
  assert.equal(periods[2].lord, "Venus");
  assert.equal(periods[2].years, 20);
  // Periods are contiguous.
  assert.equal(periods[1].startISO, periods[0].endISO);
});

test("Constructed case: Moon at 0° sidereal → Ashwini, Ketu, full 7-year balance", () => {
  const nak = nakshatraOf(0);
  assert.equal(nak.name, "Ashwini");
  assert.equal(nak.lord, "Ketu");
  assert.equal(nak.pada, 1);
  assert.equal(nak.traversed, 0);
  const periods = vimshottariTimeline(new Date(Date.UTC(2000, 0, 1)), 0);
  assert.equal(periods[0].lord, "Ketu");
  assert.equal(periods[0].years, 7);
});

test("Nakshatra boundaries: just past 13°20′ is Bharani; 359.9° is Revati pada 4", () => {
  assert.equal(nakshatraOf(13.3).name, "Ashwini");
  assert.equal(nakshatraOf(13.5).name, "Bharani");
  const revati = nakshatraOf(359.9);
  assert.equal(revati.name, "Revati");
  assert.equal(revati.pada, 4);
  assert.equal(revati.lord, "Mercury");
});

test("dashaAt finds the period in force and returns null outside coverage", () => {
  const periods = vimshottariTimeline(new Date(Date.UTC(2003, 0, 1)), 232.137);
  assert.equal(dashaAt(periods, new Date(Date.UTC(2005, 6, 1)))?.lord, "Mercury");
  assert.equal(dashaAt(periods, new Date(Date.UTC(1900, 0, 1))), null);
});

test("Deterministic: same input → identical Vedic chart", () => {
  const input = {
    utc: new Date(Date.UTC(2003, 0, 7, 5, 15, 0)),
    latitude: 43.65,
    longitudeEast: -79.38,
  };
  assert.deepEqual(vedicChart(input), vedicChart(input));
});
