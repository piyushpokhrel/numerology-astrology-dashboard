"use client";

/**
 * Profile context — the single source of truth every page reads.
 *
 * Actualization behaviour:
 *   - The profile is loaded from localStorage once on mount.
 *   - `today` is captured from the client's clock at mount (so pages can
 *     be prerendered without reading the time on the server) and can be
 *     re-captured at any moment via `refresh()` — the dashboard's
 *     Refresh button — which also bumps `refreshCount` so views can
 *     show when the last recomputation happened.
 *   - `applyProfile()` stamps createdAt/updatedAt and persists; every
 *     page reading this context re-renders with the correction at once.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearProfile,
  loadProfile,
  saveProfile,
  stampProfile,
  todayISO,
  type Profile,
} from "@/lib/profile";
import type { ProfileInput } from "@/lib/schemas";

interface ProfileContextValue {
  profile: Profile | null;
  /** False until the localStorage read has happened on the client. */
  loaded: boolean;
  /** Today's date (ISO, local) — the anchor for all personal cycles. */
  today: string;
  /** Increments on every manual refresh. */
  refreshCount: number;
  /** ISO datetime of the last refresh, for the "recomputed at" stamp. */
  refreshedAt: string | null;
  refresh: () => void;
  applyProfile: (input: ProfileInput) => Profile;
  removeProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState<string>("");
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setToday(todayISO());
    setLoaded(true);
  }, []);

  const refresh = useCallback(() => {
    setToday(todayISO());
    setRefreshCount((c) => c + 1);
    setRefreshedAt(new Date().toISOString());
  }, []);

  const applyProfile = useCallback(
    (input: ProfileInput): Profile => {
      const stamped = stampProfile(input, profile);
      saveProfile(stamped);
      setProfile(stamped);
      return stamped;
    },
    [profile],
  );

  const removeProfile = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loaded,
      today,
      refreshCount,
      refreshedAt,
      refresh,
      applyProfile,
      removeProfile,
    }),
    [profile, loaded, today, refreshCount, refreshedAt, refresh, applyProfile, removeProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
