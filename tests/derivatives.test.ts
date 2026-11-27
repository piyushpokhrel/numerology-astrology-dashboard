/**
 * Milestone 7 — derivatives, both-ways master display, and the
 * individuality lock.
 *
 * Hand-checks used below were verified against published sources
 * (Nov 2026):
 *  - Pinnacles/Challenges: Decoz's own worked examples
 *    (worldnumerology.com) — 1949-05-15 → Pinnacles 11, 11, 22, 1;
 *    2000-02-09 → Pinnacles 11, 11, 22, 4 with ranges 0–32/33–41/
 *    42–50/51+ (also theworked example at luminaastro.com), and
 *    Challenges 7, 7, 0, 0.
 *  - Day pillar anchors (sexagenary cycle): 2000-01-01 = Wu-Wu,
 *    2019-01-27 = Jia-Zi, 2024-02-10 = Jia-Chen (published BaZi
 *    references); hour pillar 2000-01-01 12:00 = Wu-Wu (Mingli Atlas
 *    worked example of the Five Rats rule).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  balanceNumber,
  challenges,
  compoundFamily,
  coreProfile,
  coreProfileDisplays,
  displayNumber,
  growthNumber,
  isMasterNumber,
  maturityNumber,
  pinnacles,
  rationalThoughtNumber,
} from "../src/lib/numerology.ts";
import { bothWays } from "../src/lib/meanings.ts";
import { dayPillar, fiveYearRelations, hourPillar, chineseProfile } from "../src/lib/chinese.ts";
import { buildRedBook } from "../src/lib/redbook.ts";
import type { Profile } from "../src/lib/profile.ts";

/* ---------------- both-ways display ---------------- */

test("DISPLAY: master numbers always render with their root", () => {
  assert.equal(displayNumber(11), "11/2");
  assert.equal(displayNumber(22), "22/4");
  assert.equal(displayNumber(33), "33/6");
  assert.equal(displayNumber(4), "4");
  assert.equal(displayNumber(9), "9");
});

test("DISPLAY LOCK: no master value in the core profile output lacks its root pairing", () => {
  // Profiles chosen to hold master numbers in different fields:
  // 1989-11-09 → Life Path 11; 1998-09-04 → Life Path 22;
  // 1990-05-22 → Birthday 22; the golden profile for regression.
  const cases: Array<[string, string]> = [
    ["Master Eleven", "1989-11-09"],
    ["Master Twentytwo", "1998-09-04"],
    ["Birthday Master", "1990-05-22"],
    ["Piyush Pokhrel", "2003-01-07"],
    ["Jane Doe", "1990-05-15"],
  ];
  for (const [name, dob] of cases) {
    const core = coreProfile(name, dob, "2026-11-26");
    const displays = coreProfileDisplays(core);
    const raw: Record<string, number> = {
      lifePath: core.lifePath,
      birthday: core.birthday,
      attitude: core.attitude,
      destinyPythagorean: core.destinyPythagorean,
      destinyChaldean: core.destinyChaldean,
      soulUrge: core.soulUrge,
      personality: core.personality,
      chaldeanNameRoot: core.chaldeanName.root,
      pythagoreanNameRoot: core.pythagoreanName.root,
    };
    for (const [field, value] of Object.entries(raw)) {
      const shown = displays[field];
      if (isMasterNumber(value)) {
        assert.match(
          shown,
          new RegExp(`^${value}/\\d$`),
          `${name} ${field}: master ${value} shown as "${shown}" without its root`,
        );
      } else {
        assert.equal(shown, String(value), `${name} ${field}`);
      }
    }
  }
  // The two master life paths specifically:
  assert.equal(coreProfileDisplays(coreProfile("A B", "1989-11-09", "2026-11-26")).lifePath, "11/2");
  assert.equal(coreProfileDisplays(coreProfile("A B", "1998-09-04", "2026-11-26")).lifePath, "22/4");
});

