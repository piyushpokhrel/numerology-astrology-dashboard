/**
 * Locations — broad and optional (cross-cutting amendment, Nov 2026).
 *
 * Rules implemented here and in the surfaces that use this module:
 *  - BROAD: any place on Earth can be used — presets are quick picks,
 *    never a limit; manual latitude/longitude entry always exists, so
 *    no place is impossible (a bundled settlements type-ahead can be
 *    layered on later; the manual route is the guarantee).
 *  - OPTIONAL: location is never required. Location-independent
 *    results (numerology, Chinese year sign, name checker, dasha by
 *    date) run at full precision with no location at all.
 *    Location-dependent results (Ascendant, houses, sunrise timings)
 *    fall back to a clearly LABELLED default (Toronto) with
 *    `approximate: true`, following the same honesty pattern as the
 *    noon birth-time assumption.
 */

export interface ResolvedLocation {
  label: string;
  latitude: number;
  longitudeEast: number;
  /** Hours east of UTC for chart-input purposes (workbench convention). */
  utcOffsetHours: number;
  /** IANA zone when known (Panchanga civil-date conversion). */
  timeZone?: string;
  source: "preset" | "manual" | "default";
  approximate: boolean;
}

export const DEFAULT_LOCATION: ResolvedLocation = {
  label: "Toronto, Canada",
  latitude: 43.65,
  longitudeEast: -79.38,
  utcOffsetHours: -5,
  timeZone: "America/Toronto",
  source: "default",
  approximate: true,
};

export interface PlacePreset extends Omit<ResolvedLocation, "source" | "approximate"> {
  id: string;
}

export const PLACE_PRESETS: ReadonlyArray<PlacePreset> = [
  { id: "toronto", label: "Toronto, Canada", latitude: 43.65, longitudeEast: -79.38, utcOffsetHours: -5, timeZone: "America/Toronto" },
  { id: "ghorahi", label: "Ghorahi, Dang, Nepal", latitude: 28.0483, longitudeEast: 82.4866, utcOffsetHours: 5.75, timeZone: "Asia/Kathmandu" },
  { id: "kathmandu", label: "Kathmandu, Nepal", latitude: 27.71, longitudeEast: 85.32, utcOffsetHours: 5.75, timeZone: "Asia/Kathmandu" },
  { id: "delhi", label: "New Delhi, India", latitude: 28.61, longitudeEast: 77.21, utcOffsetHours: 5.5, timeZone: "Asia/Kolkata" },
  { id: "newyork", label: "New York, USA", latitude: 40.71, longitudeEast: -74.01, utcOffsetHours: -5, timeZone: "America/New_York" },
  { id: "london", label: "London, UK", latitude: 51.51, longitudeEast: -0.13, utcOffsetHours: 0, timeZone: "Europe/London" },
];

/**
 * Resolve whatever the user gave into a usable location. Empty input
 * is NOT an error: it resolves to the labelled default.
 */
export function resolveLocation(input?: {
  presetId?: string;
  label?: string;
  latitude?: number;
  longitudeEast?: number;
  utcOffsetHours?: number;
  timeZone?: string;
} | null): ResolvedLocation {
  if (input?.presetId) {
    const preset = PLACE_PRESETS.find((p) => p.id === input.presetId);
    if (preset) return { ...preset, source: "preset", approximate: false };
  }
  if (
    typeof input?.latitude === "number" && Number.isFinite(input.latitude) &&
    typeof input?.longitudeEast === "number" && Number.isFinite(input.longitudeEast)
  ) {
    return {
      label: input.label?.trim() || "Custom location",
      latitude: input.latitude,
      longitudeEast: input.longitudeEast,
      utcOffsetHours: typeof input.utcOffsetHours === "number" ? input.utcOffsetHours : 0,
      timeZone: input.timeZone,
      source: "manual",
      approximate: false,
    };
  }
  return { ...DEFAULT_LOCATION };
}

/** True when coordinates are usable numbers in range. */
export function validCoordinates(latitude: number, longitudeEast: number): boolean {
  return (
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitudeEast) && longitudeEast >= -180 && longitudeEast <= 180
  );
}
