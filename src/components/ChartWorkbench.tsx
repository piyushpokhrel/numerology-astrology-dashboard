"use client";

/**
 * Chart settings workbench — turns a stored profile into the exact
 * inputs the astro engines need: a UTC instant and geographic
 * coordinates.
 *
 * The profile stores birth place as text (what a user can post); a
 * chart needs coordinates, so the user confirms the place here:
 * a preset city (which sets lat / lon / standard UTC offset) or custom
 * values. The UTC offset must be the one in force on the BIRTH DATE
 * (daylight-saving included) — this is stated on the form, because a
 * wrong offset silently moves the ascendant.
 *
 * Settings persist in localStorage; the computed instant is derived
 * deterministically from profile + settings.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useProfile } from "./ProfileProvider";
import { Card, Field, Input } from "./ui";
import type { ChartInput } from "@/lib/western";

export interface CityPreset {
  id: string;
  label: string;
  latitude: number;
  longitudeEast: number;
  utcOffset: number;
}

export const CITY_PRESETS: readonly CityPreset[] = [
  { id: "toronto", label: "Toronto, Canada", latitude: 43.65, longitudeEast: -79.38, utcOffset: -5 },
  { id: "kathmandu", label: "Kathmandu, Nepal", latitude: 27.71, longitudeEast: 85.32, utcOffset: 5.75 },
  { id: "delhi", label: "New Delhi, India", latitude: 28.61, longitudeEast: 77.21, utcOffset: 5.5 },
  { id: "newyork", label: "New York, USA", latitude: 40.71, longitudeEast: -74.01, utcOffset: -5 },
  { id: "london", label: "London, UK", latitude: 51.51, longitudeEast: -0.13, utcOffset: 0 },
];

const SETTINGS_KEY = "astro-numerology:chart-settings:v1";

export interface ChartSettings {
  cityId: string;
  latitude: string;
  longitudeEast: string;
  utcOffset: string;
  timeOverride: string;
}

type Settings = ChartSettings;

const DEFAULT_SETTINGS: Settings = {
  cityId: "toronto",
  latitude: "43.65",
  longitudeEast: "-79.38",
  utcOffset: "-5",
  timeOverride: "",
};

export function loadChartSettings(): ChartSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ChartSettings>) };
  } catch {
    /* defaults */
  }
  return DEFAULT_SETTINGS;
}

/**
 * Derive the engine input from a profile + settings. Returns null when
 * the settings are not valid numbers. Used by the workbench form, the
 * dashboard summary and the unified report — one derivation, everywhere.
 */
export function chartInputFor(
  profile: { dob: string; birthTime?: string },
  settings: ChartSettings,
): { input: ChartInput; birthTimeUsed: string; timeIsExact: boolean } | null {
  const latitude = Number(settings.latitude);
  const longitudeEast = Number(settings.longitudeEast);
  const utcOffset = Number(settings.utcOffset);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitudeEast) || !Number.isFinite(utcOffset)) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitudeEast < -180 || longitudeEast > 180) return null;
  const birthTimeUsed = settings.timeOverride || profile.birthTime || "12:00";
  const [y, m, d] = profile.dob.split("-").map(Number);
  const [hh, mm] = birthTimeUsed.split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - utcOffset * 3600_000;
  return {
    input: { utc: new Date(utcMs), latitude, longitudeEast },
    birthTimeUsed,
    timeIsExact: Boolean(settings.timeOverride || profile.birthTime),
  };
}

export function ChartWorkbench({
  children,
}: {
  children: (input: ChartInput, meta: { birthTimeUsed: string; timeIsExact: boolean }) => ReactNode;
}) {
  const { profile } = useProfile();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loadedSettings, setLoadedSettings] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* keep defaults */
    }
    setLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (loadedSettings) {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, loadedSettings]);

  const derived = useMemo(
    () => (profile ? chartInputFor(profile, settings) : null),
    [profile, settings],
  );
  const input = derived?.input ?? null;
  const birthTimeUsed = derived?.birthTimeUsed ?? "12:00";
  const timeIsExact = derived?.timeIsExact ?? false;

  function pickCity(id: string) {
    const city = CITY_PRESETS.find((c) => c.id === id);
    if (!city) {
      setSettings((s) => ({ ...s, cityId: "custom" }));
      return;
    }
    setSettings((s) => ({
      ...s,
      cityId: id,
      latitude: String(city.latitude),
      longitudeEast: String(city.longitudeEast),
      utcOffset: String(city.utcOffset),
    }));
  }

  if (!profile) return null;

  return (
    <div>
      <div className="print:hidden">
      <Card title="Chart settings" subtitle="Confirm the birth place coordinates and time — the engines run on these" className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Birth place preset">
            <select
              value={settings.cityId}
              onChange={(e) => pickCity(e.target.value)}
              className="w-full rounded-lg border border-line bg-night px-3 py-2.5 text-sm text-moon focus:border-gold/60 focus:outline-none"
            >
              {CITY_PRESETS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
              <option value="custom">Custom coordinates</option>
            </select>
          </Field>
          <Field label="Latitude (−90…90)">
            <Input
              value={settings.latitude}
              onChange={(e) => setSettings((s) => ({ ...s, latitude: e.target.value, cityId: "custom" }))}
              inputMode="decimal"
            />
          </Field>
          <Field label="Longitude (east +)">
            <Input
              value={settings.longitudeEast}
              onChange={(e) => setSettings((s) => ({ ...s, longitudeEast: e.target.value, cityId: "custom" }))}
              inputMode="decimal"
            />
          </Field>
          <Field label="UTC offset on birth date" hint="Include daylight-saving if it applied.">
            <Input
              value={settings.utcOffset}
              onChange={(e) => setSettings((s) => ({ ...s, utcOffset: e.target.value }))}
              inputMode="decimal"
              placeholder="e.g. -5 or 5.75"
            />
          </Field>
          <Field label="Birth time (HH:MM)" hint={profile.birthTime ? `Profile has ${profile.birthTime}` : "Not on profile — 12:00 assumed"}>
            <Input
              type="time"
              value={settings.timeOverride}
              onChange={(e) => setSettings((s) => ({ ...s, timeOverride: e.target.value }))}
            />
          </Field>
        </div>
        {!timeIsExact && (
          <p className="mt-3 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs leading-relaxed text-amber">
            No exact birth time is set, so 12:00 (noon) is assumed. Planet
            signs are barely affected, but the Ascendant, houses and the
            Moon's exact degree need the real time — add it here or via
            Edit profile before reading those.
          </p>
        )}
        {input && (
          <p className="mt-3 text-xs text-fog">
            Chart instant (UTC): <span className="text-mist">{input.utc.toISOString()}</span> —
            local birth time {birthTimeUsed} at UTC offset {settings.utcOffset}h,
            latitude {settings.latitude}, longitude {settings.longitudeEast}.
          </p>
        )}
      </Card>
      </div>

      {input ? (
        children(input, { birthTimeUsed, timeIsExact })
      ) : (
        <Card>
          <p className="text-sm text-rose">
            The chart settings above are not valid numbers yet — fix the
            highlighted fields and the chart will compute.
          </p>
        </Card>
      )}
    </div>
  );
}