test("BOTH WAYS: a master reading carries BOTH labelled lines; an ordinary number carries one", () => {
  const bw11 = bothWays(11);
  assert.equal(bw11.display, "11/2");
  assert.equal(bw11.lines.length, 2);
  assert.match(bw11.lines[0], /master way/i);
  assert.match(bw11.lines[1], /root way/i);
  const bw4 = bothWays(4);
  assert.equal(bw4.lines.length, 1);
  assert.equal(bw4.display, "4");
});

/* ---------------- Pinnacles & Challenges (published hand-checks) ---------------- */

test("PINNACLES: Decoz worked example 1949-05-15 → 11, 11, 22, 1", () => {
  const p = pinnacles("1949-05-15");
  assert.deepEqual(p.pinnacles.map((x) => x.value), [11, 11, 22, 1]);
});

test("PINNACLES: 2000-02-09 → 11, 11, 22, 4 with ranges 0–32 / 33–41 / 42–50 / 51+", () => {
  const p = pinnacles("2000-02-09");
  assert.deepEqual(p.pinnacles.map((x) => x.value), [11, 11, 22, 4]);
  assert.deepEqual(
    p.pinnacles.map((x) => [x.startAge, x.endAge]),
    [[0, 32], [33, 41], [42, 50], [51, null]],
  );
  assert.equal(p.firstEndAge, 32);
  assert.equal(p.lifePathRoot, 4);
});

test("CHALLENGES: 2000-02-09 → first 7, second 7, main 0, fourth 0 (published)", () => {
  const c = challenges("2000-02-09");
  assert.deepEqual([c.first, c.second, c.main, c.fourth], [7, 7, 0, 0]);
  assert.deepEqual(c.components, { month: 2, day: 9, year: 2 });
});

test("CHALLENGES: golden profile 2003-01-07 → 6, 2, 4, 4 from components 1, 7, 5", () => {
  const c = challenges("2003-01-07");
  assert.deepEqual(c.components, { month: 1, day: 7, year: 5 });
  // |1−7|=6 · |7−5|=2 · |6−2|=4 · |1−5|=4
  assert.deepEqual([c.first, c.second, c.main, c.fourth], [6, 2, 4, 4]);
});

/* ---------------- Secondary derivatives (hand-computed) ---------------- */

test("DERIVATIVES: golden profile secondary numbers", () => {
  // PIYUSH letters (Pythagorean): 7+9+7+3+1+8 = 35.
  assert.equal(growthNumber("Piyush Pokhrel"), 8); // 35 → 8
  assert.equal(rationalThoughtNumber("Piyush Pokhrel", "2003-01-07"), 6); // 35 + 7 = 42 → 6
  assert.equal(balanceNumber("Piyush Pokhrel"), 5); // initials P(7) + P(7) = 14 → 5
  assert.equal(maturityNumber("Piyush Pokhrel", "2003-01-07"), 7); // LP 4 + Destiny 3
});

test("COMPOUND FAMILY: root 4 family is 13, 22, 31, 40, 49", () => {
  assert.deepEqual(compoundFamily(4), [13, 22, 31, 40, 49]);
  assert.deepEqual(compoundFamily(2), [11, 20, 29, 38, 47]);
});

/* ---------------- Chinese day/hour pillars (published anchors) ---------------- */

test("DAY PILLAR anchors: 2000-01-01 Wu-Wu · 2019-01-27 Jia-Zi · 2024-02-10 Jia-Chen", () => {
  const a = dayPillar("2000-01-01");
  assert.equal(`${a.stem}-${a.branch}`, "Wu-Wu");
  assert.equal(a.cycleNumber, 55);
  const b = dayPillar("2019-01-27");
  assert.equal(`${b.stem}-${b.branch}`, "Jia-Zi");
  assert.equal(b.cycleNumber, 1);
  const c = dayPillar("2024-02-10");
  assert.equal(`${c.stem}-${c.branch}`, "Jia-Chen");
  assert.equal(c.cycleNumber, 41);
});

