/**
 * Name harmony checker — scores a candidate name (business or personal)
 * against the founder's birth numbers.
 *
 * SCORING (documented, deterministic, 100 points total — 50 per system):
 * For each system (Chaldean, Pythagorean) take the candidate name's root
 * and reduce master numbers to their single-digit base for comparison:
 *   +30  the name root EQUALS the founder's Life Path base
 *   +15  the name root sits in the same classic triad as the Life Path
 *        base — the traditional compatibility families {1,4,7},
 *        {2,5,8}, {3,6,9} (only when not an exact match)
 *   +20  the name root EQUALS the founder's Destiny base (Pythagorean
 *        destiny, the standard for this number, used for both systems)
 * Verdict bands:
 *   score ≥ 65 → "harmonious" (green)
 *   35 – 64    → "workable"   (amber)
 *   < 35       → "friction"   (red)
 *
 * The Chaldean COMPOUND number is reported alongside the root: in
 * Chaldean practice the compound carries its own traditional reading,
 * so it is data the founder should see, even though the score uses the
 * root for comparability across systems.
 */

import {
  analyzeName,
  destinyNumber,
  displayNumber,
  lifePathNumber,
  reduceNumber,
} from "./numerology.ts";

export type Verdict = "harmonious" | "workable" | "friction";

export interface SystemScore {
  system: "chaldean" | "pythagorean";
  compound: number;
  root: number;
  points: number;
  reasons: string[];
}

export interface NameCheckResult {
  name: string;
  founderName: string;
  founderDob: string;
  lifePath: number;
  destiny: number;
  chaldean: SystemScore;
  pythagorean: SystemScore;
  score: number;
  verdict: Verdict;
  reasons: string[];
}

const TRIADS: ReadonlyArray<readonly number[]> = [
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
];

function base(n: number): number {
  return reduceNumber(n, false);
}

function sameTriad(a: number, b: number): boolean {
  return TRIADS.some((t) => t.includes(a) && t.includes(b));
}

function scoreSystem(
  system: "chaldean" | "pythagorean",
  name: string,
  lifePathBase: number,
  destinyBase: number,
): SystemScore {
  const analysis = analyzeName(name, system);
  const rootBase = base(analysis.root);
  const label = system === "chaldean" ? "Chaldean" : "Pythagorean";
  let points = 0;
  const reasons: string[] = [];

  if (rootBase === lifePathBase) {
    points += 30;
    reasons.push(
      `${label} root ${displayNumber(analysis.root)} matches the founder's Life Path ${lifePathBase} exactly (+30).`,
    );
  } else if (sameTriad(rootBase, lifePathBase)) {
    points += 15;
    reasons.push(
      `${label} root ${displayNumber(analysis.root)} shares a harmony triad with Life Path ${lifePathBase} (+15).`,
    );
  } else {
    reasons.push(
      `${label} root ${displayNumber(analysis.root)} has no direct Life Path resonance (+0).`,
    );
  }

  if (rootBase === destinyBase) {
    points += 20;
    reasons.push(
      `${label} root ${displayNumber(analysis.root)} also matches the founder's Destiny ${destinyBase} (+20).`,
    );
  }

  return { system, compound: analysis.compound, root: analysis.root, points, reasons };
}

export function checkNameHarmony(
  name: string,
  founderName: string,
  founderDob: string,
): NameCheckResult {
  const lifePath = lifePathNumber(founderDob);
  const destiny = destinyNumber(founderName, "pythagorean");
  const lifePathBase = base(lifePath);
  const destinyBase = base(destiny);

  const chaldean = scoreSystem("chaldean", name, lifePathBase, destinyBase);
  const pythagorean = scoreSystem("pythagorean", name, lifePathBase, destinyBase);

  const score = chaldean.points + pythagorean.points;
  const verdict: Verdict = score >= 65 ? "harmonious" : score >= 35 ? "workable" : "friction";

  return {
    name,
    founderName,
    founderDob,
    lifePath,
    destiny,
    chaldean,
    pythagorean,
    score,
    verdict,
    reasons: [...chaldean.reasons, ...pythagorean.reasons],
  };
}
