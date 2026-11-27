"use client";

import { useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Card, NoProfile, PageHeader, Stat, Tabs } from "@/components/ui";
import {
  analyzeName,
  coreProfile,
  lifePath,
  personalMonth,
  type NumerologySystem,
} from "@/lib/numerology";
import { numberKeyword } from "@/lib/meanings";
import { formatLongDate } from "@/lib/profile";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function LetterBreakdown({ system, name }: { system: NumerologySystem; name: string }) {
  const analysis = useMemo(() => analyzeName(name, system), [name, system]);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {analysis.letters.map((l, i) => (
          <span
            key={i}
            className="inline-flex flex-col items-center rounded-md border border-line bg-night px-2 py-1"
          >
            <span className="text-sm font-semibold text-moon">{l.letter}</span>
            <span className="text-[11px] text-gold">{l.value}</span>
          </span>
        ))}
        <span className="inline-flex items-center px-2 text-sm text-mist">
          = {analysis.compound} → <span className="ml-1 font-bold text-gold-2">{analysis.root}</span>
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-panel-2 text-xs uppercase tracking-wider text-fog">
              <th className="px-3 py-2 font-medium">Word</th>
              <th className="px-3 py-2 font-medium">Compound</th>
              <th className="px-3 py-2 font-medium">Root</th>
            </tr>
          </thead>
          <tbody>
            {analysis.words.map((w) => (
              <tr key={w.word} className="border-t border-line">
                <td className="px-3 py-2 font-medium text-moon">{w.word}</td>
                <td className="px-3 py-2 text-mist">{w.compound}</td>
                <td className="px-3 py-2 text-gold-2">{w.root}</td>
              </tr>
            ))}
            <tr className="border-t border-line bg-panel-2/50">
              <td className="px-3 py-2 font-semibold text-moon">Full name</td>
              <td className="px-3 py-2 font-semibold text-moon">{analysis.compound}</td>
              <td className="px-3 py-2 font-semibold text-gold-2">{analysis.root}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-fog">
        {system === "chaldean"
          ? "Chaldean: the compound (pre-reduction) number carries its own traditional reading; the root is always a single digit — this table assigns no letter the value 9. Table as published by Cheiro (Book of Numbers, 1926) — his construction, labelled modern-classical per our honesty standard."
          : "Pythagorean: letters cycle 1–9 through the alphabet; master numbers 11 / 22 / 33 are preserved in the root. Modern form as standardised by Balliett and Decoz."}
      </p>
    </div>
  );
}

export default function NumerologyPage() {
  const { profile, loaded, today } = useProfile();
  const [system, setSystem] = useState<NumerologySystem>("chaldean");

  const data = useMemo(() => {
    if (!profile || !today) return null;
    const core = coreProfile(profile.fullName, profile.dob, today);
    const lp = lifePath(profile.dob);
    const year = Number(today.slice(0, 4));
    const months = MONTH_NAMES.map((label, i) => {
      const mm = String(i + 1).padStart(2, "0");
      return { label, value: personalMonth(profile.dob, `${year}-${mm}-01`) };
    });
    return { core, lp, months, year };
  }, [profile, today]);

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The numerology report" />;

  return (
    <div>
      <PageHeader
        title="Numerology report"
        blurb={`${profile.fullName} · born ${profile.dob}. Both systems, computed from the same engines the dashboard uses.`}
        action={
          <div className="flex gap-2">
            <Badge tone="gold">Chaldean · Cheiro 1926</Badge>
            <Badge tone="violet">Pythagorean · Modern</Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Life Path — how it's built" subtitle="Component method, masters preserved">
          {data && (
            <div className="space-y-2 text-sm text-mist">
              <div className="flex justify-between border-b border-line pb-2">
                <span>Month component</span>
                <span className="font-semibold text-moon">{data.lp.monthComponent}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span>Day component</span>
                <span className="font-semibold text-moon">{data.lp.dayComponent}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span>Year component</span>
                <span className="font-semibold text-moon">{data.lp.yearComponent}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span>Compound</span>
                <span className="font-semibold text-moon">{data.lp.compound}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-medium text-moon">Life Path</span>
                <span className="text-3xl font-bold text-gold-2">{data.lp.value}</span>
              </div>
              <p className="pt-1 text-xs leading-relaxed text-fog">
                {numberKeyword(data.lp.value)}
                <span className="mt-1 block text-[11px]">
                  Source: modern published numerology (Decoz method) — summary.
                </span>
              </p>
            </div>
          )}
        </Card>

        <Card title="Core numbers" className="lg:col-span-2">
          {data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Birthday" value={data.core.birthday} />
              <Stat label="Attitude" value={data.core.attitude} />
              <Stat label="Destiny · Pyth." value={data.core.destinyPythagorean} />
              <Stat label="Destiny · Chald." value={data.core.destinyChaldean} />
              <Stat label="Soul Urge" value={data.core.soulUrge} sub="vowels only" />
              <Stat label="Personality" value={data.core.personality} sub="consonants only" />
              <Stat label="Personal Year" value={data.core.personalYear} accent />
              <Stat label="Personal Day" value={data.core.personalDay} />
            </div>
          )}
        </Card>
      </div>

      <Card title="Name analysis" subtitle="Per-letter and per-word breakdowns" className="mt-4">
        <Tabs
          tabs={[
            { id: "chaldean", label: "Chaldean" },
            { id: "pythagorean", label: "Pythagorean" },
          ]}
          active={system}
          onChange={(id) => setSystem(id as NumerologySystem)}
        />
        <div className="mt-4">
          <LetterBreakdown system={system} name={profile.fullName} />
        </div>
      </Card>

      <Card
        title={`Personal months — ${data?.year ?? ""}`}
        subtitle={today ? `Personal Year ${data?.core.personalYear} · calculated for ${formatLongDate(today)}` : undefined}
        className="mt-4"
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {data?.months.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-center"
            >
              <div className="text-[11px] uppercase tracking-wider text-fog">{m.label}</div>
              <div className="text-xl font-bold text-moon">{m.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
