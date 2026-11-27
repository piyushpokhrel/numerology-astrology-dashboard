"use client";

import { useState, type FormEvent } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { Badge, Button, Card, Field, Input, PageHeader, Stat } from "@/components/ui";
import { nameCheckSchema, zodFieldErrors, type FieldErrors } from "@/lib/schemas";
import { displayNumber } from "@/lib/numerology";
import type { NameCheckResult, Verdict } from "@/lib/namecheck";

const VERDICT_UI: Record<Verdict, { label: string; dot: string; tone: "jade" | "amber" | "rose"; blurb: string }> = {
  harmonious: {
    label: "Harmonious",
    dot: "bg-jade",
    tone: "jade",
    blurb: "The name's numbers resonate with the founder's core numbers in both systems.",
  },
  workable: {
    label: "Workable",
    dot: "bg-amber",
    tone: "amber",
    blurb: "Some resonance, some neutrality. Viable — compare against a variant or two before deciding.",
  },
  friction: {
    label: "Friction",
    dot: "bg-rose",
    tone: "rose",
    blurb: "Little traditional resonance with the founder's numbers. Tradition would suggest testing alternatives.",
  },
};

export default function NameCheckerPage() {
  const { profile } = useProfile();

  const [name, setName] = useState("");
  const [founderName, setFounderName] = useState("");
  const [founderDob, setFounderDob] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<NameCheckResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Seed founder fields from the stored profile once it loads.
  const [seeded, setSeeded] = useState(false);
  if (profile && !seeded) {
    setSeeded(true);
    setFounderName(profile.fullName);
    setFounderDob(profile.dob);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input = { name, founderName, founderDob };
    const local = nameCheckSchema.safeParse(input);
    if (!local.success) {
      setErrors(zodFieldErrors(local.error));
      setResult(null);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.data),
      });
      const data = (await res.json()) as {
        ok: boolean;
        errors?: FieldErrors;
        result?: NameCheckResult;
      };
      if (!data.ok) {
        setErrors(data.errors ?? { _form: ["The server rejected this check."] });
        setResult(null);
        return;
      }
      setResult(data.result ?? null);
    } catch {
      setErrors({ _form: ["Could not reach the checker service. Try again."] });
    } finally {
      setBusy(false);
    }
  }

  const verdict = result ? VERDICT_UI[result.verdict] : null;

  return (
    <div>
      <PageHeader
        title="Name checker"
        blurb="Score a business or personal name against the founder's birth numbers. Scoring is documented and deterministic: exact Life Path match +30 per system, same harmony triad +15, Destiny match +20."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Check a name" className="lg:col-span-2">
          <form onSubmit={onSubmit} noValidate className="grid gap-5">
            {errors._form && (
              <p className="rounded-lg border border-rose/50 bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
                {errors._form[0]}
              </p>
            )}
            <Field label="Name to check" error={errors.name}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Holisticseason"
                invalid={!!errors.name}
              />
            </Field>
            <Field label="Founder full name" error={errors.founderName}>
              <Input
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="e.g. Piyush Pokhrel"
                invalid={!!errors.founderName}
              />
            </Field>
            <Field label="Founder date of birth" error={errors.founderDob}>
              <Input
                type="date"
                value={founderDob}
                onChange={(e) => setFounderDob(e.target.value)}
                invalid={!!errors.founderDob}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Scoring…" : "Score this name"}
            </Button>
          </form>
        </Card>

        <Card title="Result" className="lg:col-span-3">
          {!result || !verdict ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
              <div className="text-4xl text-fog">✓</div>
              <p className="mt-3 max-w-sm text-sm text-mist">
                Enter a name and the founder's details, and the verdict will
                appear here — with the full reasoning, never just a score.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`h-4 w-4 rounded-full ${verdict.dot} shadow-[0_0_16px_2px_currentColor]`} />
                <span className="text-xl font-bold text-moon">{verdict.label}</span>
                <Badge tone={verdict.tone}>{result.score} / 100</Badge>
                <span className="text-sm text-mist">
                  “{result.name}” for {result.founderName}
                </span>
              </div>
              <p className="mt-2 text-sm text-mist">{verdict.blurb}</p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-2">
                <div
                  className={`h-full rounded-full ${verdict.dot}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Chaldean root" value={displayNumber(result.chaldean.root)} accent sub={`compound ${result.chaldean.compound}`} />
                <Stat label="Pythagorean root" value={displayNumber(result.pythagorean.root)} accent sub={`compound ${result.pythagorean.compound}`} />
                <Stat label="Founder Life Path" value={displayNumber(result.lifePath)} />
                <Stat label="Founder Destiny" value={displayNumber(result.destiny)} />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-moon">Why this score</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-mist">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold">·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-fog">
                The Chaldean compound ({result.chaldean.compound}) is shown
                because Chaldean tradition reads the compound itself, not
                only its root. The score uses roots so both systems are
                comparable.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
