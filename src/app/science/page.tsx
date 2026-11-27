"use client";

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, NoProfile, PageHeader } from "@/components/ui";
import {
  formatLightTime,
  planetChanges,
  SCIENCE_HONESTY_PANEL,
} from "@/lib/science";
import { allCorrespondences, CORRESPONDENCE_SOURCE } from "@/lib/metaphysics";
import { coreProfile, personalYear } from "@/lib/numerology";
import { chineseProfile, yearOutlook, zodiacYearForDate } from "@/lib/chinese";
import { dashaAt, vedicChart } from "@/lib/vedic";
import type { ChartInput } from "@/lib/western";
import { formatLongDate } from "@/lib/profile";

export default function SciencePage() {
  const { profile, loaded, today } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The science layer" />;

  return (
    <div>
      <PageHeader
        title="Science — measured positions, distances, motion"
        blurb={`${profile.fullName} · what astronomy actually measures at your birth instant and today — and, separately and clearly labelled, what tradition makes of it.`}
        action={<Badge tone="gold">SCIENCE · measured</Badge>}
      />
      <ChartWorkbench>
        {(input) => (
          <ScienceResults key={input.utc.toISOString()} input={input} today={today} dob={profile.dob} />
        )}
      </ChartWorkbench>
    </div>
  );
}

function fmtKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

function ScienceResults({ input, today, dob }: { input: ChartInput; today: string; dob: string }) {
  const now = useMemo(() => new Date(), []);
  const changes = useMemo(() => planetChanges(input.utc, now), [input, now]);
  const correspondences = useMemo(() => allCorrespondences(), []);
  const tradition = useMemo(() => {
    if (!today) return null;
    const core = coreProfile("—", dob, today); // name unused for cycles
    const birthYear = Number(dob.slice(0, 4));
    const pyAtBirth = personalYear(dob, `${birthYear}-06-01`);
    const vedic = vedicChart(input);
    const dashaBirth = dashaAt(vedic.dashas, input.utc);
    const dashaNow = dashaAt(vedic.dashas, new Date(`${today}T12:00:00`));
    const cp = chineseProfile(dob);
    const relationNow = yearOutlook(cp, zodiacYearForDate(today)).relation;
    return { core, pyAtBirth, dashaBirth, dashaNow, relationNow, cp };
  }, [input, today, dob]);

  return (
    <div className="grid gap-4">
      <Card title="The honesty panel — this product's trust signature" subtitle="Read this first. It never changes.">
        <div className="space-y-2">
          {SCIENCE_HONESTY_PANEL.map((line) => (
            <p key={line.slice(0, 24)} className="text-sm leading-relaxed text-mist">{line}</p>
          ))}
        </div>
      </Card>

      <Card
        title="Measured: birth instant vs today"
        subtitle={`Birth instant (UTC): ${input.utc.toISOString()} · Today: ${now.toISOString().slice(0, 10)} · distances from geocentric vectors (astronomy-engine), light time = distance ÷ c`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Body</th>
                <th className="py-2 pr-3 font-medium">Distance at birth</th>
                <th className="py-2 pr-3 font-medium">Distance today</th>
                <th className="py-2 pr-3 font-medium">Change</th>
                <th className="py-2 pr-3 font-medium">Light time at birth</th>
                <th className="py-2 pr-3 font-medium">Speed today</th>
                <th className="py-2 font-medium">Orbits since birth</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.name} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium text-moon">{c.name}</td>
                  <td className="py-2 pr-3 text-mist">{c.atBirth.distanceAU.toFixed(4)} AU<br /><span className="text-xs text-fog">{fmtKm(c.atBirth.distanceKm)}</span></td>
                  <td className="py-2 pr-3 text-mist">{c.today.distanceAU.toFixed(4)} AU<br /><span className="text-xs text-fog">{fmtKm(c.today.distanceKm)}</span></td>
                  <td className="py-2 pr-3 text-mist">{c.distanceDeltaKm >= 0 ? "+" : "−"}{fmtKm(Math.abs(c.distanceDeltaKm))}</td>
                  <td className="py-2 pr-3 text-mist">{formatLightTime(c.atBirth.lightSeconds)}</td>
                  <td className="py-2 pr-3 text-mist">{c.today.speedDegPerDay.toFixed(3)}°/day{c.today.retrograde ? " (retrograde)" : ""}</td>
                  <td className="py-2 text-mist">{c.orbitsCompleted} full · {c.degreesTravelled.toFixed(0)}° travelled</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fog">
          Longitude at birth vs today is in each body&apos;s full state on the report; speeds are finite differences
          of geocentric longitude over one day — apparent motion as seen from Earth, which is why inner planets
          periodically run retrograde. Orbital periods: published sidereal values (NASA/JPL fact sheets).
        </p>
      </Card>

      <Card
        title="Metaphysics — traditional correspondences"
        subtitle="Labelled METAPHYSICS/TRADITIONAL — correspondences from classical and modern tables, never physics"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-fog">
                <th className="py-2 pr-3 font-medium">Planet</th>
                <th className="py-2 pr-3 font-medium">Number</th>
                <th className="py-2 pr-3 font-medium">Metal</th>
                <th className="py-2 pr-3 font-medium">Weekday</th>
                <th className="py-2 font-medium">Cosmic Octave tone (Cousto, MODERN)</th>
              </tr>
            </thead>
            <tbody>
              {correspondences.map((c) => (
                <tr key={c.planet} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium text-moon">{c.planet}</td>
                  <td className="py-2 pr-3 text-mist">{c.number ?? "— (no classical number)"}</td>
                  <td className="py-2 pr-3 text-mist">{c.metal ?? "— (outer planet; the classical table predates its discovery)"}</td>
                  <td className="py-2 pr-3 text-mist">{c.weekday ?? "—"}</td>
                  <td className="py-2 text-mist">{c.toneHz} Hz ≈ {c.toneNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-fog">{CORRESPONDENCE_SOURCE}</p>
      </Card>

      {tradition && (
        <Card
          title="“Change in energy” — expressed only as the traditions express it"
          subtitle="Computed cycle-phase changes since your birth. TRADITION labels on every line — these are the traditions' own clocks, not physical energies"
        >
          <div className="space-y-2 text-sm leading-relaxed text-mist">
            <p>
              <span className="text-moon">Numerology clock:</span> your Personal Year in your birth year was{" "}
              {tradition.pyAtBirth}; today ({today ? formatLongDate(today) : ""}) it is {tradition.core.personalYear}.
              The 9-year cycle has turned {Math.max(0, Number(today.slice(0, 4)) - Number(dob.slice(0, 4)))} times since birth —
              the phase changed; that is the whole claim, and it is arithmetic.
            </p>
            <p>
              <span className="text-moon">Vedic clock:</span> you were born inside the{" "}
              {tradition.dashaBirth ? `${tradition.dashaBirth.lord} Mahadasha` : "—"}; today you are in the{" "}
              {tradition.dashaNow ? `${tradition.dashaNow.lord} Mahadasha` : "—"}
              {tradition.dashaBirth && tradition.dashaNow && tradition.dashaBirth.lord !== tradition.dashaNow.lord
                ? ` — the period lord changed on ${tradition.dashaNow.startISO.slice(0, 10)}, a real date in your computed timeline.`
                : "."}
            </p>
            <p>
              <span className="text-moon">Chinese clock:</span> your sign is {tradition.cp.element} {tradition.cp.animal};
              the current year stands in {tradition.relationNow} relation to it. Year relations turn with each
              Lunar New Year — again, a calendar fact inside a traditional frame.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
