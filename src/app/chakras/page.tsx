"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader } from "@/components/ui";
import { CHAKRA_HONESTY_NOTE, CHAKRA_SOURCE, chakraReadings } from "@/lib/chakras";
import { coreProfile } from "@/lib/numerology";
import { westernChart, type ChartInput } from "@/lib/western";

export default function ChakrasPage() {
  const { profile, loaded, today } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The chakra correspondences" />;

  return (
    <div>
      <PageHeader
        title="The seven chakras — planetary correspondences"
        blurb={`${profile.fullName} · a MODERN/METAPHYSICAL correspondence map: each centre's planet, number and element, with a strength indicator computed from that planet's dignity and placement in your chart.`}
        action={<Badge tone="violet">MODERN · metaphysical</Badge>}
      />
      <ChartWorkbench>
        {(input) => (
          <ChakraResults
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

function ChakraResults({ input, fullName, dob, today }: { input: ChartInput; fullName: string; dob: string; today: string }) {
  const readings = useMemo(() => {
    const chart = westernChart(input);
    const core = coreProfile(fullName, dob, today || "2026-01-01");
    return chakraReadings(chart, core);
  }, [input, fullName, dob, today]);

  return (
    <div className="grid gap-4">
      <Card title="The honesty note — not medicine" subtitle="This page's frame, stated plainly">
        <p className="text-sm leading-relaxed text-mist">{CHAKRA_HONESTY_NOTE}</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {readings.map((r) => (
          <Card
            key={r.def.index}
            title={`${r.def.index}. ${r.def.sanskrit} — the ${r.def.name} centre`}
            subtitle={`Planet ${r.def.planet} · element ${r.def.element} · number ${r.number} · indicator: ${r.indicator}`}
          >
            <p className="text-sm leading-relaxed text-mist">{r.text}</p>
            <p className="mt-2 text-xs text-fog">
              Computed: {r.def.planet} in {r.sign}, house {r.house} (dignity {r.dignity}
              {r.angular ? ", angular house" : ""}); number {r.number} {r.numberPresent ? "present" : "not present"} in the core profile.
            </p>
          </Card>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-fog">{CHAKRA_SOURCE}</p>
    </div>
  );
}
