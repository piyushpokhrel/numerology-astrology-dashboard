import { test } from "node:test";
import assert from "node:assert/strict";

import {
  animalForZodiacYear,
  chineseProfile,
  clashSign,
  elementRelation,
  relationBetween,
  secretFriend,
  stemForZodiacYear,
  trineGroup,
  yearOutlook,
  zodiacYearForDate,
} from "../src/lib/chinese.ts";

/* ------------------------------------------------------------------ */
/* GOLDEN: the Water Horse boundary case                               */
/*                                                                     */
/* CNY 2003 = Feb 1, 2003. Jan 7, 2003 is BEFORE it, so the birth is   */
/* in zodiac year 2002: animal (2002−4) mod 12 = 6 → Horse; stem       */
/* (2002−4) mod 10 = 8 → Water, Yang. → Water Horse.                   */
/* ------------------------------------------------------------------ */

test("GOLDEN: 2003-01-07 → Water Horse (Feb 1, 2003 CNY boundary)", () => {
  const p = chineseProfile("2003-01-07");
  assert.equal(p.animal, "Horse");
  assert.equal(p.element, "Water");
  assert.equal(p.polarity, "Yang");
  assert.equal(p.zodiacYear, 2002);
  assert.equal(p.cnyDate, "2002-02-12");
});

test("Boundary: 2003-01-31 is still Horse; 2003-02-01 flips to Water Goat", () => {
  assert.equal(chineseProfile("2003-01-31").animal, "Horse");
  const goat = chineseProfile("2003-02-01");
  assert.equal(goat.animal, "Goat");
  assert.equal(goat.element, "Water"); // 2003 stem index 9 → Water Yin
  assert.equal(goat.polarity, "Yin");
  assert.equal(goat.zodiacYear, 2003);
});

test("Boundary: 2027-02-05 → Fire Horse; 2027-02-06 → Fire Goat", () => {
  const horse = chineseProfile("2027-02-05");
  assert.equal(horse.animal, "Horse");
  assert.equal(horse.element, "Fire");
  const goat = chineseProfile("2027-02-06");
  assert.equal(goat.animal, "Goat");
  assert.equal(goat.element, "Fire");
  assert.equal(goat.zodiacYear, 2027);
});

test("Zodiac year resolution around a mid-table CNY (1985-02-20, latest possible)", () => {
  assert.equal(zodiacYearForDate("1985-02-19"), 1984); // Wood Rat year still
  assert.equal(zodiacYearForDate("1985-02-20"), 1985); // Wood Ox begins
  assert.equal(animalForZodiacYear(1984), "Rat");
  assert.equal(animalForZodiacYear(1985), "Ox");
});

test("Sexagenary anchors: 1924 and 1984 are Yang Wood Rat years", () => {
  assert.equal(animalForZodiacYear(1924), "Rat");
  assert.deepEqual(stemForZodiacYear(1924), { element: "Wood", polarity: "Yang", stemIndex: 0 });
  assert.equal(animalForZodiacYear(1984), "Rat");
  assert.equal(stemForZodiacYear(1984).element, "Wood");
  assert.equal(animalForZodiacYear(2027), "Goat");
  assert.deepEqual(stemForZodiacYear(2027), { element: "Fire", polarity: "Yin", stemIndex: 3 });
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

test("Secret friends: Horse↔Goat, Rat↔Ox, Snake↔Monkey", () => {
  assert.equal(secretFriend("Horse"), "Goat");
  assert.equal(secretFriend("Goat"), "Horse");
  assert.equal(secretFriend("Rat"), "Ox");
  assert.equal(secretFriend("Snake"), "Monkey");
  assert.equal(secretFriend("Tiger"), "Pig");
});

test("Clash signs are six apart: Horse↔Rat, Goat↔Ox", () => {
  assert.equal(clashSign("Horse"), "Rat");
  assert.equal(clashSign("Rat"), "Horse");
  assert.equal(clashSign("Goat"), "Ox");
});

test("Trine of the Horse is Tiger–Horse–Dog", () => {
  assert.deepEqual(trineGroup("Horse"), ["Tiger", "Horse", "Dog"]);
  assert.deepEqual(trineGroup("Goat"), ["Rabbit", "Goat", "Pig"]);
});

test("relationBetween covers all five relations for the Horse", () => {
  assert.equal(relationBetween("Horse", "Horse"), "own-sign");
  assert.equal(relationBetween("Horse", "Goat"), "secret-friend");
  assert.equal(relationBetween("Horse", "Dog"), "trine");
  assert.equal(relationBetween("Horse", "Rat"), "clash");
  assert.equal(relationBetween("Horse", "Snake"), "neutral");
});

test("Element relations follow the generating/controlling cycles", () => {
  assert.equal(elementRelation("Water", "Water"), "same");
  assert.equal(elementRelation("Water", "Metal"), "year-feeds-you"); // Metal generates Water
  assert.equal(elementRelation("Water", "Wood"), "you-feed-year"); // Water generates Wood
  assert.equal(elementRelation("Water", "Earth"), "year-controls-you"); // Earth controls Water
  assert.equal(elementRelation("Water", "Fire"), "you-control-year"); // Water controls Fire
});

/* ------------------------------------------------------------------ */
/* GOLDEN outlook: Water Horse read against 2027 (Fire Goat)           */
/* ------------------------------------------------------------------ */

test("GOLDEN outlook: Horse in 2027 → secret-friend year, Fire controls Water", () => {
  const p = chineseProfile("2003-01-07");
  const o = yearOutlook(p, 2027);
  assert.equal(o.animal, "Goat");
  assert.equal(o.element, "Fire");
  assert.equal(o.relation, "secret-friend");
  // Fire is controlled BY Water, so from the year's side: the profile
  // controls the year element.
  assert.equal(o.elementRelation, "you-control-year");
  assert.equal(o.era, "TRADITIONAL");
  assert.ok(o.source.length > 0);
});
