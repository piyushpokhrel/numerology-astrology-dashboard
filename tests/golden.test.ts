import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * GOLDEN-CASE VERIFICATION — Piyush's verified profile through EVERY
 * engine, end to end. These are the acceptance facts for the whole
 * build (differentiation spec, trust rule 4):
 *
 *   DOB 2003-01-07 → Life Path 4, Birthday 7,
 *   Personal Year 2027 = 1, Chinese sign = Water Horse.
 *
 * The Western/Vedic assertions use a fixed test-fixture instant and
 * place (2003-01-07 12:00 UTC, Toronto coords) and assert determinism
 * + internal consistency; position accuracy itself is locked by the
 * published-ephemeris cross-checks in western.test.ts / vedic.test.ts.
 */

import { coreProfile } from "../src/lib/numerology.ts";
import { chineseProfile, yearOutlook } from "../src/lib/chinese.ts";
import { checkNameHarmony } from "../src/lib/namecheck.ts";
import { profileSchema } from "../src/lib/schemas.ts";
import { westernChart } from "../src/lib/western.ts";
import { vedicChart } from "../src/lib/vedic.ts";

const NAME = "Piyush Pokhrel";
const DOB = "2003-01-07";

test("GOLDEN e2e — numerology core profile", () => {
  const p = coreProfile(NAME, DOB, "2027-06-15");
  assert.equal(p.lifePath, 4);
  assert.equal(p.birthday, 7);
  assert.equal(p.personalYear, 1); // personal year for 2027
  assert.equal(p.attitude, 8);
  assert.equal(p.destinyPythagorean, 3);
  assert.equal(p.soulUrge, 5);
  assert.equal(p.personality, 7);
  assert.equal(p.chaldeanName.compound, 56);
  assert.equal(p.chaldeanName.root, 2);
});

test("GOLDEN e2e — Chinese profile is the Water Horse, 2027 is its secret-friend year", () => {
  const cp = chineseProfile(DOB);
  assert.equal(cp.animal, "Horse");
  assert.equal(cp.element, "Water");
  assert.equal(cp.secretFriend, "Goat");
  assert.equal(cp.clash, "Rat");
  assert.equal(yearOutlook(cp, 2027).relation, "secret-friend");
});

test("GOLDEN e2e — his own credentials pass the validation gate", () => {
  const r = profileSchema.safeParse({
    fullName: NAME,
    dob: DOB,
    birthTime: "",
    birthPlace: "Toronto, Canada",
  });
  assert.ok(r.success);
});

test("GOLDEN e2e — name checker on his businesses is deterministic", () => {
  const a = checkNameHarmony("Holisticseason", NAME, DOB);
  const b = checkNameHarmony("Holisticseason", NAME, DOB);
  assert.deepEqual(a, b);
  assert.equal(a.lifePath, 4);
});

test("GOLDEN e2e — Western + Vedic charts for the fixture instant are deterministic and consistent", () => {
  const input = {
    utc: new Date(Date.UTC(2003, 0, 7, 12, 0, 0)),
    latitude: 43.65,
    longitudeEast: -79.38,
  };
  const w1 = westernChart(input);
  const w2 = westernChart(input);
  assert.deepEqual(w1, w2);
  assert.equal(w1.positions.length, 10);
  // Sun in early January is always Capricorn (tropical).
  assert.equal(w1.positions.find((p) => p.body === "Sun")!.sign, "Capricorn");

  const v1 = vedicChart(input);
  const v2 = vedicChart(input);
  assert.deepEqual(v1, v2);
  // Sidereal Sun in early January is always Sagittarius.
  assert.equal(v1.grahas.find((g) => g.body === "Sun")!.sign, "Sagittarius");
  // One full Vimshottari cycle = balance + the next 8 full periods
  // = 120 years minus the part of the first nakshatra already elapsed
  // at birth (so: > 100 and ≤ 120). The 10th returned period already
  // belongs to the following cycle.
  const oneCycle = v1.dashas.slice(0, 9).reduce((acc, d) => acc + d.years, 0);
  assert.ok(oneCycle > 100 && oneCycle <= 120.01, `one dasha cycle spans ${oneCycle}`);
  // Ayanamsa applied consistently: sidereal = tropical − ayanamsa.
  const moon = v1.grahas.find((g) => g.body === "Moon")!;
  const diff = ((moon.tropical - moon.sidereal) % 360 + 360) % 360;
  assert.ok(Math.abs(diff - v1.ayanamsa) < 0.01, `moon shift ${diff} vs ayanamsa ${v1.ayanamsa}`);
});
