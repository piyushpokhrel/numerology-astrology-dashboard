"use client";

/**
 * Voice narration player (milestone 13) — real playback of the full
 * narration script (src/lib/narration.ts) through the browser's
 * speechSynthesis. No audio is generated or uploaded by any server:
 * the voice is the one installed on the visitor's own device, the
 * script is computed locally from the profile, and the .txt download
 * is generated in the browser.
 *
 * Controls: Play all (chaining section to section), Pause, Resume,
 * Stop, Previous / Next section, playback rate, and a voice picker
 * fed by speechSynthesis.getVoices() (with the voiceschanged event,
 * since browsers populate the list asynchronously). The section being
 * spoken is highlighted and scrolled into view, with its transcript
 * visible — section-level sync with playback position.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { loadChartSettings } from "@/components/ChartWorkbench";
import { buildNarration } from "@/lib/narration";
import type { Profile } from "@/lib/profile";
import type { ChartInput } from "@/lib/western";
import { PLACE_PRESETS } from "@/lib/geo";
import type { PanchangaLocation } from "@/lib/panchanga";

type PlayStatus = "idle" | "playing" | "paused";

/**
 * The Panchanga location for today's windows, taken from the chart
 * settings the visitor has actually confirmed in the workbench on
 * this page (a preset place, or their custom coordinates). The site's
 * labelled Toronto default is passed as approximate, exactly as the
 * workbench itself labels it.
 */
function panchangaLocationFromSettings(): PanchangaLocation {
  const s = loadChartSettings();
  const preset = PLACE_PRESETS.find((p) => p.id === s.cityId);
  if (preset) {
    return {
      label: preset.label,
      latitude: preset.latitude,
      longitudeEast: preset.longitudeEast,
      timeZone: preset.timeZone,
      approximate: preset.id === "toronto",
    };
  }
  const latitude = Number(s.latitude);
  const longitudeEast = Number(s.longitudeEast);
  const offset = Number(s.utcOffset);
  return {
    label: "Your chart location",
    latitude: Number.isFinite(latitude) ? latitude : 43.65,
    longitudeEast: Number.isFinite(longitudeEast) ? longitudeEast : -79.38,
    utcOffsetMinutes: Number.isFinite(offset) ? Math.round(offset * 60) : 0,
  };
}

