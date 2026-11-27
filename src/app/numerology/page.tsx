"use client";

import { useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Card, NoProfile, PageHeader, Stat, Tabs } from "@/components/ui";
import {
  analyzeName,
  balanceNumber,
  challenges,
  coreProfile,
  displayNumber,
  growthNumber,
  lifePath,
  maturityNumber,
  personalMonth,
  pinnacles,
  rationalThoughtNumber,
  type NumerologySystem,
} from "@/lib/numerology";
import { bothWays, numberKeyword } from "@/lib/meanings";
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
          = {analysis.compound} → <span className="ml-1 font-bold text-gold-2">{displayNumber(analysis.root)}</span>
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
                <td className="px-3 py-2 text-gold-2">{displayNumber(w.root)}</td>
              </tr>
            ))}
            <tr className="border-t border-line bg-panel-2/50">
              <td className="px-3 py-2 font-semibold text-moon">Full name</td>
              <td className="px-3 py-2 font-semibold text-moon">{analysis.compound}</td>
              <td className="px-3 py-2 font-semibold text-gold-2">{displayNumber(analysis.root)}</td>
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
    return {
      core,
      lp,
      months,
      year,
      pinnacles: pinnacles(profile.dob),
      challenges: challenges(profile.dob),
      growth: growthNumber(profile.fullName),
      rational: rationalThoughtNumber(profile.fullName, profile.dob),
      maturity: maturityNumber(profile.fullName, profile.dob),
      balance: balanceNumber(profile.fullName),
    };
  }, [profile, today]);

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The numerology report" />;

  return (
    <div>
      <PageHeader
        title="Numerology report"
        blurb={`${profile.fullName} · born ${profile.dob}. Both systems, computed in full — every figure below shows the arithmetic that produced it.`}
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
                <span className="text-3xl font-bold text-gold-2">{displayNumber(data.lp.value)}</span>
              </div>
              <p className="pt-1 text-xs leading-relaxed text-fog">
                {numberKeyword(data.lp.value)}
                <span className="mt-1 block text-[11px]">
                  Source: modern published numerology (Decoz method) — summary.
                </span>
              </p>
              {data.lp.isMaster && (
                <div className="space-y-2 border-t border-line pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                    Read both ways — master and root
                  </p>
                  {bothWays(data.lp.value).lines.map((line) => (
                    <p key={line.slice(0, 28)} className="text-xs leading-relaxed text-mist">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Core numbers" className="lg:col-span-2">
          {data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Birthday" value={displayNumber(data.core.birthday)} />
              <Stat label="Attitude" value={displayNumber(data.core.attitude)} />
              <Stat label="Destiny · Pyth." value={displayNumber(data.core.destinyPythagorean)} />
              <Stat label="Destiny · Chald." value={displayNumber(data.core.destinyChaldean)} />
              <Stat label="Soul Urge" value={displayNumber(data.core.soulUrge)} sub="vowels only" />
              <Stat label="Personality" value={displayNumber(data.core.personality)} sub="consonants only" />
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

      {data && (
        <Card
          title="Derivatives — Pinnacles, Challenges & the secondary numbers"
          subtitle="Each one computed from your own date and name, with its derivation shown (Decoz method — MODERN)"
          className="mt-4"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-moon">Your four Pinnacles</h3>
              <p className="mt-1 text-xs leading-relaxed text-fog">
                The long chapters of timing. Your Life Path root is {data.pinnacles.lifePathRoot}, so the
                First Pinnacle runs through age 36 − {data.pinnacles.lifePathRoot} = {data.pinnacles.firstEndAge};
                the Second and Third run nine years each; the Fourth is lifelong.
              </p>
              <div className="mt-3 space-y-2">
                {data.pinnacles.pinnacles.map((p) => (
                  <div key={p.index} className="rounded-lg border border-line bg-panel-2/60 px-3 py-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-moon">Pinnacle {p.index}</span>
                      <span className="text-lg font-bold text-gold-2">{displayNumber(p.value)}</span>
                    </div>
                    <p className="text-xs text-mist">
                      Ages {p.startAge}–{p.endAge === null ? "end of life" : p.endAge} · {p.formula}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-fog">{numberKeyword(p.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-moon">Your Challenges</h3>
              <p className="mt-1 text-xs leading-relaxed text-fog">
                Differences of your fully-reduced components (month {data.challenges.components.month}, day{" "}
                {data.challenges.components.day}, year {data.challenges.components.year}) — master numbers do
                not survive here, by the method&apos;s own rule. A Challenge names recurring friction to work
                with — a teacher, not a threat.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="First Challenge" value={data.challenges.first} sub={data.challenges.formulas.first} />
                <Stat label="Second Challenge" value={data.challenges.second} sub={data.challenges.formulas.second} />
                <Stat label="Main Challenge" value={data.challenges.main} sub={data.challenges.formulas.main} />
                <Stat label="Fourth Challenge" value={data.challenges.fourth} sub={data.challenges.formulas.fourth} />
              </div>
              <h3 className="mt-5 text-sm font-semibold text-moon">The secondary numbers</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Growth" value={data.growth} sub="first name alone — the key number" />
                <Stat label="Rational Thought" value={data.rational} sub="first name + birth day" />
                <Stat label="Maturity" value={displayNumber(data.maturity)} sub="Life Path + Destiny" />
                <Stat label="Balance" value={data.balance} sub="initials of the full name" />
              </div>
              {bothWays(data.maturity).isMaster && (
                <div className="mt-3 space-y-1.5">
                  {bothWays(data.maturity).lines.map((line) => (
                    <p key={line.slice(0, 28)} className="text-xs leading-relaxed text-mist">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
