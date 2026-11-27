/**
 * Locations amendment — broad and optional.
 *  - A profile saves with an EMPTY birth place.
 *  - resolveLocation never refuses: empty input → labelled default.
 *  - Manual coordinates for Ghorahi resolve exactly (owner's place).
 *  - Location-free engines run at full precision with no location.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { profileSchema } from "../src/lib/schemas.ts";
import { resolveLocation, validCoordinates, DEFAULT_LOCATION } from "../src/lib/geo.ts";
import { coreProfile } from "../src/lib/numerology.ts";
import { chineseProfile } from "../src/lib/chinese.ts";

test("GEO: profile saves with empty location (birthplace optional)", () => {
  const parsed = profileSchema.safeParse({
    fullName: "Test Person",
    dob: "2000-01-01",
    birthTime: "",
    birthPlace: "",
  });
  assert.equal(parsed.success, true);
  const noPlace = profileSchema.safeParse({
    fullName: "Test Person",
    dob: "2000-01-01",
  });
  assert.equal(noPlace.success, true);
});

test("GEO: empty location resolves to the labelled default — never a refusal", () => {
  const r = resolveLocation(null);
  assert.equal(r.approximate, true);
  assert.equal(r.source, "default");
  assert.equal(r.label, DEFAULT_LOCATION.label);
  const r2 = resolveLocation({});
  assert.equal(r2.approximate, true);
});

test("GEO: manual coordinates resolve exactly — Ghorahi, Nepal", () => {
  const r = resolveLocation({
    label: "Ghorahi, Dang, Nepal",
    latitude: 28.0483,
    longitudeEast: 82.4866,
    utcOffsetHours: 5.75,
  });
  assert.equal(r.source, "manual");
  assert.equal(r.approximate, false);
  assert.equal(r.latitude, 28.0483);
  assert.equal(r.longitudeEast, 82.4866);
  assert.ok(validCoordinates(28.0483, 82.4866));
  assert.ok(!validCoordinates(128, 82));
});

test("GEO: location-free engines are exact with no location at all", () => {
  // Numerology + Chinese need no coordinates — full precision, always.
  const core = coreProfile("Piyush Pokhrel", "2003-01-07", "2026-11-27");
  assert.equal(core.lifePath, 4);
  const cp = chineseProfile("2003-01-07");
  assert.equal(cp.animal, "Horse");
  assert.equal(cp.element, "Water");
});