export function VoiceNarration({
  profile,
  onDate,
  chartInput,
}: {
  profile: Profile;
  onDate: string;
  chartInput: ChartInput;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<PlayStatus>("idle");
  const [current, setCurrent] = useState(0);
  const statusRef = useRef<PlayStatus>("idle");
  const currentRef = useRef(0);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const narration = useMemo(
    () =>
      buildNarration(profile, onDate, {
        chartInput,
        panchangaLocation: panchangaLocationFromSettings(),
      }),
    [profile, onDate, chartInput],
  );

  // Capability + voice list (voices arrive asynchronously in most browsers).
  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    if (!ok) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Cancel speech on unmount, and whenever the profile/date changes
  // (a new script must never be spoken over the old one).
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      statusRef.current = "idle";
    };
  }, [profile, onDate]);

  function setStatusBoth(next: PlayStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  function speakFrom(index: number) {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const section = narration.sections[index];
    if (!section) {
      setStatusBoth("idle");
      return;
    }
    currentRef.current = index;
    setCurrent(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const utter = new SpeechSynthesisUtterance(section.spokenText);
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.onend = () => {
      if (statusRef.current !== "playing") return;
      const next = index + 1;
      if (next < narration.sections.length) {
        speakFrom(next);
      } else {
        setStatusBoth("idle");
        currentRef.current = 0;
        setCurrent(0);
      }
    };
    utter.onerror = () => {
      if (statusRef.current === "playing") setStatusBoth("idle");
    };
    setStatusBoth("playing");
    synth.speak(utter);
  }

  function pause() {
    window.speechSynthesis.pause();
    setStatusBoth("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setStatusBoth("playing");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setStatusBoth("idle");
  }

  function downloadScript() {
    const blob = new Blob(
      [
        `AstroNumerology — Voice Narration\n${narration.profileName} · generated for ${narration.generatedFor}\n` +
          `About ${narration.estimatedMinutes} minutes spoken (${narration.wordCount} words).\n` +
          `Every figure is computed by the site's engines; interpretations are traditional.\n\n` +
          narration.fullText +
          "\n",
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `narration-${narration.profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card
      title="Voice narration — your full reading, read aloud"
      subtitle={`Five sections, about ${narration.estimatedMinutes} minutes: your details, the charts in depth, your challenges, your fruitful times, and where the systems agree. Free, like every calculator on this site.`}
      className="mb-4 print:hidden"
    >
      {supported === false ? (
        <p className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm leading-relaxed text-amber">
          This browser does not offer speech synthesis, so the reading cannot be played aloud here.
          The full narration script is below — read it on screen, or download it and use any reader
          you like. Nothing about your calculations changes.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {status !== "playing" && status !== "paused" && (
              <Button onClick={() => speakFrom(current)}>Play all</Button>
            )}
            {status === "playing" && (
              <Button onClick={pause}>Pause</Button>
            )}
            {status === "paused" && (
              <Button onClick={resume}>Resume</Button>
            )}
            <Button
              variant="ghost"
              onClick={() => speakFrom(Math.max(0, currentRef.current - 1))}
              disabled={narration.sections.length === 0}
            >
              Previous section
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                speakFrom(Math.min(narration.sections.length - 1, currentRef.current + 1))
              }
            >
              Next section
            </Button>
            <Button variant="subtle" onClick={stop} disabled={status === "idle"}>
              Stop
            </Button>
            <Button variant="subtle" onClick={downloadScript}>
              Download script (.txt)
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-mist">
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-fog">Voice</span>
              <select
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="rounded-lg border border-line bg-night px-2 py-1.5 text-sm text-moon focus:border-gold/60 focus:outline-none"
              >
                <option value="">Browser default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-fog">Speed</span>
              <select
                value={String(rate)}
                onChange={(e) => setRate(Number(e.target.value))}
                className="rounded-lg border border-line bg-night px-2 py-1.5 text-sm text-moon focus:border-gold/60 focus:outline-none"
              >
                <option value="0.8">0.8×</option>
                <option value="0.9">0.9×</option>
                <option value="1">1×</option>
                <option value="1.1">1.1×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
              </select>
              <span className="text-xs text-fog">applies from the next section</span>
            </label>
            <span className="text-xs text-fog">
              {status === "playing"
                ? `Now reading: ${narration.sections[current]?.title}`
                : status === "paused"
                  ? `Paused in: ${narration.sections[current]?.title}`
                  : "Not playing"}
            </span>
          </div>
        </>
      )}

      <div className="mt-4 space-y-3">
        {narration.sections.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              i === current && status !== "idle"
                ? "border-gold/70 bg-gold/10"
                : "border-line bg-panel-2/60"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-moon">
                {i + 1} · {s.title}
                {i === current && status !== "idle" && (
                  <span className="ml-2 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-2">
                    {status === "playing" ? "Reading now" : "Paused here"}
                  </span>
                )}
              </h3>
              {supported && (
                <button
                  onClick={() => speakFrom(i)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-mist hover:border-gold/60 hover:text-moon"
                >
                  Play this section
                </button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mist">
              {s.displayText}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-fog hover:text-mist">
                Full spoken transcript of this section
              </summary>
              <p className="mt-1 text-sm leading-relaxed text-mist">{s.spokenText}</p>
            </details>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-fog">
        The voice is your browser&apos;s own speech voice and the script is computed on this device
        from your profile — no recording of you is made, and no audio is sent to any server.
        Interpretations in the narration are traditional readings, for reflection and entertainment.
      </p>
    </Card>
  );
}
