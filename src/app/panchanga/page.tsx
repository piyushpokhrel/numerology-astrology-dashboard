"use client";

import { useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { Badge, Card, PageHeader } from "@/components/ui";
import {
  formatLocalTime,
  panchangaDay,
  siderealLongitudes,
  type PanchangaLocation,
} from "@/lib/panchanga";
import { PLACE_PRESETS, resolveLocation } from "@/lib/geo";
import { chineseProfile, dayPillar, relationBetween, RELATION_LABELS } from "@/lib/chinese";
import { coreProfile } from "@/lib/numerology";
import { antardashaAt, dashaAt, vedicChart } from "@/lib/vedic";
import { signOf } from "@/lib/western";
import type { ChartInput } from "@/lib/western";
import { formatLongDate } from "@/lib/profile";

const PARCH = "rounded-2xl border border-[#8a6d3b]/50 bg-[#f3e9d2] text-[#3a2410] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)]";
const PARCH_HEAD = "font-display text-[#7a1f1f]";
const RULE = "border-[#8a6d3b]/40";

export default function PanchangaPage() {
  const { profile, loaded, today } = useProfile();
  const [dateISO, setDateISO] = useState<string>(today || "2026-11-27");
  const [presetId, setPresetId] = useState<string>("");
  const [manual, setManual] = useState({ label: "", lat: "", lon: "", offset: "" });

  const location: PanchangaLocation = useMemo(() => {
    const r = resolveLocation(
      manual.lat && manual.lon
        ? {
            label: manual.label,
            latitude: Number(manual.lat),
            longitudeEast: Number(manual.lon),
            utcOffsetHours: Number(manual.offset || 0),
          }
        : presetId
          ? { presetId }
          : null,
    );
    return {
      label: r.label,
      latitude: r.latitude,
      longitudeEast: r.longitudeEast,
      timeZone: r.timeZone,
      utcOffsetMinutes: r.timeZone ? undefined : Math.round(r.utcOffsetHours * 60),
      approximate: r.approximate,
    };
  }, [presetId, manual]);

  const day = useMemo(() => panchangaDay(dateISO, location), [dateISO, location]);
  const ft = (d: Date | null) => (d ? formatLocalTime(d, location) : "—");

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Panchanga — the daily almanac"
        blurb="Flip to any day — past, present or future — and read its five limbs, its timings and its windows, computed for the place you choose. Free, like every calculator on this site."
        action={<Badge tone="gold">TRADITION · computed daily</Badge>}
      />

      <div className={`${PARCH} mb-4 p-5`}>
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7a1f1f]">Day</span>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="mt-1 block rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-3 py-2 text-sm text-[#3a2410]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7a1f1f]">Place</span>
            <select
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              className="mt-1 block rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-3 py-2 text-sm text-[#3a2410]"
            >
              <option value="">Toronto, Canada (default)</option>
              {PLACE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7a1f1f]">…or any place on Earth (lat / lon / UTC offset h)</span>
              <span className="mt-1 flex gap-2">
                <input placeholder="Name" value={manual.label} onChange={(e) => setManual({ ...manual, label: e.target.value })} className="w-32 rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-2 py-2 text-sm" />
                <input placeholder="28.0483" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} className="w-24 rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-2 py-2 text-sm" />
                <input placeholder="82.4866" value={manual.lon} onChange={(e) => setManual({ ...manual, lon: e.target.value })} className="w-24 rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-2 py-2 text-sm" />
                <input placeholder="5.75" value={manual.offset} onChange={(e) => setManual({ ...manual, offset: e.target.value })} className="w-16 rounded-lg border border-[#8a6d3b]/60 bg-[#fbf5e3] px-2 py-2 text-sm" />
              </span>
            </label>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#6b4f2a]">
          {formatLongDate(dateISO)} · {day.weekday} (vara lord: {day.weekdayLord}) · {location.label}
          {location.approximate && " — approximate location: the default. Add a birthplace or pick a place for exact sunrise timings."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${PARCH} p-5`}>
          <h2 className={`text-lg font-semibold ${PARCH_HEAD}`}>The Five Limbs — Pancha Anga</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div className={`border-b ${RULE} pb-2`}>
              <dt className="font-semibold">1 · Tithi</dt>
              <dd>{day.tithi.paksha} Paksha {day.tithi.name} (tithi {day.tithi.number}) — ends {ft(day.tithiEndsAt)}.
                {day.tithiNote === "kshaya" && " Kshaya note: a tithi is skipped between this sunrise and the next — the almanac calls it a lost tithi."}
                {day.tithiNote === "vriddhi" && " Vriddhi note: this tithi repeats at the next sunrise — an expanded tithi."}
                {!day.tithiNote && " No kshaya/vriddhi at this precision."}</dd>
            </div>
            <div className={`border-b ${RULE} pb-2`}>
              <dt className="font-semibold">2 · Vara</dt>
              <dd>{day.weekday}, ruled by {day.weekdayLord}.</dd>
            </div>
            <div className={`border-b ${RULE} pb-2`}>
              <dt className="font-semibold">3 · Nakshatra</dt>
              <dd>{day.nakshatra.name}, pada {day.nakshatra.pada} (lord {day.nakshatra.lord}) — changes {ft(day.nakshatraEndsAt)}.</dd>
            </div>
            <div className={`border-b ${RULE} pb-2`}>
              <dt className="font-semibold">4 · Yoga</dt>
              <dd>{day.yoga.name} (yoga {day.yoga.number} of 27).</dd>
            </div>
            <div>
              <dt className="font-semibold">5 · Karana</dt>
              <dd>First half of the tithi: {day.karanaFirst.name} · second half: {day.karanaSecond.name}.</dd>
            </div>
          </dl>
        </section>

        <section className={`${PARCH} p-5`}>
          <h2 className={`text-lg font-semibold ${PARCH_HEAD}`}>The Day&apos;s Timings</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Sunrise</dt><dd className="font-semibold">{ft(day.sunrise)}</dd></div>
            <div className="flex justify-between"><dt>Sunset</dt><dd className="font-semibold">{ft(day.sunset)}</dd></div>
            <div className="flex justify-between"><dt>Moonrise</dt><dd className="font-semibold">{ft(day.moonrise)}</dd></div>
            <div className="flex justify-between"><dt>Moonset</dt><dd className="font-semibold">{ft(day.moonset)}</dd></div>
          </dl>
          <h3 className={`mt-4 text-base font-semibold ${PARCH_HEAD}`}>Shubh Sahit — auspicious windows</h3>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Abhijit Muhurat</dt><dd className="font-semibold">{day.abhijit ? `${ft(day.abhijit.start)} – ${ft(day.abhijit.end)}` : "—"}</dd></div>
            <div className="flex justify-between"><dt>Amrit Kalam</dt><dd className="font-semibold">{day.amritKalam ? `${ft(day.amritKalam.start)} – ${ft(day.amritKalam.end)}` : "none begins this panchanga day"}</dd></div>
            <div className="flex justify-between"><dt>Brahma Muhurta</dt><dd className="font-semibold">{day.brahmaMuhurta ? `${ft(day.brahmaMuhurta.start)} – ${ft(day.brahmaMuhurta.end)}` : "—"}</dd></div>
          </dl>
          <h3 className={`mt-4 text-base font-semibold ${PARCH_HEAD}`}>Windows tradition avoids for new beginnings</h3>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Rahu Kalam</dt><dd className="font-semibold">{day.rahuKalam ? `${ft(day.rahuKalam.start)} – ${ft(day.rahuKalam.end)}` : "—"}</dd></div>
            <div className="flex justify-between"><dt>Yamaganda</dt><dd className="font-semibold">{day.yamaganda ? `${ft(day.yamaganda.start)} – ${ft(day.yamaganda.end)}` : "—"}</dd></div>
            <div className="flex justify-between"><dt>Gulika Kalam</dt><dd className="font-semibold">{day.gulikaKalam ? `${ft(day.gulikaKalam.start)} – ${ft(day.gulikaKalam.end)}` : "—"}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-[#6b4f2a]">
            Formula, shown: daylight (sunrise → sunset) is divided into 8 equal parts; the weekday assigns one
            part to each window (Rahu part for {day.weekday} per the published table). Tradition avoids these
            windows for new beginnings — reported as tradition, in plain words, with no fear attached.
          </p>
        </section>
      </div>

      <section className={`${PARCH} mt-4 p-5`}>
        <h2 className={`text-lg font-semibold ${PARCH_HEAD}`}>Hora — the planetary hours</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {day.horas.map((h, i) => (
            <div key={i} className={`flex justify-between border-b ${RULE} py-1`}>
              <span>{h.day ? "Day" : "Night"} hora {h.day ? i + 1 : i - 11} · {h.lord}</span>
              <span className="font-medium">{ft(h.start)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#6b4f2a]">Daylight and the night are each divided into 12 horas; the first day hora belongs to the weekday lord, and the sequence follows the Chaldean order.</p>
      </section>

      {profile ? (
        <div className="mt-4">
          <ChartWorkbench>
            {(input) => (
              <ProfileDay key={input.utc.toISOString()} input={input} dateISO={dateISO} location={location} />
            )}
          </ChartWorkbench>
        </div>
      ) : (
        <Card title="Your day + dasha lookup" className="mt-4">
          <p className="text-sm text-mist">Create a profile and this page adds your Personal Year/Month/Day for the chosen date, the Mahadasha + Antardasha running that day, your Moon sign that day, and the day&apos;s Chinese almanac relation to your sign. The almanac above is complete without a profile.</p>
        </Card>
      )}

      <Card title="How this page is calculated" subtitle="SCIENCE for the astronomy · TRADITION for the limbs and windows" className="mt-4">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mist">
          <li>At sunrise ({ft(day.sunrise)}): Sun sidereal {day.longitudes.sun.toFixed(2)}°, Moon sidereal {day.longitudes.moon.toFixed(2)}°, ayanamsa (Lahiri) {day.longitudes.ayanamsa.toFixed(3)}°.</li>
          <li>Tithi: elongation {(day.tithi.elongation).toFixed(2)}° ÷ 12° → tithi {day.tithi.number}. Yoga: (Sun + Moon) {day.yoga.sum.toFixed(2)}° ÷ 13°20′ → yoga {day.yoga.number}. Karana: elongation ÷ 6° → half {day.karanaFirst.halfIndex + 1} of 60.</li>
          <li>{day.method}</li>
          <li>Amrit Kalam: 4 ghatis (4/60 of the Moon&apos;s transit through {day.nakshatra.name}) from that nakshatra&apos;s published Amrita-ghati start — the classical table, not a guess.</li>
        </ul>
      </Card>
    </div>
  );

  function ProfileDay({ input, dateISO, location }: { input: ChartInput; dateISO: string; location: PanchangaLocation }) {
    const data = useMemo(() => {
      if (!profile) return null;
      const core = coreProfile(profile.fullName, profile.dob, dateISO);
      const vedic = vedicChart(input);
      const at = new Date(`${dateISO}T12:00:00Z`);
      const md = dashaAt(vedic.dashas, at);
      const ad = md ? antardashaAt(md, at) : null;
      const cp = chineseProfile(profile.dob);
      const dp = dayPillar(dateISO);
      const relation = relationBetween(cp.animal, dp.animal);
      return { core, md, ad, cp, dp, relation, vedic };
    }, [input, dateISO]);
    if (!data) return null;
    const moonSign = signOf((vedicMoonSidereal(dateISO)));
    return (
      <section className={`${PARCH} p-5`}>
        <h2 className={`text-lg font-semibold ${PARCH_HEAD}`}>Your day + dasha — {profile!.fullName} on {formatLongDate(dateISO)}</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>Personal Year <strong>{data.core.personalYear}</strong> · Month <strong>{data.core.personalMonth}</strong> · Day <strong>{data.core.personalDay}</strong> <span className="text-[#6b4f2a]">(numerology — MODERN method)</span></p>
          <p>Dasha: <strong>{data.md ? `${data.md.lord} Mahadasha` : "—"}</strong>{data.ad ? ` · ${data.ad.lord} Antardasha (${data.ad.startISO.slice(0, 10)} → ${data.ad.endISO.slice(0, 10)})` : ""} <span className="text-[#6b4f2a]">(BPHS — classical)</span></p>
          <p>Moon sign that day (gochar): <strong>{moonSign}</strong> <span className="text-[#6b4f2a]">(sidereal, from the day&apos;s Moon)</span></p>
          <p>Chinese almanac: the day&apos;s pillar animal is <strong>{data.dp.animal}</strong> ({data.dp.stem}-{data.dp.branch}) — {RELATION_LABELS[data.relation]} to your {data.cp.animal}.</p>
          <p className="sm:col-span-2 lg:col-span-3">
            Day verdict, assembled honestly: {dayVerdict(dateISO, location)} Each element is labelled with its
            source above; nothing here is a prediction — it is the day&apos;s traditional weather, computed.
          </p>
        </div>
      </section>
    );
  }
}

function vedicMoonSidereal(dateISO: string): number {
  return siderealLongitudes(new Date(`${dateISO}T12:00:00Z`)).moon;
}
function dayVerdict(dateISO: string, location: PanchangaLocation): string {
  const d = panchangaDay(dateISO, location);
  return `Tithi ${d.tithi.name} (${d.tithi.paksha} paksha) with yoga ${d.yoga.name} — per tradition a ${["Vishkambha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"].includes(d.yoga.name) ? "demanding" : "workable"} combination; the Shubh Sahit windows above are the day's traditionally favoured hours.`;
}
