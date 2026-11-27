import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeName,
  attitudeNumber,
  birthdayNumber,
  chaldeanNameNumber,
  coreProfile,
  destinyNumber,
  letterValue,
  lifePath,
  lifePathNumber,
  nameNumber,
  personalDay,
  personalMonth,
  personalYear,
  personalityNumber,
  pythagoreanNameNumber,
  reduceNumber,
  soulUrgeNumber,
} from "../src/lib/numerology.ts";

/* ------------------------------------------------------------------ */
/* GOLDEN CASES (required)                                             */
/* ------------------------------------------------------------------ */

test("GOLDEN: DOB 2003-01-07 → life path 4, birthday 7", () => {
  // Hand math (component method): month 1, day 7,
  // year 2003 → 2+0+0+3 = 5;  1 + 7 + 5 = 13 → 1+3 = 4.
  assert.equal(lifePathNumber("2003-01-07"), 4);
  assert.equal(birthdayNumber("2003-01-07"), 7);
  const lp = lifePath("2003-01-07");
  assert.equal(lp.monthComponent, 1);
  assert.equal(lp.dayComponent, 7);
  assert.equal(lp.yearComponent, 5);
  assert.equal(lp.compound, 13);
});

test("GOLDEN: DOB 2003-01-07, target year 2027 → personal year 1", () => {
  // Hand math: birth month 1 + birth day 7 + 2027 (2+0+2+7 = 11 → 2)
  // = 1 + 7 + 2 = 10 → 1.
  assert.equal(personalYear("2003-01-07", 2027), 1);
  assert.equal(personalYear("2003-01-07", "2027-06-15"), 1);
});

/* ------------------------------------------------------------------ */
/* Chaldean — hand-computed                                            */
/*                                                                     */
/* Chaldean table: 1=A,I,J,Q,Y  2=B,K,R  3=C,G,L,S  4=D,M,T           */
/*                 5=E,H,N,X    6=U,V,W  7=O,Z      8=F,P  (no 9)     */
/* ------------------------------------------------------------------ */

test("Chaldean hand-check: PIYUSH → compound 24, root 6", () => {
  // Hand math: P=8, I=1, Y=1, U=6, S=3, H=5
  // 8 + 1 + 1 + 6 + 3 + 5 = 24 (compound) → 2 + 4 = 6 (root).
  const { compound, root } = chaldeanNameNumber("PIYUSH");
  assert.equal(compound, 24);
  assert.equal(root, 6);
});

test("Chaldean hand-check: NEO → compound 17, root 8", () => {
  // Hand math: N=5, E=5, O=7 → 5 + 5 + 7 = 17 (compound) → 1 + 7 = 8 (root).
  const { compound, root } = chaldeanNameNumber("NEO");
  assert.equal(compound, 17);
  assert.equal(root, 8);
});

test("Chaldean table spot checks (incl. no 9s anywhere)", () => {
  assert.equal(letterValue("A", "chaldean"), 1);
  assert.equal(letterValue("Y", "chaldean"), 1);
  assert.equal(letterValue("R", "chaldean"), 2);
  assert.equal(letterValue("S", "chaldean"), 3);
  assert.equal(letterValue("T", "chaldean"), 4);
  assert.equal(letterValue("X", "chaldean"), 5);
  assert.equal(letterValue("W", "chaldean"), 6);
  assert.equal(letterValue("Z", "chaldean"), 7);
  assert.equal(letterValue("F", "chaldean"), 8);
  // No letter may carry the value 9 in Chaldean.
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    assert.notEqual(letterValue(ch, "chaldean"), 9, `letter ${ch}`);
  }
});

/* ------------------------------------------------------------------ */
/* Pythagorean                                                         */
/* ------------------------------------------------------------------ */

test("Pythagorean hand-check: PIYUSH → compound 35, root 8", () => {
  // Hand math (1–9 cycle): P=7, I=9, Y=7, U=3, S=1, H=8
  // 7 + 9 + 7 + 3 + 1 + 8 = 35 → 3 + 5 = 8.
  const { compound, root } = pythagoreanNameNumber("PIYUSH");
  assert.equal(compound, 35);
  assert.equal(root, 8);
});

test("Pythagorean table wraps every 9 letters", () => {
  assert.equal(letterValue("A", "pythagorean"), 1);
  assert.equal(letterValue("I", "pythagorean"), 9);
  assert.equal(letterValue("J", "pythagorean"), 1);
  assert.equal(letterValue("R", "pythagorean"), 9);
  assert.equal(letterValue("S", "pythagorean"), 1);
  assert.equal(letterValue("Z", "pythagorean"), 8);
});

/* ------------------------------------------------------------------ */
/* Master numbers                                                      */
/* ------------------------------------------------------------------ */

