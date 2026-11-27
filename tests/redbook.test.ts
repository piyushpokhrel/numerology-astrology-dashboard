import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * THE RED BOOK — generator tests.
 *
 * The book is a paid product, so its core promise is reproducibility:
 * the same profile must produce the identical book structure on every
 * run (differentiation spec, trust rule 4 — non-deterministic outputs
 * are a named scam pattern in the market review). These tests lock:
 *   - determinism (two builds deep-equal),
 *   - the chapter list and the free/locked split (Ch. 1 free only),
 *   - the single public price (CAD 19),
 *   - golden-profile facts surfacing in the content,
 *   - the Antardasha proportion math.
 */

import {
  antardashas,
  buildRedBook,
  cheiroCompound,
  redBookProfileKey,
  RED_BOOK_PRICE_CAD,
} from "../src/lib/redbook.ts";
import type { Profile } from "../src/lib/profile.ts";
import type { ChartInput } from "../src/lib/western.ts";

const PROFILE: Profile = {
  fullName: "Piyush Pokhrel",
  dob: "2003-01-07",
  birthTime: "12:00",
  birthPlace: "Toronto, Canada",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

const INPUT: ChartInput = {
  utc: new Date("2003-01-07T17:00:00.000Z"), // 12:00 Toronto (EST)
  latitude: 43.6532,
  longitudeEast: -79.3832,
};

const ON_DATE = "2026-11-26";

test("REDBOOK determinism — same inputs, identical book", () => {
  const a = buildRedBook(PROFILE, INPUT, ON_DATE);
  const b = buildRedBook(PROFILE, INPUT, ON_DATE);
  assert.deepEqual(a, b);
});

test("REDBOOK structure — seven chapters, only Chapter 1 free", () => {
  const book = buildRedBook(PROFILE, INPUT, ON_DATE);
  assert.equal(book.chapters.length, 7);
  assert.deepEqual(
    book.chapters.map((c) => c.title),
    [
      "The Complete Numbers",
      "The Year and Its Allies",
      "The Tropical Chart in Depth",
      "Nakshatra and the Dasha Timeline",
      "Karma and Life Themes",
      "Where All Systems Agree",
      "Past Life Karma and the True Purpose of This Lifetime",
    ],
  );
  assert.equal(book.chapters[0].free, true);
  assert.ok(book.chapters.slice(1).every((c) => c.free === false));
  assert.ok(book.chapters.every((c) => c.sections.length >= 2));
  assert.ok(book.chapters.every((c) => c.source.length > 10));
});

test("REDBOOK price — one public price, CAD 19", () => {
  const book = buildRedBook(PROFILE, INPUT, ON_DATE);
  assert.equal(RED_BOOK_PRICE_CAD, 19);
  assert.equal(book.priceCAD, 19);
  assert.equal(book.profileKey, redBookProfileKey(PROFILE));
  assert.equal(book.generatedFor, ON_DATE);
});

test("REDBOOK golden content — Piyush's verified facts appear", () => {
  const book = buildRedBook(PROFILE, INPUT, ON_DATE);
  const allText = JSON.stringify(book);
  // Life Path 4 and the Water Horse must surface in the synthesis.
  assert.match(allText, /Life Path 4/);
  assert.match(allText, /Water Horse/);
  // Chapter 1 carries the next-twelve-months table.
  const months = book.chapters[0].sections.find((s) =>
    s.heading.includes("twelve personal months"),
  );
  assert.ok(months);
  assert.equal(months.lines.length, 12);
});

test("REDBOOK Cheiro compounds — table + family rule", () => {
  assert.match(cheiroCompound(17).text, /Star of the Magi/);
  assert.match(cheiroCompound(16).text, /Shattered Citadel/);
  // 52 is read through its family (43) per Cheiro.
  assert.equal(cheiroCompound(52).text, cheiroCompound(43).text);
  assert.match(cheiroCompound(17).source, /Cheiro/);
});

test("REDBOOK antardashas — nine sub-periods tile the Mahadasha exactly", () => {
  const maha = {
    lord: "Saturn" as const,
    years: 19,
    isBalance: false,
    startISO: "2016-11-24T00:00:00.000Z",
    endISO: "2035-11-24T00:00:00.000Z",
  };
  const subs = antardashas(maha);
  assert.equal(subs.length, 9);
  assert.equal(subs[0].lord, "Saturn"); // sequence starts at the maha lord
  assert.equal(subs[0].startISO, maha.startISO);
  assert.equal(subs[8].endISO, maha.endISO);
  for (let i = 1; i < 9; i++) {
    assert.equal(subs[i].startISO, subs[i - 1].endISO); // no gaps, no overlaps
  }
  // Saturn/Saturn portion = 19/120 of the span.
  const span = Date.parse(maha.endISO) - Date.parse(maha.startISO);
  const first = Date.parse(subs[0].endISO) - Date.parse(subs[0].startISO);
  assert.ok(Math.abs(first / span - 19 / 120) < 0.001);
});
