"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader } from "@/components/ui";
import { karmaReport } from "@/lib/karma";
import { ISHTA_EXPLANATION, RESONANCE, RESONANCE_FRAMING, jaimini } from "@/lib/jaimini";
import { coreProfile } from "@/lib/numerology";
import { vedicChart } from "@/lib/vedic";
import { westernChart, type ChartInput } from "@/lib/western";

export default function KarmaPurposePage() {
  const { profile, loaded, today } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The karma & purpose reading" />;

  return (
    <div>
      <PageHeader
        title="Past Life Karma and the True Purpose of This Lifetime"
        blurb={`${profile.fullName} · the node axis, Saturn, the 12th house and the debt compounds — every indicator computed from your chart, broadly explained, and never turned into an invented story.`}
        action={<Badge tone="gold">TRADITION · indicators only</Badge>}
      />
      <ChartWorkbench>
        {(input) => (
          <KarmaResults
            key={input.utc.toISOString()}
            input={input}
            fullName={profile.fullName}
            dob={profile.dob}
            today={today}
          />
        )}
      </ChartWorkbench>
    </div>
  );
}

function KarmaResults({ input, fullName, dob, today }: { input: ChartInput; fullName: string; dob: string; today: string }) {
  const report = useMemo(() => {
    const core = coreProfile(fullName, dob, today || "2026-01-01");
    return karmaReport(core, westernChart(input), vedicChart(input));
  }, [input, fullName, dob, today]);
  const j = useMemo(() => jaimini(vedicChart(input)), [input]);

  return (
    <div className="grid gap-4">
      <Card title="The framework — what this page is, and is not" subtitle="Sanchita / prarabdha, the nodes, and the indicators-not-stories rule">
        <div className="space-y-2">
          {report.framework.map((line) => (
            <p key={line.slice(0, 28)} className="text-sm leading-relaxed text-mist">{line}</p>
          ))}
        </div>
      </Card>

      {report.indicators.map((ind) => (
        <Card key={ind.title} title={ind.title} subtitle={`Source: ${ind.source}`}>
          <div className="space-y-2">
            {ind.lines.map((line) => (
              <p key={line.slice(0, 28)} className="text-sm leading-relaxed text-mist">{line}</p>
            ))}
          </div>
        </Card>
      ))}

      <Card
        title="The True Purpose of this lifetime"
        subtitle="Assembled only from the computed indicators above — each clause traceable to its indicator and source"
        className="border-gold/40"
      >
        <div className="space-y-2">
          {report.purpose.map((line) => (
            <p key={line.slice(0, 28)} className="text-sm leading-relaxed text-mist">{line}</p>
          ))}
        </div>
      </Card>

      <Card
        title={`Ishta Devta — ${j.ishtaDeity} (${j.ishtaPlanet})`}
        subtitle="Jaimini tradition (BPHS) · 7-karaka scheme, stated openly · educational — no instruction to worship, no promises"
        className="border-gold/40"
      >
        <div className="space-y-2">
          {ISHTA_EXPLANATION.map((line) => (
            <p key={line.slice(0, 28)} className="text-sm leading-relaxed text-mist">{line}</p>
          ))}
          <p className="text-sm leading-relaxed text-mist">{j.ishtaRule}</p>
          <p className="text-sm leading-relaxed text-mist">
            Karakamsa: <span className="text-moon">{j.karakamsa}</span> (Atmakaraka {j.atmakaraka.body} at{" "}
            {j.atmakaraka.degreeInSign.toFixed(2)}° in its sign — {j.atmakaraka.signifies}). Amatyakaraka (the
            guide): {j.amatyakaraka.body}.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Karaka</th>
                <th className="py-2 pr-3 font-medium">Graha</th>
                <th className="py-2 pr-3 font-medium">Degree in sign</th>
                <th className="py-2 font-medium">Navamsa (D9)</th>
              </tr>
            </thead>
            <tbody>
              {j.karakas.map((k) => (
                <tr key={k.short} className="border-t border-line">
                  <td className="py-2 pr-3 text-moon">{k.name} ({k.short})</td>
                  <td className="py-2 pr-3 text-mist">{k.body}</td>
                  <td className="py-2 pr-3 text-mist">{k.degreeInSign.toFixed(2)}°</td>
                  <td className="py-2 text-mist">{j.navamsa.find((n) => n.body === k.body)?.navamsaSign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={`Resonating beings — the ${j.ishtaPlanet} principle across old civilizations`}
        subtitle="COMPARATIVE MYTHOLOGY — archetype parallels for study, not identities or claims"
      >
        <p className="text-sm leading-relaxed text-mist">{RESONANCE_FRAMING}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(RESONANCE[j.ishtaPlanet] ?? []).map((r) => (
            <div key={r.civilization} className="rounded-lg border border-line bg-panel-2/60 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-fog">{r.civilization}</p>
              <p className="mt-1 text-sm font-semibold text-moon">{r.being ?? "No direct parallel"}</p>
              <p className="mt-1 text-xs leading-relaxed text-mist">{r.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fog">
          The table is driven by your Ishta Devta planet ({j.ishtaPlanet}); your Atmakaraka is {j.atmakaraka.body}.
          Both are computed above — change the chart and the table changes.
        </p>
      </Card>
    </div>
  );
}
