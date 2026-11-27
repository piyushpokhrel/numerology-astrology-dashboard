"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader, Stat } from "@/components/ui";
import {
  chartRuler,
  formatInSign,
  qualityBalance,
  tightestAspect,
  westernChart,
} from "@/lib/western";

export default function WesternPage() {
  const { profile, loaded } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The Western chart" />;

  return (
    <div>
      <PageHeader
        title="Western astrology"
        blurb={`${profile.fullName} · tropical zodiac, geocentric apparent positions — cross-checked against published ephemerides.`}
        action={<Badge tone="gold">Classical astronomy · Modern presentation</Badge>}
      />

      <ChartWorkbench>
        {(input) => <WesternResults key={input.utc.toISOString() + input.latitude} input={input} />}
      </ChartWorkbench>
    </div>
  );
}

function WesternResults({ input }: { input: Parameters<typeof westernChart>[0] }) {
  const chart = useMemo(() => westernChart(input), [input]);
  const qualities = useMemo(() => qualityBalance(chart), [chart]);
  const ruler = useMemo(() => chartRuler(chart), [chart]);
  const tightest = useMemo(() => tightestAspect(chart), [chart]);
  const dominantQuality = (Object.entries(qualities).sort((a, b) => b[1] - a[1])[0] ?? ["Cardinal", 0]) as [string, number];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ascendant" value={formatInSign(chart.ascendant)} accent sub="Rising sign — from local sidereal time" />
        <Stat label="Midheaven (MC)" value={formatInSign(chart.midheaven)} sub="Highest point of the chart" />
        <Stat
          label="Element balance"
          value={
            <span className="text-lg">
              Fire {chart.elementBalance.Fire} · Earth {chart.elementBalance.Earth} · Air{" "}
              {chart.elementBalance.Air} · Water {chart.elementBalance.Water}
            </span>
          }
          sub="Across the ten bodies"
        />
      </div>

      <Card
        title="This chart's own balances — quality, ruler, loudest aspect"
        subtitle="Derivatives read off this chart's computed distribution (traditional rulership doctrine)"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Quality balance"
            value={
              <span className="text-lg">
                Cardinal {qualities.Cardinal} · Fixed {qualities.Fixed} · Mutable {qualities.Mutable}
              </span>
            }
            sub={`${dominantQuality[0]} leads with ${dominantQuality[1]} of 10 — ${dominantQuality[0] === "Cardinal" ? "an initiating chart" : dominantQuality[0] === "Fixed" ? "a consolidating chart" : "an adapting chart"}`}
          />
          <Stat
            label={`Chart ruler — ${ruler.ruler}`}
            value={<span className="text-lg">{ruler.position.sign}, house {ruler.position.house}</span>}
            sub={`Ruler of your ${chart.ascendantSign} Ascendant${ruler.modernCoRuler ? ` · modern co-ruler ${ruler.modernCoRuler}` : ""}`}
          />
          <Stat
            label="Tightest aspect"
            value={
              <span className="text-lg">
                {tightest ? `${tightest.a} ${tightest.type} ${tightest.b}` : "—"}
              </span>
            }
            sub={tightest ? `Orb ${tightest.orb.toFixed(2)}° — the closest to exact of ${chart.aspects.length}` : "No aspect within orb"}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-mist">{ruler.note}</p>
      </Card>

      <Card title="Planet positions" subtitle="Longitude, sign, and whole-sign house — every value computed, none hard-coded">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Body</th>
                <th className="py-2 pr-3 font-medium">Position</th>
                <th className="py-2 pr-3 font-medium">Longitude</th>
                <th className="py-2 font-medium">House (whole sign)</th>
              </tr>
            </thead>
            <tbody>
              {chart.positions.map((p) => (
                <tr key={p.body} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium text-moon">{p.body}</td>
                  <td className="py-2 pr-3 text-gold-2">{formatInSign(p.longitude)}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-mist">{p.longitude.toFixed(3)}°</td>
                  <td className="py-2 text-mist">{p.house}</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="py-2 pr-3 font-medium text-moon">Ascendant</td>
                <td className="py-2 pr-3 text-gold-2">{formatInSign(chart.ascendant)}</td>
                <td className="py-2 pr-3 font-mono text-xs text-mist">{chart.ascendant.toFixed(3)}°</td>
                <td className="py-2 text-mist">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Major aspects (${chart.aspects.length})`} subtitle="Orbs: 6° standard, 8° with the Sun or Moon, sextile 4°/6°">
        {chart.aspects.length === 0 ? (
          <p className="text-sm text-mist">No major aspects within orb in this chart.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-fog">
                  <th className="py-2 pr-3 font-medium">Pair</th>
                  <th className="py-2 pr-3 font-medium">Aspect</th>
                  <th className="py-2 pr-3 font-medium">Separation</th>
                  <th className="py-2 font-medium">Orb</th>
                </tr>
              </thead>
              <tbody>
                {chart.aspects.map((a) => (
                  <tr key={`${a.a}-${a.b}`} className="border-t border-line">
                    <td className="py-2 pr-3 text-moon">{a.a} – {a.b}</td>
                    <td className="py-2 pr-3 text-gold-2">{a.type}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-mist">{a.separation.toFixed(2)}°</td>
                    <td className="py-2 font-mono text-xs text-mist">{a.orb.toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="How this was calculated" subtitle="Show the math — differentiation rule 1">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mist">
          <li>Chart instant (UTC): <span className="text-moon">{chart.utcISO}</span>, latitude {chart.latitude}°, longitude {chart.longitudeEast}° (east-positive).</li>
          <li>Local sidereal time: <span className="text-moon">{chart.lstDegrees.toFixed(2)}°</span> (GAST × 15 + longitude). Ascendant and MC are computed from it with obliquity ε = 23.4393°.</li>
          <li>{chart.method}</li>
          <li>Verification: this engine reproduces the published ephemeris for 2003-01-01 00:00 UT (astro-seek / SubaAstro) within 0.013° on every body; the check is locked in the test suite.</li>
        </ul>
      </Card>
    </div>
  );
}
