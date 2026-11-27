"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Card, NoProfile, PageHeader, Stat } from "@/components/ui";
import {
  chineseProfile,
  yearOutlook,
  zodiacYearForDate,
  animalForZodiacYear,
  stemForZodiacYear,
  CNY_DATES,
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
    return { cp, currentZodiacYear, currentAnimal, currentStem, currentOutlook, outlook2027, nextCny };
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
    </div>
  );
}
