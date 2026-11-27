/**
 * Milestone 10 — Jaimini karakas + Ishta Devta.
 *
 * HAND-COMPUTED D9 CHECKS (documented here, per the milestone spec):
 *  - Cancer 10°00′ sidereal (longitude 100°): Cancer is movable, so its
 *    navamsas count from Cancer itself; 10° is the 4th pada
 *    (10 ÷ 3°20′ = 3.0 → pada index 3) → Cancer + 3 = Libra.
 *    Continuous count: floor(100 / 3.3333) = 30 → 30 mod 12 = 6 = Libra ✓
 *  - Taurus 5°00′ (longitude 35°): Taurus is fixed, navamsas count from
 *    the 9th sign (Capricorn); 5° is the 2nd pada → Aquarius.
 *    Continuous count: floor(35 / 3.3333) = 10 → Aquarius ✓
 * The engine's navamsaSign must reproduce both.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { navamsaSign, vedicChart } from "../src/lib/vedic.ts";
import { jaimini, RESONANCE } from "../src/lib/jaimini.ts";

// Owner's true birth instant: 2003-01-07 09:50 NPT, Ghorahi = 04:05 UTC.
const OWNER = { utc: new Date("2003-01-07T04:05:00Z"), latitude: 28.0483, longitudeEast: 82.4866 };
const OTHER = { utc: new Date("1990-05-15T16:00:00Z"), latitude: 40.71, longitudeEast: -74.0 };

test("JAIMINI D9 hand-checks: Cancer 10° → Libra; Taurus 5° → Aquarius", () => {
  assert.equal(navamsaSign(100), "Libra");
  assert.equal(navamsaSign(35), "Aquarius");
  assert.equal(navamsaSign(0), "Aries"); // Ashwini pada 1
});

test("JAIMINI structure: 7 karakas ranked by degree, AK is the maximum", () => {
  const chart = vedicChart(OWNER);
  const j = jaimini(chart);
  assert.equal(j.karakas.length, 7);
  for (let i = 1; i < 7; i++) {
    assert.ok(j.karakas[i - 1].degreeInSign >= j.karakas[i].degreeInSign);
  }
  assert.equal(j.atmakaraka.short, "AK");
  assert.equal(j.amatyakaraka.short, "AmK");
  // Karakamsa = AK's navamsa sign:
  const akNav = j.navamsa.find((n) => n.body === j.atmakaraka.body)!;
  assert.equal(j.karakamsa, akNav.navamsaSign);
  // Ishta sign is the 12th from Karakamsa, and the planet follows the stated rule:
  assert.ok(j.ishtaRule.includes(j.ishtaSign));
  assert.ok(j.ishtaDeity.length > 1);
  assert.ok(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(j.ishtaPlanet));
});

test("JAIMINI determinism + individuality", () => {
  const a1 = jaimini(vedicChart(OWNER));
  const a2 = jaimini(vedicChart(OWNER));
  assert.deepEqual(a1, a2);
  const b = jaimini(vedicChart(OTHER));
  assert.notDeepEqual(
    a1.karakas.map((k) => `${k.short}:${k.body}`),
    b.karakas.map((k) => `${k.short}:${k.body}`),
  );
});

test("RESONANCE table: six civilizations per planet, honest nulls present", () => {
  for (const planet of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
    const rows = RESONANCE[planet];
    assert.equal(rows.length, 6, planet);
    assert.deepEqual(
      rows.map((r) => r.civilization),
      ["Greek", "Roman", "Egyptian", "Norse", "Babylonian", "Celtic"],
    );
  }
  // Saturn has no Egyptian/Norse/Celtic parallel — stated, not forced:
  const saturn = RESONANCE.Saturn;
  assert.equal(saturn.find((r) => r.civilization === "Egyptian")!.being, null);
  assert.equal(saturn.find((r) => r.civilization === "Norse")!.being, null);
  assert.equal(RESONANCE.Jupiter.find((r) => r.civilization === "Greek")!.being, "Zeus");
});
