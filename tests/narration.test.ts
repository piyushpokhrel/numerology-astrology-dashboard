import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * VOICE NARRATION (milestone 13) — the spoken script is a product
 * surface, so its facts are locked like every other engine's:
 * the golden profile's known values must appear in the narration,
 * all five sections must exist and carry real content, the Challenges
 * section must show its derivations, and the Fruitful section must
 * name the active Pinnacle with its age range and the Personal Year.
 * No number in the script may be invented — these tests pin the ones
 * the golden case makes checkable.
 */

import { buildNarration } from "../src/lib/narration.ts";
import { challenges, pinnacles } from "../src/lib/numerology.ts";
import type { Profile } from "../src/lib/profile.ts";
import type { ChartInput } from "../src/lib/western.ts";
import type { PanchangaLocation } from "../src/lib/panchanga.ts";

const GOLDEN: Profile = {
  fullName: "Piyush Pokhrel",
  dob: "2003-01-07",
  birthTime: "09:50",
  birthPlace: "Ghorahi, Dang, Nepal",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

// Ghorahi, Dang, Nepal — 09:50 local (UTC+5:45) = 04:05 UTC.
const GHORAHI_INPUT: ChartInput = {
  utc: new Date("2003-01-07T04:05:00.000Z"),
  latitude: 28.0483,
  longitudeEast: 82.4866,
};

const GHORAHI_LOCATION: PanchangaLocation = {
  label: "Ghorahi, Dang, Nepal",
  latitude: 28.0483,
  longitudeEast: 82.4866,
  timeZone: "Asia/Kathmandu",
};

const ON_2027 = "2027-06-15";

test("NARRATION golden — the known facts are spoken", () => {
  const n = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  const all = n.sections.map((s) => s.spokenText).join(" ");
  assert.ok(all.includes("Life Path is 4"), "Life Path 4 spoken");
  assert.ok(all.includes("Birthday number is 7"), "Birthday 7 spoken");
  assert.ok(all.includes("Personal Year is 1"), "Personal Year 1 for 2027 spoken");
  assert.ok(all.includes("Water Horse"), "Water Horse spoken");

  const chal = challenges(GOLDEN.dob);
  const challengesSection = n.sections.find((s) => s.id === "challenges")!;
  assert.ok(
    challengesSection.spokenText.includes(`Main Challenge, ${chal.main}`) ||
      challengesSection.spokenText.includes(`Main Challenge is ${chal.main}`) ||
      challengesSection.displayText.includes(`Main Challenge ${chal.main}`),
    `Main Challenge ${chal.main} present`,
  );
  assert.ok(
    challengesSection.spokenText.includes(`gives ${chal.main}`),
    "Main Challenge value derived in speech",
  );

  // Active Pinnacle for his age in 2027 (24 on 2027-06-15).
  const pin = pinnacles(GOLDEN.dob);
  const age = 24;
  const active = pin.pinnacles.find(
    (p) => age >= p.startAge && (p.endAge === null || age <= p.endAge),
  )!;
  const fruitful = n.sections.find((s) => s.id === "fruitful")!;
  assert.ok(
    fruitful.spokenText.includes(`Pinnacle ${active.index}`) &&
      fruitful.spokenText.includes(`ages ${active.startAge} to ${active.endAge}`),
    `active Pinnacle ${active.index} with age range spoken`,
  );
  assert.ok(fruitful.displayText.includes("ACTIVE NOW"), "active Pinnacle marked on screen");
});

test("NARRATION structure — five sections, none trivial, a real listen", () => {
  const n = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  assert.deepEqual(
    n.sections.map((s) => s.id),
    ["opening", "details", "challenges", "fruitful", "closing"],
  );
  for (const s of n.sections) {
    assert.ok(s.title.length > 3, `${s.id} has a title`);
    assert.ok(s.spokenText.split(/\s+/).length >= 60, `${s.id} spoken text is non-trivial`);
    assert.ok(s.displayText.length > 40, `${s.id} display text present`);
    // Spoken text must be safe for a speech engine: no markdown, no degree signs.
    assert.ok(!/[#*°|]/.test(s.spokenText), `${s.id} spoken text has no markdown/symbols`);
  }
  // A real listen: roughly 6–10 minutes at ~150 wpm.
  assert.ok(n.wordCount >= 850 && n.wordCount <= 1700, `word count ${n.wordCount} in range`);
  assert.ok(n.estimatedMinutes >= 5 && n.estimatedMinutes <= 12, `~${n.estimatedMinutes} min`);
});

test("NARRATION challenges — derivations are shown", () => {
  const n = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  const s = n.sections.find((x) => x.id === "challenges")!;
  const chal = challenges(GOLDEN.dob);
  assert.ok(s.displayText.includes(chal.formulas.main), "main formula in display text");
  assert.ok(s.displayText.includes(chal.formulas.first), "first formula in display text");
  assert.ok(/teacher, not a threat/.test(s.spokenText), "challenge framed as teacher");
  assert.ok(!/past life/i.test(s.spokenText), "no invented past-life stories");
});

test("NARRATION fruitful — Pinnacle age range and Personal Year present", () => {
  const n = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  const s = n.sections.find((x) => x.id === "fruitful")!;
  assert.ok(/Pinnacle 1 is/.test(s.spokenText), "first Pinnacle spoken");
  assert.ok(/ages \d+ to \d+/.test(s.spokenText), "a Pinnacle age range spoken");
  assert.ok(s.spokenText.includes("Personal Year is 1"), "Personal Year spoken");
  assert.ok(/Mahadasha/.test(s.spokenText), "current dasha spoken");
});

test("NARRATION panchanga — windows only when a location is supplied", () => {
  const without = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  const f1 = without.sections.find((s) => s.id === "fruitful")!;
  assert.ok(!/Abhijit/.test(f1.spokenText), "no Panchanga windows without a location");

  const withLoc = buildNarration(GOLDEN, ON_2027, {
    chartInput: GHORAHI_INPUT,
    panchangaLocation: GHORAHI_LOCATION,
  });
  const f2 = withLoc.sections.find((s) => s.id === "fruitful")!;
  assert.ok(/Abhijit/.test(f2.spokenText), "Abhijit window spoken with a location");
});

test("NARRATION second profile — no section empty, facts follow the profile", () => {
  const other: Profile = {
    fullName: "Ada Lovelace",
    dob: "1990-12-10",
    birthTime: "",
    birthPlace: "London, UK",
    createdAt: "2026-11-26T00:00:00.000Z",
    updatedAt: "2026-11-26T00:00:00.000Z",
  };
  const n = buildNarration(other, "2026-11-27");
  assert.equal(n.sections.length, 5);
  for (const s of n.sections) {
    assert.ok(s.spokenText.trim().length > 100, `${s.id} non-empty for second profile`);
    assert.ok(s.displayText.trim().length > 0, `${s.id} display non-empty`);
  }
  const all = n.sections.map((s) => s.spokenText).join(" ");
  assert.ok(all.includes("Ada"), "second profile's name spoken");
  assert.ok(!all.includes("Water Horse"), "golden facts do not leak into another profile");
});

test("NARRATION determinism — same inputs, identical script", () => {
  const a = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  const b = buildNarration(GOLDEN, ON_2027, { chartInput: GHORAHI_INPUT });
  assert.deepEqual(a, b);
});
