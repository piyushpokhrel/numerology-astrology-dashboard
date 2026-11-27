import { test } from "node:test";
import assert from "node:assert/strict";

import {
  nameCheckSchema,
  profileSchema,
  zodFieldErrors,
} from "../src/lib/schemas.ts";

const VALID = {
  fullName: "Piyush Pokhrel",
  dob: "2003-01-07",
  birthTime: "",
  birthPlace: "Toronto, Canada",
};

test("A valid profile passes, with trimming applied", () => {
  const r = profileSchema.safeParse({ ...VALID, fullName: "  Piyush Pokhrel  " });
  assert.ok(r.success);
  if (r.success) assert.equal(r.data.fullName, "Piyush Pokhrel");
});

test("Birth time is optional but strict when present", () => {
  assert.ok(profileSchema.safeParse({ ...VALID, birthTime: "07:45" }).success);
  assert.ok(profileSchema.safeParse({ ...VALID, birthTime: undefined }).success);
  const bad = profileSchema.safeParse({ ...VALID, birthTime: "25:99" });
  assert.ok(!bad.success);
  if (!bad.success) assert.ok(zodFieldErrors(bad.error).birthTime?.length);
});

test("Names with digits or symbols are rejected with a field error", () => {
  const r = profileSchema.safeParse({ ...VALID, fullName: "Piyush 123" });
  assert.ok(!r.success);
  if (!r.success) assert.ok(zodFieldErrors(r.error).fullName?.length);
});

test("Too-short and too-long names are rejected", () => {
  assert.ok(!profileSchema.safeParse({ ...VALID, fullName: "P" }).success);
  assert.ok(!profileSchema.safeParse({ ...VALID, fullName: "A".repeat(81) }).success);
});

test("Future DOB is rejected", () => {
  const r = profileSchema.safeParse({ ...VALID, dob: "2999-01-01" });
  assert.ok(!r.success);
  if (!r.success) {
    const errs = zodFieldErrors(r.error);
    assert.ok(errs.dob?.some((m) => m.includes("future")));
  }
});

test("Pre-1900 DOB is rejected", () => {
  assert.ok(!profileSchema.safeParse({ ...VALID, dob: "1899-12-31" }).success);
});

test("Impossible calendar dates are rejected (Feb 30, month 13)", () => {
  assert.ok(!profileSchema.safeParse({ ...VALID, dob: "2003-02-30" }).success);
  assert.ok(!profileSchema.safeParse({ ...VALID, dob: "2003-13-01" }).success);
  // …while a real leap day passes.
  assert.ok(profileSchema.safeParse({ ...VALID, dob: "2004-02-29" }).success);
});

test("Birth place bounds: 2–120 chars", () => {
  assert.ok(!profileSchema.safeParse({ ...VALID, birthPlace: "X" }).success);
  assert.ok(!profileSchema.safeParse({ ...VALID, birthPlace: "Y".repeat(121) }).success);
  assert.ok(profileSchema.safeParse({ ...VALID, birthPlace: "Ktm" }).success);
});

test("Name-check schema: single-letter names are legal, empty is not", () => {
  const base = { founderName: "Piyush Pokhrel", founderDob: "2003-01-07" };
  assert.ok(nameCheckSchema.safeParse({ ...base, name: "D" }).success);
  assert.ok(!nameCheckSchema.safeParse({ ...base, name: "" }).success);
  assert.ok(!nameCheckSchema.safeParse({ ...base, name: "Shop 24" }).success);
  assert.ok(!nameCheckSchema.safeParse({ ...base, founderDob: "2003-02-30" }).success);
});
