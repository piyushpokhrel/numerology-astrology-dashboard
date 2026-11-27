"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader, Stat } from "@/components/ui";
import {
  antardashaAt,
  antardashas,
  dashaAt,
  nakshatraLordChain,
  padaReading,
  vedicChart,
} from "@/lib/vedic";
import { formatInSign, type ChartInput } from "@/lib/western";
import { formatLongDate } from "@/lib/profile";

export default function VedicPage() {
  const { profile, loaded, today } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The Vedic chart" />;

  return (
    <div>
      <PageHeader
        title="Vedic astrology"
        blurb={`${profile.fullName} · sidereal Jyotisha in the Parashari tradition — same ephemeris as the Western chart, shifted by the Lahiri ayanamsa.`}
        action={<Badge tone="gold">Classical · BPHS tradition</Badge>}
      />

      <ChartWorkbench>
        {(input) => (
          <VedicResults key={input.utc.toISOString()} input={input} today={today} />
        )}
      </ChartWorkbench>
    </div>
  );
}

function VedicResults({ input, today }: { input: ChartInput; today: string }) {
  const chart = useMemo(() => vedicChart(input), [input]);
  const current = useMemo(
    () => (today ? dashaAt(chart.dashas, new Date(`${today}T12:00:00`)) : null),
    [chart, today],
  );
  const currentSub = useMemo(
    () => (current && today ? antardashaAt(current, new Date(`${today}T12:00:00`)) : null),
    [current, today],
  );
  const currentSubs = useMemo(() => (current ? antardashas(current) : []), [current]);
  const pada = useMemo(() => padaReading(chart), [chart]);
  const chain = useMemo(() => nakshatraLordChain(chart), [chart]);
  const moon = chart.grahas.find((g) => g.body === "Moon")!;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lagna (ascendant)" value={formatInSign(chart.lagna.sidereal)} accent sub="Sidereal" />
        <Stat
          label="Moon nakshatra"
          value={<span className="text-2xl">{chart.moonNakshatra.name}</span>}
          sub={`Pada ${chart.moonNakshatra.pada} · lord ${chart.moonNakshatra.lord}`}
        />
        <Stat
          label="Current dasha"
          value={<span className="text-2xl">{current ? `${current.lord} Mahadasha` : "—"}</span>}
          sub={
            current
              ? `${current.startISO.slice(0, 10)} → ${current.endISO.slice(0, 10)} · as of ${today ? formatLongDate(today) : ""}`
              : "Outside the computed timeline"
          }
        />
        <Stat
          label="Current Antardasha (sub-period)"
          value={<span className="text-2xl">{currentSub ? `${currentSub.lord} Antardasha` : "—"}</span>}
          sub={
            currentSub
              ? `${currentSub.startISO.slice(0, 10)} → ${currentSub.endISO.slice(0, 10)} · inside ${current?.lord} Mahadasha`
              : "Outside the computed timeline"
          }
        />
      </div>

      <Card
        title={pada.heading}
        subtitle="Your Moon's pada and the nakshatra-lord chain — from your Moon's actual position (BPHS — classical)"
      >
        <div className="space-y-2">
          {pada.lines.map((line) => (
            <p key={line.slice(0, 32)} className="text-sm leading-relaxed text-mist">
              {line}
            </p>
          ))}
          {chain.map((line) => (
            <p key={line.slice(0, 32)} className="text-sm leading-relaxed text-mist">
              {line}
            </p>
          ))}
        </div>
      </Card>

      {current && (
        <Card
          title={`Antardashas inside the current ${current.lord} Mahadasha`}
          subtitle="Parashari proportion: each sub-period lasts (its lord's years ÷ 120) of the Mahadasha span — the same table the Red Book prints"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-fog">
                  <th className="py-2 pr-3 font-medium">Antardasha</th>
                  <th className="py-2 pr-3 font-medium">Starts</th>
                  <th className="py-2 font-medium">Ends</th>
                </tr>
              </thead>
              <tbody>
                {currentSubs.map((s) => {
                  const isCurrentSub = currentSub?.startISO === s.startISO;
                  return (
                    <tr key={s.startISO} className={`border-t border-line ${isCurrentSub ? "bg-gold/5" : ""}`}>
                      <td className="py-2 pr-3 font-medium text-moon">
                        {current.lord} / {s.lord}
                        {isCurrentSub && <Badge tone="gold">current</Badge>}
                      </td>
                      <td className="py-2 pr-3 text-mist">{s.startISO.slice(0, 10)}</td>
                      <td className="py-2 text-mist">{s.endISO.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Graha positions — Rashi (D1)" subtitle="Sidereal sign placements; tropical shown so the ayanamsa shift is visible">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Graha</th>
                <th className="py-2 pr-3 font-medium">Sidereal position</th>
                <th className="py-2 pr-3 font-medium">Sidereal longitude</th>
                <th className="py-2 font-medium">Tropical longitude</th>
              </tr>
            </thead>
            <tbody>
              {chart.grahas.map((g) => (
                <tr key={g.body} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium text-moon">{g.graha}</td>
                  <td className="py-2 pr-3 text-gold-2">{formatInSign(g.sidereal)}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-mist">{g.sidereal.toFixed(3)}°</td>
                  <td className="py-2 font-mono text-xs text-mist">{g.tropical.toFixed(3)}°</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="py-2 pr-3 font-medium text-moon">Lagna</td>
                <td className="py-2 pr-3 text-gold-2">{formatInSign(chart.lagna.sidereal)}</td>
                <td className="py-2 pr-3 font-mono text-xs text-mist">{chart.lagna.sidereal.toFixed(3)}°</td>
                <td className="py-2 text-mist">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fog">
          Uranus, Neptune and Pluto are not classical grahas and are excluded
          from the Rashi table in this build. Rahu/Ketu longitudes are not
          computed yet — astronomy-engine has no lunar-node ephemeris, and we
          do not invent positions. (The dasha below needs only the Moon.)
        </p>
      </Card>

      <Card
        title="Vimshottari dasha timeline"
        subtitle="Source: Brihat Parashara Hora Shastra — classical. 120-year cycle from the Moon's nakshatra."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Mahadasha</th>
                <th className="py-2 pr-3 font-medium">Starts</th>
                <th className="py-2 pr-3 font-medium">Ends</th>
                <th className="py-2 font-medium">Length</th>
              </tr>
            </thead>
            <tbody>
              {chart.dashas.map((d) => {
                const isCurrent = current?.startISO === d.startISO;
                return (
                  <tr
                    key={d.startISO}
                    className={`border-t border-line ${isCurrent ? "bg-gold/5" : ""}`}
                  >
                    <td className="py-2 pr-3 font-medium text-moon">
                      {d.lord}
                      {d.isBalance && <span className="ml-2 text-xs text-fog">(balance at birth)</span>}
                      {isCurrent && <Badge tone="gold">current</Badge>}
                    </td>
                    <td className="py-2 pr-3 text-mist">{d.startISO.slice(0, 10)}</td>
                    <td className="py-2 pr-3 text-mist">{d.endISO.slice(0, 10)}</td>
                    <td className="py-2 text-mist">{d.years.toFixed(2)} yrs</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="How this was calculated" subtitle="Show the math — differentiation rule 1">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mist">
          <li>
            Ayanamsa (Lahiri) for this instant: <span className="text-moon">{chart.ayanamsa.toFixed(4)}°</span> =
            23.857° (2000-01-01, Swiss Ephemeris value) + 50.28″ × elapsed years.
            Published check: 23.899° on 2003-01-01 — this formula gives 23.899°.
          </li>
          <li>
            Moon: tropical {moon.tropical.toFixed(3)}° − ayanamsa {chart.ayanamsa.toFixed(3)}° =
            sidereal <span className="text-moon">{moon.sidereal.toFixed(3)}°</span> ({formatInSign(moon.sidereal)}).
          </li>
          <li>
            Nakshatra: {moon.sidereal.toFixed(3)}° ÷ 13.333° = {(moon.sidereal / 13.3333).toFixed(2)} →{" "}
            {chart.moonNakshatra.name} (span {chart.moonNakshatra.startDeg.toFixed(2)}°–
            {chart.moonNakshatra.endDeg.toFixed(2)}°), pada {chart.moonNakshatra.pada},{" "}
            {(chart.moonNakshatra.traversed * 100).toFixed(1)}% traversed.
          </li>
          <li>
            Dasha balance: (1 − {(chart.moonNakshatra.traversed).toFixed(3)}) ×{" "}
            {chart.moonNakshatra.lord}'s full period = {chart.dashas[0].years.toFixed(2)} years
            remaining at birth; later periods run full length in the classical
            sequence, added as 365.25-day years.
          </li>
          <li>{chart.method}</li>
        </ul>
      </Card>
    </div>
  );
}
