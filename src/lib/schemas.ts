/**
 * Zod validation schemas — the single gate every user-posted credential
 * passes before it can reach an engine or be stored.
 *
 * Used in BOTH places:
 *   - client forms (instant inline field errors), and
 *   - the /api/profile and /api/name-check route handlers (server-side
 *     re-validation — client checks are UX, never the security boundary).
 *
 * Rules:
 *   fullName / founderName — letters, spaces, hyphens, apostrophes and
 *     periods only; 2–80 chars after trimming.
 *   dob / founderDob — a REAL calendar date in YYYY-MM-DD, not in the
 *     future, not before 1900-01-01.
 *   birthTime — optional; when present, strict 24h "HH:MM".
 *   birthPlace — 2–120 chars after trimming.
 *   checkName (the name being scored) — same letter rules, 1–80 chars
 *     (single-letter business names are legal inputs, e.g. "D").
 */

import { z } from "zod";

/** Field-level errors keyed by field name, as returned to forms. */
export type FieldErrors = Record<string, string[]>;

/** Group a ZodError's issues by top-level field name. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/;

export const fullNameSchema = z
  .string({ error: "Full name is required." })
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(80, "Full name must be at most 80 characters.")
  .regex(NAME_PATTERN, "Use letters, spaces, hyphens, apostrophes and periods only.")
  .refine((v) => /[A-Za-z]{2,}/.test(v.replace(/[^A-Za-z]/g, "")), {
    message: "Full name must contain at least 2 letters.",
  });

/** Strict ISO date that must exist on the calendar and be a plausible DOB. */
export const dobSchema = z
  .string({ error: "Date of birth is required." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.")
  .superRefine((value, ctx) => {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const isReal =
      dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    if (!isReal) {
      ctx.addIssue({
        code: "custom",
        message: "That is not a real calendar date.",
      });
      return;
    }
    if (y < 1900) {
      ctx.addIssue({
        code: "custom",
        message: "Date of birth must be in 1900 or later.",
      });
      return;
    }
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (dt.getTime() > todayUtc) {
      ctx.addIssue({
        code: "custom",
        message: "Date of birth cannot be in the future.",
      });
    }
  });

export const birthTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, HH:MM.")
  .optional()
  .or(z.literal(""));

/**
 * Birth place is OPTIONAL (locations amendment, Nov 2026): a profile
 * saves with no place at all. Location-dependent results then run on
 * the labelled default; location-free results are exact regardless.
 * When given, it is free text (any place on Earth) — coordinates are
 * set separately in the chart settings, where manual lat/lon entry
 * always exists.
 */
export const birthPlaceSchema = z
  .string()
  .trim()
  .max(120, "Birth place must be at most 120 characters.")
  .refine((v) => v.length === 0 || v.length >= 2, "Birth place must be at least 2 characters when given.")
  .optional()
  .or(z.literal(""));

export const profileSchema = z.object({
  fullName: fullNameSchema,
  dob: dobSchema,
  birthTime: birthTimeSchema,
  birthPlace: birthPlaceSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const checkNameSchema = z
  .string({ error: "A name to check is required." })
  .trim()
  .min(1, "Enter a name to check.")
  .max(80, "Name must be at most 80 characters.")
  .regex(NAME_PATTERN, "Use letters, spaces, hyphens, apostrophes and periods only.")
  .refine((v) => /[A-Za-z]/.test(v), {
    message: "The name must contain at least one letter.",
  });

export const nameCheckSchema = z.object({
  name: checkNameSchema,
  founderName: fullNameSchema,
  founderDob: dobSchema,
});

export type NameCheckInput = z.infer<typeof nameCheckSchema>;
