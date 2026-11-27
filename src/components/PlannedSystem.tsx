"use client";

/**
 * Shell for a system whose engine lands in the next milestone. Shows the
 * profile data the engine will consume and the planned feature list —
 * and states plainly that no chart has been calculated yet. Nothing is
 * faked: no placeholder planets, no invented signs.
 */

import { useProfile } from "./ProfileProvider";
import { Badge, Card, NoProfile, PageHeader, Stat } from "./ui";

export function PlannedSystem({
  title,
  blurb,
  noProfileWhat,
  planned,
  needsTime,
}: {
  title: string;
  blurb: string;
  noProfileWhat: string;
  planned: string[];
  needsTime?: boolean;
}) {
  const { profile, loaded } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what={noProfileWhat} />;

  return (
    <div>
      <PageHeader title={title} blurb={blurb} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Profile data this engine will use" className="lg:col-span-1">
          <div className="grid gap-3">
            <Stat label="Full name" value={<span className="text-lg">{profile.fullName}</span>} />
            <Stat label="Date of birth" value={<span className="text-lg">{profile.dob}</span>} />
            <Stat
              label="Birth time"
              value={
                <span className="text-lg">{profile.birthTime ?? "Not provided"}</span>
              }
              sub={needsTime && !profile.birthTime ? "Required for houses and the ascendant — add it via Edit profile." : undefined}
            />
            <Stat label="Birth place" value={<span className="text-lg">{profile.birthPlace}</span>} />
          </div>
        </Card>

        <Card
          title="Building next"
          subtitle="This engine is the next milestone — nothing here is calculated yet"
          className="lg:col-span-2"
        >
          <div className="mb-4">
            <Badge tone="amber">Engine in build — no chart faked</Badge>
          </div>
          <ul className="space-y-2.5">
            {planned.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-mist">
                <span className="mt-0.5 text-gold">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-fog">
            When this engine ships, every position will be cross-checked
            against published sample charts and locked with golden tests —
            the same standard the numerology and Chinese engines already meet.
          </p>
        </Card>
      </div>
    </div>
  );
}
