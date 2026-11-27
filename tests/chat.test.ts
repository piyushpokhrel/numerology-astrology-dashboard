/**
 * Milestone 11 — chat tools, fallback parser, credit accounting.
 *
 * Golden: Piyush's "my personal year for 2027" → 1.
 * Tools must return engine-identical results (compared against direct
 * lib calls). Credits: 7/month free (as amended), monthly reset by
 * stamp, unlimited bypass when subscribed; the fallback calculator
 * mode is still the chat and its answers come from the same tools.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canSend,
  creditsHeader,
  deduct,
  freshCreditState,
  rollover,
  FREE_CREDITS_PER_MONTH,
  SUBSCRIPTION_PRICE_CAD,
} from "../src/lib/chat-credits.ts";
import {
  calculatorAnswer,
  toolPersonalCycles,
  type ChatContext,
} from "../src/lib/chat-tools.ts";
import { personalYear } from "../src/lib/numerology.ts";
import type { Profile } from "../src/lib/profile.ts";

const PROFILE: Profile = {
  fullName: "Piyush Pokhrel",
  dob: "2003-01-07",
  birthTime: "09:50",
  birthPlace: "Ghorahi, Dang, Nepal",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

const CTX: ChatContext = {
  profile: PROFILE,
  chartInput: { utc: new Date("2003-01-07T04:05:00Z"), latitude: 28.0483, longitudeEast: 82.4866 },
  today: "2026-11-27",
};

test("CHAT CREDITS: 7 per month, deduct per reply, exhausted at 0", () => {
  assert.equal(FREE_CREDITS_PER_MONTH, 7);
  assert.equal(SUBSCRIPTION_PRICE_CAD, 15);
  let s = freshCreditState(new Date("2026-11-27T10:00:00"));
  assert.equal(creditsHeader(s, new Date("2026-11-27T10:00:00")), "Credits: 7 / 7 this month");
  for (let i = 0; i < 7; i++) {
    const next = deduct(s, new Date("2026-11-27T10:00:00"));
    assert.ok(next, `deduction ${i + 1}`);
    s = next!;
  }
  assert.equal(canSend(s, new Date("2026-11-27T10:00:00")), false);
  assert.equal(deduct(s, new Date("2026-11-27T10:00:00")), null);
});

test("CHAT CREDITS: monthly reset by stamp; subscribed bypasses deduction", () => {
  let s = freshCreditState(new Date("2026-11-27T10:00:00"));
  s = deduct(s, new Date("2026-11-27T10:00:00"))!;
  s = deduct(s, new Date("2026-11-27T10:00:00"))!;
  const december = rollover(s, new Date("2026-12-01T09:00:00"));
  assert.equal(december.used, 0);
  assert.equal(december.monthStamp, "2026-12");
  const sub = { ...freshCreditState(new Date("2026-11-27T10:00:00")), subscribed: true };
  assert.equal(creditsHeader(sub, new Date("2026-11-27T10:00:00")), "Unlimited");
  assert.equal(deduct(sub, new Date("2026-11-27T10:00:00"))!.used, 0);
  assert.equal(canSend(sub, new Date("2026-11-27T10:00:00")), true);
});

test("CHAT TOOLS: tool results are engine-identical", () => {
  const t = toolPersonalCycles("2003-01-07", "2027-06-01");
  assert.equal(personalYear("2003-01-07", "2027-06-01"), 1);
  assert.match(t.text, /Personal Year 1/);
});

test("CHAT FALLBACK: intent table — sample questions hit the right tools with the right figures", () => {
  const cases: Array<[string, string, RegExp]> = [
    ["my personal year for 2027", "cycles", /Personal Year 1/],
    ["What is my life path and how is it derived?", "core", /Life Path 4/],
    ["check the name Aurora Labs", "name-check", /score \d+\/100/],
    ["What dasha am I in?", "dasha", /Mahadasha/],
    ["Show today's Panchanga", "panchanga", /Tithi/],
    ["panchanga for Dec 22", "panchanga", /Panchanga for 2026-12-22/],
    ["Who is my Ishta Devta?", "ishta", /Atmakaraka/],
    ["what is my chinese sign?", "chinese", /Water Horse/],
  ];
  for (const [q, intent, pattern] of cases) {
    const a = calculatorAnswer(q, CTX);
    assert.equal(a.intent, intent, `"${q}" → ${a.intent}`);
    assert.match(a.text, pattern, `"${q}" text`);
    assert.ok(a.note.length > 3, `"${q}" carries a tool note`);
  }
});

test("CHAT FALLBACK: no profile → honest guidance, never a crash or an invented number", () => {
  const guest: ChatContext = { profile: null, chartInput: null, today: "2026-11-27" };
  const a = calculatorAnswer("What is my life path?", guest);
  assert.match(a.text, /need an active profile/i);
  const b = calculatorAnswer("life path for 1990-05-15", guest);
  assert.equal(b.intent, "life-path");
  assert.match(b.text, /Life Path for 1990-05-15/);
});
