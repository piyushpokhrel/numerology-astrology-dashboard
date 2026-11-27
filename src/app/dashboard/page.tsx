"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Button, ButtonLink, Card, NoProfile, PageHeader, Stat, Tabs } from "@/components/ui";
import { chartInputFor, loadChartSettings } from "@/components/ChartWorkbench";
import { coreProfile, personalMonth, personalYear } from "@/lib/numerology";
import { chineseProfile, yearOutlook } from "@/lib/chinese";
import { numberKeyword } from "@/lib/meanings";
import { formatDateTime, formatLongDate } from "@/lib/profile";
import { formatInSign, westernChart } from "@/lib/western";
import { dashaAt, vedicChart } from "@/lib/vedic";

export default function DashboardPage() {
  const { profile, loaded, today, refresh, refreshedAt } = useProfile();
  const [tab, setTab] = useState("today");

  const data = useMemo(() => {
    if (!profile || !today) return null;
    const core = coreProfile(profile.fullName, profile.dob, today);
    const chinese = chineseProfile(profile.dob);
    const todayYear = Number(today.slice(0, 4));
    const outlook = yearOutlook(chinese, todayYear + 1 > 2027 ? todayYear : 2027);
    // Next-cycle highlights
    const nextYearValue = personalYear(profile.dob, todayYear + 1);
    const [ty, tm] = today.split("-").map(Number);
    const nextMonthDate = tm === 12 ? `${ty + 1}-01-01` : `${ty}-${String(tm + 1).padStart(2, "0")}-01`;
    const nextMonthValue = personalMonth(profile.dob, nextMonthDate);
    return { core, chinese, outlook, nextYearValue, nextMonthValue, nextMonthDate, todayYear };
  }, [profile, today]);

  // Charts at a glance — computed from the saved chart settings
  // (the same derivation the Western/Vedic pages and the report use).
  const [glance, setGlance] = useState<{ asc: string; nakshatra: string; dasha: string } | null>(null);
  useEffect(() => {
    if (!profile || !today) return;
    const derived = chartInputFor(profile, loadChartSettings());
    if (!derived) return;
    const w = westernChart(derived.input);
    const v = vedicChart(derived.input);
    const current = dashaAt(v.dashas, new Date(`${today}T12:00:00`));
    setGlance({
      asc: formatInSign(w.ascendant),
      nakshatra: `${v.moonNakshatra.name} · pada ${v.moonNakshatra.pada}`,
      dasha: current ? `${current.lord} Mahadasha` : "—",
    });
  }, [profile, today]);

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="Your dashboard" />;

  const firstName = profile.fullName.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${firstName}`}
        blurb={`${profile.fullName} · born ${profile.dob}${profile.birthTime ? ` at ${profile.birthTime}` : ""} · ${profile.birthPlace}`}
        action={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-fog sm:block">
              Last updated {formatDateTime(profile.updatedAt)}
            </span>
            <ButtonLink href="/profile" variant="ghost">
              Edit profile
            </ButtonLink>
          </div>
        }
      />

      {/* Cycles — always computed against the CURRENT date */}
      <Card
        title="Your personal cycles"
        subtitle={
          today
            ? `Calculated for ${formatLongDate(today)} — recomputed at view time, never stored`
            : undefined
        }
        action={
          <Button variant="subtle" onClick={refresh} className="px-3 py-1.5 text-xs">
            ↻ Refresh
          </Button>
        }
        className="mb-4"
      >
        <Tabs
          tabs={[
            { id: "today", label: "Today" },
            { id: "coming", label: "Coming up" },
          ]}
          active={tab}
          onChange={setTab}
        />
        {data && tab === "today" && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Personal Year" value={data.core.personalYear} accent sub={numberKeyword(data.core.personalYear)} />
            <Stat label="Personal Month" value={data.core.personalMonth} sub={numberKeyword(data.core.personalMonth)} />
            <Stat label="Personal Day" value={data.core.personalDay} sub={numberKeyword(data.core.personalDay)} />
          </div>
        )}
        {data && tab === "coming" && (
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
            from your date of birth and today's date.
          </p>
        )}
        <p className="mt-3 text-[11px] text-fog">
          Keyword lines: modern published numerology (Decoz method) — summaries,
          labelled MODERN. The numbers themselves are exact arithmetic, shown in
          full on the Numerology page.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Core numbers */}
        <Card title="Core numbers" subtitle="Numerology · both systems" className="lg:col-span-2">
          {data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Life Path" value={data.core.lifePath} accent sub={`compound ${data.core.lifePathCompound}`} />
              <Stat label="Birthday" value={data.core.birthday} />
              <Stat label="Attitude" value={data.core.attitude} />
              <Stat label="Destiny · Pythagorean" value={data.core.destinyPythagorean} />
              <Stat label="Destiny · Chaldean" value={data.core.destinyChaldean} />
              <Stat label="Soul Urge" value={data.core.soulUrge} sub="vowels" />
              <Stat label="Personality" value={data.core.personality} sub="consonants" />
              <Stat label="Chaldean name" value={data.core.chaldeanName.root} sub={`compound ${data.core.chaldeanName.compound}`} />
              <Stat label="Pythagorean name" value={data.core.pythagoreanName.root} sub={`compound ${data.core.pythagoreanName.compound}`} />
            </div>
          )}
          <div className="mt-4">
            <ButtonLink href="/numerology" variant="ghost">
              Full numerology report →
            </ButtonLink>
          </div>
        </Card>

        {/* Chinese card */}
        <Card title="Chinese zodiac" subtitle="Resolved on the Lunar New Year boundary">
          {data && (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gold-2">
                  {data.chinese.element} {data.chinese.animal}
                </span>
                <Badge tone="violet">{data.chinese.polarity}</Badge>
              </div>
              <p className="mt-2 text-sm text-mist">
                Zodiac year {data.chinese.zodiacYear} · secret friend{" "}
                {data.chinese.secretFriend} · clash {data.chinese.clash}
              </p>
              <div className="mt-4 rounded-xl border border-line bg-panel-2/60 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-fog">
                  {data.outlook.year} outlook · {data.outlook.element} {data.outlook.animal}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-mist">{data.outlook.headline}</p>
              </div>
              <div className="mt-4">
                <ButtonLink href="/chinese" variant="ghost">
                  Chinese astrology →
                </ButtonLink>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Charts at a glance — Western + Vedic on the same profile */}
      <Card
        title="Charts at a glance"
        subtitle="Western + Vedic from your saved chart settings — confirm place/time on either chart page"
        className="mt-4"
        action={
          <ButtonLink href="/report" variant="ghost">
            Full report →
          </ButtonLink>
        }
      >
        {glance ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Ascendant (Western)" value={<span className="text-xl">{glance.asc}</span>} />
            <Stat label="Moon nakshatra (Vedic)" value={<span className="text-xl">{glance.nakshatra}</span>} />
            <Stat label="Current dasha (Vedic)" value={<span className="text-xl">{glance.dasha}</span>} />
          </div>
        ) : (
          <p className="text-sm text-mist">Preparing your charts…</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/western" variant="subtle">Western chart</ButtonLink>
          <ButtonLink href="/vedic" variant="subtle">Vedic chart</ButtonLink>
        </div>
      </Card>
    </div>
  );
}
