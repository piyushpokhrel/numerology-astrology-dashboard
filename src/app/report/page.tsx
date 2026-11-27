"use client";

/**
 * The unified report — all four systems for one profile on a single
 * printable document. Styled as light "paper" so it prints cleanly
 * (browser: Print → Save as PDF). Every section shows its math or its
 * source, per the differentiation spec.
 */

import { useMemo } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Button, NoProfile, PageHeader } from "@/components/ui";
import { coreProfile } from "@/lib/numerology";
import { numberMeaning } from "@/lib/meanings";
import { chineseProfile, yearOutlook } from "@/lib/chinese";
import { formatInSign, westernChart, type ChartInput } from "@/lib/western";
import { dashaAt, vedicChart } from "@/lib/vedic";
import { formatDateTime, formatLongDate } from "@/lib/profile";

const paper = "rounded-none bg-[#faf8f1] text-neutral-900 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] sm:rounded-lg";
const h2 = "mt-8 border-b-2 border-neutral-800 pb-1 text-lg font-bold tracking-tight first:mt-0";
const h3 = "mt-5 text-sm font-bold uppercase tracking-wider text-neutral-600";
const td = "py-1 pr-4 align-top";
const src = "mt-2 text-[11px] italic text-neutral-500";

export default function ReportPage() {
  const { profile, loaded, today } = useProfile();

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The full report" />;

  return (
    <div>
      <PageHeader
        title="Full report"
        blurb="Every system, one profile, one document — built to print or save as PDF."
        action={
          <Button onClick={() => window.print()} className="print:hidden">
            Print / Save PDF
          </Button>
        }
      />

      <ChartWorkbench>
        {(input, meta) => (
          <ReportDocument
            key={input.utc.toISOString()}
            input={input}
            timeIsExact={meta.timeIsExact}
            today={today}
          />
        )}
      </ChartWorkbench>
    </div>
  );
}

