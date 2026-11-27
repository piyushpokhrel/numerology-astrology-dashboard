/**
 * Milestone 8 — science layer sanity, mean-node golden values,
 * karma/purpose individuality + determinism.
 *
 * Node golden values (Meeus mean node Ω):
 *   2000-01-01 12:00 UTC → Ω ≈ 125.04° (the formula's own constant at T≈0)
 *   2025-01-01 00:00 UTC → Ω ≈ 1.51°
 * Sun distance sanity: the Earth–Sun distance is ~1 AU by definition;
 * light time ~499 s (the famous ~8 min 19 s).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { meanNodeLongitude, westernChart } from "../src/lib/western.ts";
import { vedicChart } from "../src/lib/vedic.ts";
import { planetChanges, planetStates } from "../src/lib/science.ts";
import { cosmicOctaveHz } from "../src/lib/metaphysics.ts";
import { karmaReport } from "../src/lib/karma.ts";
import { coreProfile } from "../src/lib/numerology.ts";

// Owner's true birth instant: 2003-01-07 09:50 NPT (Ghorahi) = 04:05 UTC.
const OWNER_INPUT = {
  utc: new Date("2003-01-07T04:05:00Z"),
  latitude: 28.0483,
  longitudeEast: 82.4866,
};
const OTHER_INPUT = {
  utc: new Date("1990-05-15T16:00:00Z"),
  latitude: 40.71,
  longitudeEast: -74.0,
};

test("NODES: Meeus mean node golden values", () => {
  const a = meanNodeLongitude(new Date("2000-01-01T12:00:00Z"));
  assert.ok(Math.abs(a - 125.04) < 0.1, `2000-01-01 node ${a}`);
  const b = meanNodeLongitude(new Date("2025-01-01T00:00:00Z"));
  assert.ok(Math.abs(b - 1.51) < 0.15, `2025-01-01 node ${b}`);
});

test("NODES: Rahu/Ketu are always opposite, in both charts", () => {
  const v = vedicChart(OWNER_INPUT);
  const diff = Math.abs(((v.nodes.ketuSidereal - v.nodes.rahuSidereal) % 360 + 360) % 360 - 180);
  assert.ok(diff < 1e-9);
  assert.equal(v.nodes.kind, "mean");
});

test("SCIENCE: Sun distance ≈ 1 AU and light time ≈ 499 s at any instant", () => {
  const states = planetStates(new Date("2003-01-07T04:05:00Z"));
  const sun = states.find((s) => s.name === "Sun")!;
  assert.ok(sun.distanceAU > 0.98 && sun.distanceAU < 1.02, `Sun ${sun.distanceAU} AU`);
  assert.ok(sun.lightSeconds > 480 && sun.lightSeconds < 520, `light ${sun.lightSeconds}s`);
  const moon = states.find((s) => s.name === "Moon")!;
  assert.ok(moon.distanceKm > 340_000 && moon.distanceKm < 410_000, `Moon ${moon.distanceKm} km`);
  assert.ok(moon.lightSeconds > 1 && moon.lightSeconds < 1.5);
});

test("SCIENCE: change table arithmetic — Moon completes many orbits, Pluto none", () => {
  const changes = planetChanges(
    new Date("2003-01-07T04:05:00Z"),
    new Date("2026-11-27T00:00:00Z"),
  );
  const moon = changes.find((c) => c.name === "Moon")!;
  assert.ok(moon.orbitsCompleted > 300, `Moon orbits ${moon.orbitsCompleted}`);
  const pluto = changes.find((c) => c.name === "Pluto")!;
  assert.equal(pluto.orbitsCompleted, 0);
  const jupiter = changes.find((c) => c.name === "Jupiter")!;
  assert.equal(jupiter.orbitsCompleted, 2); // ~23.9 years / 11.86 ≈ 2.01
});

test("COUSTO: Earth's orbital tone is the published ~136.10 Hz (Om tone)", () => {
  const t = cosmicOctaveHz(365.256);
  assert.ok(Math.abs(t.hz - 136.1) < 0.5, `Earth tone ${t.hz}`);
});

test("KARMA: determinism + individuality of the purpose statement", () => {
  const coreA = coreProfile("Piyush Pokhrel", "2003-01-07", "2026-11-27");
  const coreB = coreProfile("Jane Doe", "1990-05-15", "2026-11-27");
  const a1 = karmaReport(coreA, westernChart(OWNER_INPUT), vedicChart(OWNER_INPUT));
  const a2 = karmaReport(coreA, westernChart(OWNER_INPUT), vedicChart(OWNER_INPUT));
  assert.deepEqual(a1, a2); // deterministic
  const b = karmaReport(coreB, westernChart(OTHER_INPUT), vedicChart(OTHER_INPUT));
  assert.notEqual(a1.purpose.join("\n"), b.purpose.join("\n"));
  assert.notEqual(
    a1.indicators.map((i) => i.title).join("|"),
    b.indicators.map((i) => i.title).join("|"),
  );
  // The honesty frame is present verbatim in every report:
  assert.ok(a1.framework.some((l) => l.includes("INDICATORS only")));
  assert.ok(a1.framework.some((l) => l.includes("can only be invented")));
  // Owner's purpose quotes his own Life Path both-ways:
  assert.ok(a1.purpose[0].includes("LIFE PATH 4"));
});
