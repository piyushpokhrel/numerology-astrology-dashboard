"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader } from "@/components/ui";
import { chineseProfile } from "@/lib/chinese";
import { allElementBalances } from "@/lib/elements";
import { vedicChart } from "@/lib/vedic";
import { westernChart, type ChartInput } from "@/lib/western";

export default function ElementsPage() {
  const { profile, loaded } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The elements comparison" />;

  return (
    <div>
      <PageHeader
        title="The five elements — three systems, side by side"
        blurb={`${profile.fullName} · each system's balance computed from your own chart and pillars, with its method stated and its dominant and lacking elements named.`}
        action={<Badge tone="gold">TRADITION · computed balances</Badge>}
      />
      <ChartWorkbench>
        {(input) => (
          <ElementsResults
            key={input.utc.toISOString()}
            input={input}
            dob={profile.dob}
            birthTime={profile.birthTime}
          />
        )}
      </ChartWorkbench>
    </div>
  );
}

function ElementsResults({ input, dob, birthTime }: { input: ChartInput; dob: string; birthTime?: string }) {
  const balances = useMemo(() => {
    const vedic = vedicChart(input);
    const western = westernChart(input);
    const chinese = chineseProfile(dob);
    return allElementBalances(vedic, chinese, western, dob, birthTime);
  }, [input, dob, birthTime]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {balances.map((b) => {
        const max = Math.max(...Object.values(b.counts), 1);
        return (
          <Card key={b.system} title={b.system} subtitle={`Dominant: ${b.dominant}${b.lacking.length ? ` · Lacking: ${b.lacking.join(", ")}` : " · nothing wholly absent"}`}>
            <div className="space-y-2">
              {Object.entries(b.counts).map(([el, n]) => (
                <div key={el}>
                  <div className="flex justify-between text-sm">
                    <span className="text-moon">{el}</span>
                    <span className="text-mist">{n} / {b.total}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-panel-2">
                    <div className="h-2 rounded bg-gold/70" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-mist">{b.derivation}</p>
            <p className="mt-2 text-xs leading-relaxed text-fog">{b.note}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-fog">Source: {b.source}</p>
          </Card>
        );
      })}
      <Card title="How to read three systems at once" className="lg:col-span-3">
        <p className="text-sm leading-relaxed text-mist">
          The three systems do not carve the world the same way: the Western scheme has Air but no Wood or Metal;
          Wu Xing has Wood and Metal but no Air; the Pancha Bhuta adds Akasha, which is a medium, not a placement.
          Where two systems independently name the same dominant element for you, that is a genuine cross-system
          convergence. Where they differ, both stand — this page never averages them into a fake consensus.
        </p>
      </Card>
    </div>
  );
}