function ReportDocument({
  input,
  timeIsExact,
  today,
}: {
  input: ChartInput;
  timeIsExact: boolean;
  today: string;
}) {
  const { profile } = useProfile();

  const data = useMemo(() => {
    if (!profile || !today) return null;
    const core = coreProfile(profile.fullName, profile.dob, today);
    const chinese = chineseProfile(profile.dob);
    const outlook2027 = yearOutlook(chinese, 2027);
    const western = westernChart(input);
    const vedic = vedicChart(input);
    const currentDasha = dashaAt(vedic.dashas, new Date(`${today}T12:00:00`));
    return { core, chinese, outlook2027, western, vedic, currentDasha };
  }, [profile, today, input]);

  if (!profile || !data) return null;
  const { core, chinese, outlook2027, western, vedic, currentDasha } = data;

  return (
    <article className={`${paper} px-6 py-8 sm:px-10`}>
      {/* Header */}
      <header className="border-b-4 border-double border-neutral-800 pb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
          AstroNumerology — Unified Report
        </div>
        <h1 className="mt-2 text-3xl font-bold">{profile.fullName}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Born {formatLongDate(profile.dob)}
          {profile.birthTime ? ` at ${profile.birthTime}` : " (birth time not provided)"} ·{" "}
          {profile.birthPlace}
        </p>
        <p className="text-xs text-neutral-500">
          Report generated for {today ? formatLongDate(today) : ""} · Profile last updated{" "}
          {formatDateTime(profile.updatedAt)} · Chart instant (UTC) {western.utcISO}
          {!timeIsExact && " · Noon assumed for the chart — angles are approximate without an exact birth time."}
        </p>
      </header>

      {/* Numerology */}
      <h2 className={h2}>1 · Numerology — Chaldean & Pythagorean</h2>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {[
          ["Life Path", `${core.lifePath} (compound ${core.lifePathCompound})`],
          ["Birthday", core.birthday],
          ["Attitude", core.attitude],
          ["Destiny — Pythagorean", core.destinyPythagorean],
          ["Destiny — Chaldean", core.destinyChaldean],
          ["Soul Urge", core.soulUrge],
          ["Personality", core.personality],
          ["Chaldean name", `${core.chaldeanName.root} (compound ${core.chaldeanName.compound})`],
          ["Pythagorean name", `${core.pythagoreanName.root} (compound ${core.pythagoreanName.compound})`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-neutral-200 py-1">
            <span className="text-neutral-600">{label}</span>
            <span className="font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <h3 className={h3}>Personal cycles — {today ? formatLongDate(today) : ""} (recomputed for this date)</h3>
      <p className="mt-1 text-sm">
        Personal Year <strong>{core.personalYear}</strong> — {numberMeaning(core.personalYear).text}.{" "}
        Personal Month <strong>{core.personalMonth}</strong>. Personal Day{" "}
        <strong>{core.personalDay}</strong>.
      </p>
      <p className={src}>
        Calculations: exact arithmetic, component method, shown in full on the Numerology page.
        Keyword lines: modern published numerology (Decoz method) — summaries. Chaldean table:
        Cheiro, Book of Numbers (1926) — modern-classical.
      </p>

      {/* Chinese */}
      <h2 className={h2}>2 · Chinese Astrology</h2>
      <p className="mt-3 text-sm">
        <strong>
          {chinese.element} {chinese.animal}
        </strong>{" "}
        ({chinese.polarity}) · zodiac year {chinese.zodiacYear}, opened{" "}
        {chinese.cnyDate ? formatLongDate(chinese.cnyDate) : ""}. Secret friend:{" "}
        {chinese.secretFriend} · Clash: {chinese.clash} · Trine: {chinese.trine.join(", ")}.
      </p>
      <h3 className={h3}>2027 outlook — Fire Goat year (from Feb 6, 2027)</h3>
      <p className="mt-1 text-sm">{outlook2027.headline} {outlook2027.notes[0]}</p>
      <p className={src}>Source: {outlook2027.source}.</p>

      {/* Western */}
      <h2 className={h2}>3 · Western Astrology — Tropical Chart</h2>
      <p className="mt-3 text-sm">
        Ascendant <strong>{formatInSign(western.ascendant)}</strong> · Midheaven{" "}
        <strong>{formatInSign(western.midheaven)}</strong> · Local sidereal time{" "}
        {western.lstDegrees.toFixed(2)}°
      </p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {western.positions.map((p) => (
            <tr key={p.body} className="border-b border-neutral-200">
              <td className={`${td} font-medium`}>{p.body}</td>
              <td className={td}>{formatInSign(p.longitude)}</td>
              <td className={`${td} font-mono text-xs`}>{p.longitude.toFixed(3)}°</td>
              <td className={td}>House {p.house} (whole sign)</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className={h3}>Major aspects ({western.aspects.length})</h3>
      <p className="mt-1 text-sm">
        {western.aspects.length === 0
          ? "None within orb."
          : western.aspects.map((a) => `${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(2)}°)`).join(" · ")}
      </p>
      <p className={src}>
        Positions: geocentric apparent longitudes via astronomy-engine; verified against
        published ephemerides within 0.013° (2003-01-01 check). Orbs: 6° standard, 8° with
        Sun/Moon, sextile 4°/6°.
      </p>

      {/* Vedic */}
      <h2 className={h2}>4 · Vedic Astrology — Sidereal (Lahiri)</h2>
      <p className="mt-3 text-sm">
        Ayanamsa <strong>{vedic.ayanamsa.toFixed(4)}°</strong> · Lagna{" "}
        <strong>{formatInSign(vedic.lagna.sidereal)}</strong> · Moon in{" "}
        <strong>{vedic.moonNakshatra.name}</strong>, pada {vedic.moonNakshatra.pada} (lord{" "}
        {vedic.moonNakshatra.lord})
        {currentDasha && (
          <>
            {" "}· Current Mahadasha: <strong>{currentDasha.lord}</strong> (
            {currentDasha.startISO.slice(0, 10)} → {currentDasha.endISO.slice(0, 10)})
          </>
        )}
      </p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {vedic.grahas.map((g) => (
            <tr key={g.body} className="border-b border-neutral-200">
              <td className={`${td} font-medium`}>{g.graha}</td>
              <td className={td}>{formatInSign(g.sidereal)}</td>
              <td className={`${td} font-mono text-xs`}>{g.sidereal.toFixed(3)}° sidereal</td>
              <td className={`${td} font-mono text-xs`}>{g.tropical.toFixed(3)}° tropical</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className={h3}>Vimshottari Mahadashas</h3>
      <p className="mt-1 text-sm">
        {vedic.dashas
          .map((d) => `${d.lord} ${d.startISO.slice(0, 10)} → ${d.endISO.slice(0, 10)}`)
          .join(" · ")}
      </p>
      <p className={src}>
        Source: Brihat Parashara Hora Shastra — classical. Ayanamsa: Lahiri, 23.857° @ 2000 +
        50.28″/yr (published check 23.899° on 2003-01-01). Rahu/Ketu longitudes are not computed
        in this build.
      </p>

      <footer className="mt-10 border-t border-neutral-300 pt-3 text-[11px] leading-relaxed text-neutral-500">
        Calculations in this report are exact and reproducible — the same profile always produces
        this same report (personal cycles are recomputed for the generation date shown above).
        Interpretations are traditional indications from the sources cited, presented for
        reflection and entertainment. They are not medical, financial or legal advice.
      </footer>
    </article>
  );
}