test("HOUR PILLAR: Five Rats worked example — 2000-01-01 12:00 → Wu-Wu", () => {
  const hp = hourPillar("2000-01-01", "12:00");
  assert.ok(hp);
  assert.equal(`${hp.stem}-${hp.branch}`, "Wu-Wu");
  assert.equal(hp.window, "11:00–13:00");
  // No time → null, never assumed.
  assert.equal(hourPillar("2000-01-01", undefined), null);
  assert.equal(hourPillar("2000-01-01", "9am"), null);
});

test("FIVE-YEAR RELATIONS: golden Horse profile from 2026 — Goat 2027 is the secret friend", () => {
  const cp = chineseProfile("2003-01-07");
  const rels = fiveYearRelations(cp, 2026, 5);
  assert.equal(rels.length, 5);
  assert.deepEqual(rels.map((r) => r.year), [2026, 2027, 2028, 2029, 2030]);
  const y2027 = rels.find((r) => r.year === 2027)!;
  assert.equal(y2027.animal, "Goat");
  assert.equal(y2027.relation, "secret-friend");
  const y2026 = rels.find((r) => r.year === 2026)!;
  assert.equal(y2026.relation, "own-sign"); // 2026 is a Horse year
});

/* ---------------- Individuality + determinism (Red Book) ---------------- */

const GOLDEN: Profile = {
  fullName: "Piyush Pokhrel",
  dob: "2003-01-07",
  birthTime: "12:00",
  birthPlace: "Toronto, Canada",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

const OTHER: Profile = {
  fullName: "Jane Doe",
  dob: "1990-05-15",
  birthPlace: "New York, NY, USA",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

const CHART_INPUT = {
  utc: new Date("2003-01-07T17:00:00Z"),
  latitude: 43.65,
  longitudeEast: -79.38,
};
const CHART_INPUT_OTHER = {
  utc: new Date("1990-05-15T16:00:00Z"),
  latitude: 40.71,
  longitudeEast: -74.0,
};

function chapterText(book: ReturnType<typeof buildRedBook>, id: string): string {
  const ch = book.chapters.find((c) => c.id === id)!;
  return ch.sections.map((s) => [s.heading, ...s.lines].join("\n")).join("\n");
}

test("INDIVIDUALITY: two profiles produce materially different text in EVERY Red Book chapter", () => {
  const a = buildRedBook(GOLDEN, CHART_INPUT, "2026-11-26");
  const b = buildRedBook(OTHER, CHART_INPUT_OTHER, "2026-11-26");
  for (const id of ["numbers", "chinese", "western", "vedic", "karma", "synthesis"]) {
    assert.notEqual(
      chapterText(a, id),
      chapterText(b, id),
      `chapter ${id} reads identically for two different profiles`,
    );
  }
  // Each book quotes its own figures:
  assert.match(chapterText(a, "numbers"), /Life Path — 4/);
  assert.match(chapterText(b, "numbers"), /Life Path — 3/); // Jane Doe 1990-05-15 → LP 3
  assert.match(chapterText(a, "chinese"), /Water Horse/);
  assert.match(chapterText(b, "chinese"), /Metal Horse/);
  // Derivatives are present and individual:
  assert.match(chapterText(a, "numbers"), /Pinnacle 1: 8/); // 1 + 7
  assert.match(chapterText(a, "numbers"), /Main Challenge 4/);
});

test("DETERMINISM: the same profile produces identical Red Book text on re-run", () => {
  const a = buildRedBook(GOLDEN, CHART_INPUT, "2026-11-26");
  const b = buildRedBook(GOLDEN, CHART_INPUT, "2026-11-26");
  assert.deepEqual(a, b);
});

test("SYNTHESIS: convergence checks are computed and quoted — including honest negatives", () => {
  const a = buildRedBook(GOLDEN, CHART_INPUT, "2026-11-26");
  const text = chapterText(a, "synthesis");
  // Check 1 for the golden profile: LP root 4 vs Moon's nakshatra lord.
  // (Whatever the outcome, the chapter must state it explicitly.)
  assert.match(text, /(CONVERGENCE|NO CONVERGENCE|NOT DIRECTLY COMPARABLE)/);
  assert.match(text, /convergence checks — \d of 4 agree/);
  assert.match(text, /Life Path 4/);
});
