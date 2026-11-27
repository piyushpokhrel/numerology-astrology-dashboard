/**
 * Profile persistence + actualization.
 *
 * A profile is the set of credentials a user posts (name, DOB, birth
 * time, birth place). It persists in localStorage under a versioned key
 * and carries two timestamps:
 *
 *   createdAt — when the profile was first saved; never changes.
 *   updatedAt — bumped on EVERY save (create or edit), so the UI can
 *               always show a truthful "Last updated …" stamp.
 *
 * Actualization rules enforced by the app:
 *   - Personal year/month/day are NEVER stored. They are recomputed
 *     from the stored DOB against the CURRENT date at view time, so
 *     they can never go stale.
 *   - Editing any credential re-validates (zod) and re-stamps, and
 *     because every page reads the profile from this one store, the
 *     correction is reflected everywhere immediately.
 */

import type { ProfileInput } from "./schemas";

export interface Profile extends ProfileInput {
  /** Birth time normalised: undefined when the user left it blank. */
  birthTime?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export const PROFILE_STORAGE_KEY = "astro-numerology:profile:v1";

/** Normalise validated form input into a stored profile. */
export function stampProfile(input: ProfileInput, previous?: Profile | null): Profile {
  const now = new Date().toISOString();
  return {
    fullName: input.fullName,
    dob: input.dob,
    birthTime: input.birthTime ? input.birthTime : undefined,
    birthPlace: input.birthPlace,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed || typeof parsed.fullName !== "string" || typeof parsed.dob !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

/* ------------------------------------------------------------------ */
/* Date helpers (local time, ISO strings without timezone surprises)   */
/* ------------------------------------------------------------------ */

export function todayISO(from: Date = new Date()): string {
  const y = from.getFullYear();
  const m = String(from.getMonth() + 1).padStart(2, "0");
  const d = String(from.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
