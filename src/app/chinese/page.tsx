"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Card, NoProfile, PageHeader, Stat } from "@/components/ui";
import {
  chineseProfile,
  dayPillar,
  fiveYearRelations,
  hourPillar,
  yearOutlook,
  zodiacYearForDate,
  animalForZodiacYear,
  stemForZodiacYear,
  CNY_DATES,
  RELATION_LABELS,
} from "@/lib/chinese";
import { formatLongDate } from "@/lib/profile";

const RELATION_LABEL: Record<string, string> = {
  "own-sign": "Own-sign year",
  "secret-friend": "Secret-friend year",
  trine: "Trine-ally year",
  clash: "Clash year",
  neutral: "Neutral year",
};

export default function ChinesePage() {
  const { profile, loaded, today } = useProfile();

  const data = useMemo(() => {
    if (!profile || !today) return null;
    const cp = chineseProfile(profile.dob);
    const currentZodiacYear = zodiacYearForDate(today);
    const currentAnimal = animalForZodiacYear(currentZodiacYear);
    const currentStem = stemForZodiacYear(currentZodiacYear);
    const currentOutlook = yearOutlook(cp, currentZodiacYear);
    const outlook2027 = yearOutlook(cp, 2027);
    const nextCny = CNY_DATES[currentZodiacYear + 1];
    const fiveYears = fiveYearRelations(cp, currentZodiacYear, 5);
    const day = dayPillar(profile.dob);
    const hour = hourPillar(profile.dob, profile.birthTime);
    return { cp, currentZodiacYear, currentAnimal, currentStem, currentOutlook, outlook2027, nextCny, fiveYears, day, hour };
  }, [profile, today]);

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The Chinese astrology page" />;
  if (!data) return null;

  const { cp } = data;

  return (
    <div>
      <PageHeader
        title="Chinese astrology"
        blurb={`${profile.fullName} · born ${profile.dob}. The zodiac year turns on Lunar New Year, not Jan 1 — your sign is resolved against the real boundary.`}
        action={<Badge tone="gold">Traditional · Classical doctrine</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Your sign" className="lg:col-span-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gold-2">
              {cp.element} {cp.animal}
            </span>
            <Badge tone="violet">{cp.polarity}</Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm text-mist">
            <div className="flex justify-between border-b border-line pb-2">
              <span>Zodiac year</span>
              <span className="font-semibold text-moon">{cp.zodiacYear}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span>That year opened</span>
              <span className="font-semibold text-moon">
                {cp.cnyDate ? formatLongDate(cp.cnyDate) : "before the table range"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Element cycle</span>
              <span className="font-semibold text-moon">{cp.element} (heavenly stem)</span>
            </div>
          </div>
          {profile.dob.slice(0, 4) !== String(cp.zodiacYear) && (
            <p className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-xs leading-relaxed text-mist">
              You were born in January/February before Lunar New Year, so your
              sign belongs to zodiac year {cp.zodiacYear}, not {profile.dob.slice(0, 4)}.
              This is the boundary most free calculators get wrong.
            </p>
          )}
        </Card>

        <Card title="Relations" subtitle="Secret friend · clash · trine (三合)" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Secret friend 六合" value={cp.secretFriend} sub="Your closest quiet ally" accent />
            <Stat label="Clash / enemy 六冲" value={cp.clash} sub="The opposite sign — friction by tradition" />
            <Stat label="Trine 三合" value={cp.trine.join(" · ")} sub="Your harmony triangle" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            Tradition reads the secret friend as the sign whose years and
            company support you, the clash sign as the one whose years call
            for patience, and your trine as the two signs that share your
            rhythm.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title={`Now — ${data.currentStem.element} ${data.currentAnimal} year`}
          subtitle={`Zodiac year ${data.currentZodiacYear}${data.nextCny ? ` · next Lunar New Year ${formatLongDate(data.nextCny)}` : ""}`}
        >
          <Badge tone={data.currentOutlook.relation === "clash" ? "rose" : data.currentOutlook.relation === "neutral" ? "mist" : "jade"}>
            {RELATION_LABEL[data.currentOutlook.relation]}
          </Badge>
          <p className="mt-3 text-sm leading-relaxed text-mist">{data.currentOutlook.headline}</p>
          {data.currentOutlook.notes.map((n) => (
            <p key={n} className="mt-2 text-sm leading-relaxed text-mist">{n}</p>
          ))}
          <p className="mt-3 text-[11px] text-fog">Source: {data.currentOutlook.source}</p>
        </Card>

        <Card
          title="2027 — Fire Goat year"
          subtitle="From Lunar New Year, Feb 6, 2027"
        >
          <Badge tone={data.outlook2027.relation === "clash" ? "rose" : data.outlook2027.relation === "neutral" ? "mist" : "jade"}>
            {RELATION_LABEL[data.outlook2027.relation]}
          </Badge>
          <p className="mt-3 text-sm leading-relaxed text-mist">{data.outlook2027.headline}</p>
          {data.outlook2027.notes.map((n) => (
            <p key={n} className="mt-2 text-sm leading-relaxed text-mist">{n}</p>
          ))}
          <p className="mt-3 text-[11px] text-fog">Source: {data.outlook2027.source}</p>
          <p className="mt-2 text-xs leading-relaxed text-fog">
            Read in the traditional frame only: a year's character comes from
            how its ruling sign stands to yours — ally, trine, neutral or
            clash — together with the element interaction above.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title="Your sign vs the next five years"
          subtitle="Each year named by its relation to your sign — ally, clash, or neutral (traditional doctrine)"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-fog">
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 pr-3 font-medium">Sign</th>
                  <th className="py-2 pr-3 font-medium">Relation to your {cp.animal}</th>
                  <th className="py-2 font-medium">Element interplay</th>
                </tr>
              </thead>
              <tbody>
                {data.fiveYears.map((r) => (
                  <tr key={r.year} className="border-t border-line">
                    <td className="py-2 pr-3 font-medium text-moon">{r.year}</td>
                    <td className="py-2 pr-3 text-mist">{r.element} {r.animal}</td>
                    <td className="py-2 pr-3 text-gold-2">{RELATION_LABELS[r.relation]}</td>
                    <td className="py-2 text-mist">{r.elementRelation.replace(/-/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Your day & hour pillars (BaZi-lite)"
          subtitle="Sexagenary day cycle via the Julian Day Number; hour pillar by the Five Rats rule"
        >
          <div className="space-y-2 text-sm text-mist">
            <div className="flex justify-between border-b border-line pb-2">
              <span>Day pillar</span>
              <span className="font-semibold text-moon">
                {data.day.stem}-{data.day.branch} ({data.day.animal}) · cycle #{data.day.cycleNumber} of 60
              </span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span>Day elements</span>
              <span className="font-semibold text-moon">
                stem {data.day.stemElement} · branch {data.day.branchElement}
              </span>
            </div>
            {data.hour ? (
              <>
                <div className="flex justify-between border-b border-line pb-2">
                  <span>Hour pillar</span>
                  <span className="font-semibold text-moon">
                    {data.hour.stem}-{data.hour.branch} ({data.hour.animal})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Double-hour</span>
                  <span className="font-semibold text-moon">{data.hour.window}</span>
                </div>
                <p className="pt-1 text-xs leading-relaxed text-fog">{data.hour.note}</p>
              </>
            ) : (
              <p className="pt-1 text-sm leading-relaxed text-mist">
                Hour pillar: <span className="text-moon">not computed</span> — this profile records no
                birth time, and the hour pillar cannot be derived without one. Add the birth time to
                the profile and the pillar (stem, branch, and its elements) appears here. The day
                pillar above needs no time: it is a pure calendar count.
              </p>
            )}
            <p className="pt-1 text-[11px] leading-relaxed text-fog">
              Method, stated honestly: day pillar from Y.T. Liu&apos;s published JDN formula
              (verified against 2000-01-01 = Wu-Wu and 2024-02-10 = Jia-Chen). Full Four Pillars
              (month pillar by solar terms, true solar time) is a deeper module — not claimed here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
