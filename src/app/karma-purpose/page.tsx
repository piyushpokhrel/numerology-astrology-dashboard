"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader } from "@/components/ui";
import { karmaReport } from "@/lib/karma";
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
    </div>
  );
}
