"use client";

/**
 * Create / edit profile form.
 *
 * Validation flow (defence in depth):
 *   1. On submit, the shared zod schema runs in the browser and any
 *      field errors render inline immediately.
 *   2. The payload is then POSTed to /api/profile, which re-validates
 *      server-side; any server field errors replace the local ones.
 *   3. Only a server-accepted profile is stamped (createdAt/updatedAt)
 *      and persisted via the profile context — invalid data can never
 *      reach the engines or storage.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { profileSchema, zodFieldErrors, type FieldErrors, type ProfileInput } from "@/lib/schemas";
import { useProfile } from "./ProfileProvider";
import { Button, Field, Input } from "./ui";

export function ProfileForm({ redirectTo = "/report" }: { redirectTo?: string }) {
  const { profile, applyProfile, removeProfile } = useProfile();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [birthTime, setBirthTime] = useState(profile?.birthTime ?? "");
  const [birthPlace, setBirthPlace] = useState(profile?.birthPlace ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // When the stored profile loads after mount, seed the fields once.
  const [seeded, setSeeded] = useState(false);
  if (profile && !seeded) {
    setSeeded(true);
    setFullName(profile.fullName);
    setDob(profile.dob);
    setBirthTime(profile.birthTime ?? "");
    setBirthPlace(profile.birthPlace ?? "");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSavedNote(null);
    const input: ProfileInput = { fullName, dob, birthTime, birthPlace };

    const local = profileSchema.safeParse(input);
    if (!local.success) {
      setErrors(zodFieldErrors(local.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.data),
      });
      const data = (await res.json()) as {
        ok: boolean;
        errors?: FieldErrors;
        profile?: ProfileInput;
      };
      if (!data.ok) {
        setErrors(data.errors ?? { _form: ["The server rejected this profile."] });
        return;
      }
      const stamped = applyProfile(data.profile ?? local.data);
      setSavedNote(
        profile
          ? `Profile updated — every page now reflects the change. Last updated ${stamped.updatedAt}.`
          : "Profile created — your full report is ready.",
      );
      router.push(redirectTo);
    } catch {
      setErrors({ _form: ["Could not reach the validation service. Try again."] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {errors._form && (
        <p className="rounded-lg border border-rose/50 bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {errors._form[0]}
        </p>
      )}

      <Field label="Full name (as on your birth record)" error={errors.fullName}>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Piyush Pokhrel"
          autoComplete="name"
          invalid={!!errors.fullName}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of birth" error={errors.dob}>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            invalid={!!errors.dob}
          />
        </Field>
        <Field
          label="Birth time (optional)"
          error={errors.birthTime}
          hint="Needed later for the ascendant / rising sign."
        >
          <Input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            invalid={!!errors.birthTime}
          />
        </Field>
      </div>

      <Field
        label="Birth place (optional)"
        error={errors.birthPlace}
        hint="Any city or town on Earth — used by the Western and Vedic charts. Leave blank and place-dependent results use a labelled default; numerology, Chinese and name results are exact without it."
      >
        <Input
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          placeholder="e.g. Kathmandu, Nepal"
          autoComplete="off"
          invalid={!!errors.birthPlace}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Validating…" : profile ? "Save changes" : "Create profile"}
        </Button>
        {profile && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              removeProfile();
              router.push("/");
            }}
          >
            Delete profile
          </Button>
        )}
        {savedNote && <span className="text-sm text-jade">{savedNote}</span>}
      </div>
    </form>
  );
}
