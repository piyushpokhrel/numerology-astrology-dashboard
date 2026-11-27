"use client";

/**
 * Personal cycles for the active profile, shown on the landing page.
 * Values are always computed against the CURRENT date at view time —
 * never stored — and carry a visible "calculated for" stamp with a
 * Refresh control. Renders nothing when no profile exists.
 */

import { useMemo, useState } from "react";
import { useProfile } from "./ProfileProvider";
import { Button, ButtonLink, Card, Stat, Tabs } from "./ui";
import { coreProfile, personalMonth, personalYear } from "@/lib/numerology";
import { numberKeyword } from "@/lib/meanings";
import { formatDateTime, formatLongDate } from "@/lib/profile";

export function HomeCycles() {
  const { profile, loaded, today, refresh, refreshedAt } = useProfile();
  const [tab, setTab] = useState("today");

  const data = useMemo(() => {
    if (!profile || !today) return null;
    const core = coreProfile(profile.fullName, profile.dob, today);
    const todayYear = Number(today.slice(0, 4));
    const nextYearValue = personalYear(profile.dob, todayYear + 1);
    const [ty, tm] = today.split("-").map(Number);
    const nextMonthDate =
      tm === 12
        ? `${ty + 1}-01-01`
        : `${ty}-${String(tm + 1).padStart(2, "0")}-01`;
    const nextMonthValue = personalMonth(profile.dob, nextMonthDate);
    return { core, nextYearValue, nextMonthValue, nextMonthDate, todayYear };
  }, [profile, today]);

  if (!loaded || !profile || !data) return null;

  return (
    <Card
      title={`${profile.fullName.split(" ")[0]}'s personal cycles`}
      subtitle={
        today
          ? `Calculated for ${formatLongDate(today)} — recomputed at view time, never stored`
          : undefined
      }
      action={
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={refresh} className="px-3 py-1.5 text-xs">
            ↻ Refresh
          </Button>
          <ButtonLink href="/report" variant="ghost" className="px-3 py-1.5 text-xs">
            Full report →
          </ButtonLink>
        </div>
      }
      className="mt-10"
    >
      <Tabs
        tabs={[
          { id: "today", label: "Today" },
          { id: "coming", label: "Coming up" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "today" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Personal Year" value={data.core.personalYear} accent sub={numberKeyword(data.core.personalYear)} />
          <Stat label="Personal Month" value={data.core.personalMonth} sub={numberKeyword(data.core.personalMonth)} />
          <Stat label="Personal Day" value={data.core.personalDay} sub={numberKeyword(data.core.personalDay)} />
        </div>
      )}
      {tab === "coming" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Stat
            label={`Next personal month · from ${data.nextMonthDate}`}
            value={data.nextMonthValue}
            sub={numberKeyword(data.nextMonthValue)}
          />
          <Stat
            label={`Personal Year ${data.todayYear + 1} · from Jan 1`}
            value={data.nextYearValue}
            accent
            sub={numberKeyword(data.nextYearValue)}
          />
        </div>
      )}
      {refreshedAt && (
        <p className="mt-3 text-xs text-fog">
          Recomputed at {formatDateTime(refreshedAt)} — values are derived live
          from your date of birth and today&apos;s date.
        </p>
      )}
      <p className="mt-3 text-[11px] text-fog">
        Keyword lines: modern published numerology (Decoz method) — summaries,
        labelled MODERN. The numbers themselves are exact arithmetic, shown in
        full on the Numerology page.
      </p>
    </Card>
  );
}
