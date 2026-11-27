import { test } from "node:test";
import assert from "node:assert/strict";

import {
  angularSeparation,
  ascendantFromLst,
  findAspects,
  formatInSign,
  localSiderealDegrees,
  midheavenFromLst,
  signOf,
  tropicalLongitude,
  westernChart,
  type PlanetName,
} from "../src/lib/western.ts";

/* ------------------------------------------------------------------ */
/* CROSS-CHECK vs published ephemerides, 2003-01-01 00:00 UT.          */
/* Two independent published tables (astro-seek ephemeris and          */
/* SubaAstro, both 0h UT) agree exactly on these longitudes:           */
/*   Sun 10°08′ Cap, Moon 16°02′ Sag, Mercury 28°10′ Cap,               */
/*   Venus 23°40′ Sco, Mars 19°34′ Sco, Jupiter 16°53′ Leo,             */
/*   Saturn 24°26′ Gem, Uranus 26°15′ Aqu, Neptune 9°34′ Aqu,           */
/*   Pluto 18°16′ Sag.                                                 */
/* Tolerance 0.05° — the engine agreed within 0.013° when probed.      */
/* ------------------------------------------------------------------ */

const EPHEMERIS_2003_01_01: ReadonlyArray<{ body: PlanetName; longitude: number }> = [
  { body: "Sun", longitude: 270 + 10 + 8 / 60 }, // 10°08′ Capricorn (sign base 270°)
  { body: "Moon", longitude: 240 + 16 + 2 / 60 },
  { body: "Mercury", longitude: 270 + 28 + 10 / 60 },
  { body: "Venus", longitude: 210 + 23 + 40 / 60 },
  { body: "Mars", longitude: 210 + 19 + 34 / 60 },
  { body: "Jupiter", longitude: 120 + 16 + 53 / 60 },
  { body: "Saturn", longitude: 60 + 24 + 26 / 60 },
  { body: "Uranus", longitude: 300 + 26 + 15 / 60 },
  { body: "Neptune", longitude: 300 + 9 + 34 / 60 },
  { body: "Pluto", longitude: 240 + 18 + 16 / 60 },
];

test("CROSS-CHECK: engine longitudes match the published ephemeris (2003-01-01 00:00 UT)", () => {
  const when = new Date(Date.UTC(2003, 0, 1, 0, 0, 0));
  for (const { body, longitude } of EPHEMERIS_2003_01_01) {
    const got = tropicalLongitude(body, when);
    const diff = Math.abs(got - longitude);
    assert.ok(diff <= 0.05, `${body}: engine ${got.toFixed(3)} vs published ${longitude.toFixed(3)} (diff ${diff.toFixed(3)})`);
  }
});

test("Signs from the cross-check date are the published signs", () => {
  const chart = westernChart({
    utc: new Date(Date.UTC(2003, 0, 1, 0, 0, 0)),
    latitude: 51.5,
    longitudeEast: 0,
  });
  const byBody = Object.fromEntries(chart.positions.map((p) => [p.body, p.sign]));
  assert.equal(byBody.Sun, "Capricorn");
  assert.equal(byBody.Moon, "Sagittarius");
  assert.equal(byBody.Jupiter, "Leo");
  assert.equal(byBody.Saturn, "Gemini");
});

test("Angles at 2003-01-01 00:00 UT, London: MC in Cancer, ASC in Libra", () => {
  // GAST at that instant is 6.6822h (astro-seek prints sidereal time
  // 06:40:56 for this date — the same value). LST at lon 0 = 100.23°.
  const lst = localSiderealDegrees(new Date(Date.UTC(2003, 0, 1)), 0);
  assert.ok(Math.abs(lst - 100.23) < 0.1, `LST ${lst}`);
  assert.equal(signOf(midheavenFromLst(lst)), "Cancer");
  assert.equal(signOf(ascendantFromLst(lst, 51.5)), "Libra");
});

test("formatInSign renders degrees and minutes inside the sign", () => {
  assert.equal(formatInSign(280.133), "10°07′ Capricorn");
  assert.equal(formatInSign(0), "0°00′ Aries");
  assert.equal(formatInSign(359.999), "29°59′ Pisces");
});

test("Aspects: exact trine and near square are found with correct orbs", () => {
  const aspects = findAspects([
    { body: "Sun", longitude: 0 },
    { body: "Moon", longitude: 120 },
    { body: "Mars", longitude: 90.5 },
  ]);
  const trine = aspects.find((a) => a.type === "Trine");
  assert.ok(trine && trine.a === "Sun" && trine.b === "Moon" && trine.orb === 0);
  const square = aspects.find((a) => a.type === "Square");
  assert.ok(square && square.orb === 0.5);
});

test("angularSeparation wraps correctly", () => {
  assert.equal(angularSeparation(350, 10), 20);
  assert.equal(angularSeparation(0, 180), 180);
  assert.equal(angularSeparation(45, 45), 0);
});

test("Deterministic: the same chart input always yields the identical chart", () => {
  const input = {
    utc: new Date(Date.UTC(2003, 0, 7, 5, 15, 0)),
    latitude: 43.65,
    longitudeEast: -79.38,
  };
  assert.deepEqual(westernChart(input), westernChart(input));
});
