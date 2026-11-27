import { test } from "node:test";
import assert from "node:assert/strict";

import { checkNameHarmony } from "../src/lib/namecheck.ts";

/*
 * Hand-verified against the documented scoring:
 *   per system: root == Life Path base → +30; same triad → +15;
 *   root == Destiny base → +20. Verdicts: ≥65 harmonious,
 *   35–64 workable, <35 friction.
 *
 * Founder "Piyush Pokhrel", DOB 2003-01-07:
 *   Life Path = 4 (golden), Destiny (Pythagorean) = 3 (chunk-1 tests).
 */

test("Name 'D': root 4 in BOTH systems → exact Life Path match twice → 60, workable", () => {
  // Chaldean D = 4; Pythagorean D = 4. +30 + +30 = 60. Destiny 3: no match.
  const r = checkNameHarmony("D", "Piyush Pokhrel", "2003-01-07");
  assert.equal(r.chaldean.root, 4);
  assert.equal(r.pythagorean.root, 4);
  assert.equal(r.score, 60);
  assert.equal(r.verdict, "workable");
  assert.equal(r.lifePath, 4);
  assert.equal(r.destiny, 3);
});

test("Name 'A': root 1 in both systems → triad of 4 ({1,4,7}) twice → 30, friction", () => {
  // Chaldean A = 1; Pythagorean A = 1. 1 shares triad {1,4,7} with LP 4:
  // +15 + +15 = 30. Destiny 3: no match (1 is in {1,4,7}, but the
  // Destiny rule is exact-match only).
  const r = checkNameHarmony("A", "Piyush Pokhrel", "2003-01-07");
  assert.equal(r.chaldean.root, 1);
  assert.equal(r.pythagorean.root, 1);
  assert.equal(r.score, 30);
  assert.equal(r.verdict, "friction");
});

test("Deterministic: identical inputs give identical results, every run", () => {
  const a = checkNameHarmony("Holisticseason", "Piyush Pokhrel", "2003-01-07");
  const b = checkNameHarmony("Holisticseason", "Piyush Pokhrel", "2003-01-07");
  assert.deepEqual(a, b);
  assert.ok(a.score >= 0 && a.score <= 100);
  assert.ok(a.reasons.length >= 2);
});

test("Reasons are always produced for both systems", () => {
  const r = checkNameHarmony("Neo", "Piyush Pokhrel", "2003-01-07");
  assert.ok(r.chaldean.reasons.length >= 1);
  assert.ok(r.pythagorean.reasons.length >= 1);
  assert.equal(r.reasons.length, r.chaldean.reasons.length + r.pythagorean.reasons.length);
});