test("reduceNumber preserves masters only when asked", () => {
  assert.equal(reduceNumber(29, true), 11);
  assert.equal(reduceNumber(29, false), 2);
  assert.equal(reduceNumber(22, true), 22);
  assert.equal(reduceNumber(38, true), 11); // 38 → 11, stop
  assert.equal(reduceNumber(33, true), 33);
  assert.equal(reduceNumber(13, true), 4);
});

test("Life path master 11: DOB 1989-11-09", () => {
  // Hand math: month 11 (master, kept), day 9,
  // year 1989 → 1+9+8+9 = 27 → 9;  11 + 9 + 9 = 29 → 11 (master, kept).
  assert.equal(lifePathNumber("1989-11-09"), 11);
});

test("Life path master 22: DOB 1998-09-04", () => {
  // Hand math: month 9, day 4, year 1998 → 1+9+9+8 = 27 → 9;
  // 9 + 4 + 9 = 22 (master, kept).
  assert.equal(lifePathNumber("1998-09-04"), 22);
});

test("Birthday number preserves 11 (born on the 29th)", () => {
  assert.equal(birthdayNumber("2000-05-29"), 11);
  assert.equal(birthdayNumber("2000-05-22"), 22);
  assert.equal(birthdayNumber("2000-05-28"), 1); // 28 → 10 → 1
});

/* ------------------------------------------------------------------ */
/* Attitude, destiny, soul urge, personality                           */
/* ------------------------------------------------------------------ */

test("Attitude: 2003-01-07 → 1 + 7 = 8", () => {
  assert.equal(attitudeNumber("2003-01-07"), 8);
});

test("Destiny / soul urge / personality: 'Piyush Pokhrel' (Pythagorean)", () => {
  // Hand math:
  //   PIYUSH  = 7+9+7+3+1+8 = 35
  //   POKHREL = P7 O6 K2 H8 R9 E5 L3 = 40
  //   Destiny (all letters) = 35 + 40 = 75 → 12 → 3.
  assert.equal(destinyNumber("Piyush Pokhrel"), 3);
  //   Vowels: I9 + U3 + O6 + E5 = 23 → 5 (soul urge).
  assert.equal(soulUrgeNumber("Piyush Pokhrel"), 5);
  //   Consonants: 75 − 23 = 52 → 7 (personality).
  assert.equal(personalityNumber("Piyush Pokhrel"), 7);
  // Cross-check: soul urge + personality must re-reduce to destiny.
  assert.equal(reduceNumber(5 + 7, true), destinyNumber("Piyush Pokhrel"));
});

test("Name analysis: per-word compounds add up to the total compound", () => {
  const a = analyzeName("Piyush Pokhrel", "chaldean");
  const wordSum = a.words.reduce((acc, w) => acc + w.compound, 0);
  assert.equal(wordSum, a.compound);
  assert.equal(a.words.length, 2);
  assert.equal(nameNumber("Piyush", "chaldean"), 6); // same as golden PIYUSH
});

/* ------------------------------------------------------------------ */
/* Personal cycles                                                     */
/* ------------------------------------------------------------------ */

test("Personal month/day chain for 2003-01-07 in 2027", () => {
  // Personal year 2027 = 1 (golden case above).
  // Personal month for March 2027 = 1 + 3 = 4.
  assert.equal(personalMonth("2003-01-07", "2027-03-15"), 4);
  // Personal day for 2027-03-15 = 4 + (15 → 6) = 10 → 1.
  assert.equal(personalDay("2003-01-07", "2027-03-15"), 1);
});

test("Personal cycles never return master numbers", () => {
  for (let y = 2024; y <= 2032; y++) {
    const py = personalYear("1989-11-09", y);
    assert.ok(py >= 1 && py <= 9, `personal year ${py}`);
  }
});

/* ------------------------------------------------------------------ */
/* Core profile aggregator                                             */
/* ------------------------------------------------------------------ */

test("coreProfile ties the pieces together", () => {
  const p = coreProfile("Piyush Pokhrel", "2003-01-07", "2027-01-07");
  assert.equal(p.lifePath, 4);
  assert.equal(p.birthday, 7);
  assert.equal(p.attitude, 8);
  assert.equal(p.destinyPythagorean, 3);
  assert.equal(p.soulUrge, 5);
  assert.equal(p.personality, 7);
  // Chaldean full name by hand: PIYUSH = 24 (golden above);
  // POKHREL = P8 + O7 + K2 + H5 + R2 + E5 + L3 = 32; total compound 56 → 2.
  assert.equal(p.chaldeanName.compound, 56);
  assert.equal(p.chaldeanName.root, 2);
  assert.equal(p.personalYear, 1); // cycle date in 2027
});
