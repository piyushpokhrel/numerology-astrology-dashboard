"use client";

/**
 * THE RED BOOK — the one paid product: the full deep reading for a
 * profile, presented as a bound signature volume (deep red + gold,
 * deliberately distinct from the rest of the site).
 *
 * Freemium shape, per the differentiation spec:
 *   - Cover, table of contents and Chapter 1 are FREE.
 *   - The remaining chapters sit behind a single, public price:
 *     CAD $19, one payment, no tiers, no subscription.
 *   - Checkout is Stripe (test mode until the merchant KYC is done).
 *     When no Stripe keys are configured the buy button shows an
 *     honest "Checkout opens soon" state — a purchase is never faked.
 *   - Entitlement is granted only after the server verifies a paid
 *     session with Stripe, and is stored per profile in localStorage.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { ChartWorkbench } from "@/components/ChartWorkbench";
import { NoProfile } from "@/components/ui";
import { formatLongDate } from "@/lib/profile";
import type { ChartInput } from "@/lib/western";
import {
  buildRedBook,
  grantRedBookEntitlement,
  hasRedBookEntitlement,
  redBookProfileKey,
  RED_BOOK_PRICE_CAD,
  type RedBook,
  type RedBookChapter,
} from "@/lib/redbook";

const RED_PANEL = "rounded-3xl border border-[#6e1420] bg-[#20070c]";
const GOLD = "text-[#e8c87a]";

export default function RedBookPage() {
  const { profile, loaded, today } = useProfile();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checkoutAvailable, setCheckoutAvailable] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const profileKey = useMemo(
    () => (profile ? redBookProfileKey(profile) : null),
    [profile],
  );

  // Entitlement state for this profile.
  useEffect(() => {
    if (profileKey) setUnlocked(hasRedBookEntitlement(profileKey));
    // ADMIN = PREMIUM AUTOMATICALLY: /api/account/premium verifies the
    // Supabase session + ADMIN_EMAIL server-side; a premium verdict
    // unlocks the book with no checkout. Never a client-side flag.
    void import("@/lib/accounts-client").then(({ fetchPremium }) =>
      fetchPremium().then((p) => {
        if (p.premium) {
          setUnlocked(true);
          setNotice("Owner sign-in — the Red Book is unlocked automatically (premium). No checkout needed.");
        }
      }),
    );
  }, [profileKey]);

  // Is Stripe Checkout configured?
  useEffect(() => {
    fetch("/api/red-book/config")
      .then((r) => r.json())
      .then((d: { checkoutAvailable?: boolean }) =>
        setCheckoutAvailable(Boolean(d.checkoutAvailable)),
      )
      .catch(() => setCheckoutAvailable(false));
  }, []);

  // Return from Stripe: verify server-side before granting anything.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "cancelled") {
      setNotice("Checkout was cancelled — nothing was charged.");
      router.replace("/red-book");
      return;
    }
    const sessionId = params.get("session_id");
    if (status !== "success" || !sessionId) return;
    fetch(`/api/red-book/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d: { paid?: boolean; profileKey?: string | null }) => {
        if (d.paid) {
          grantRedBookEntitlement(d.profileKey ?? profileKey ?? "");
          if (profileKey) setUnlocked(hasRedBookEntitlement(profileKey));
          setNotice("Payment confirmed — your Red Book is unlocked for this profile.");
        } else {
          setNotice("We could not confirm that payment with Stripe yet. If you were charged, the unlock will apply once Stripe confirms — contact us and we will sort it out.");
        }
      })
      .catch(() =>
        setNotice("Payment confirmation is still pending — please reload in a moment."),
      )
      .finally(() => router.replace("/red-book"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy() {
    if (!profileKey) return;
    setBuying(true);
    try {
      const res = await fetch("/api/red-book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileKey }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice("Checkout is not available right now — nothing was charged.");
    } catch {
      setNotice("Checkout could not be reached — nothing was charged.");
    } finally {
      setBuying(false);
    }
  }

  if (!loaded) return <p className="text-sm text-mist">Loading…</p>;
  if (!profile) return <NoProfile what="The Red Book" />;

  return (
    <div>
      {/* ——— The cover ——— */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-[#8a6a2f] bg-gradient-to-br from-[#4a0d16] via-[#2c060c] to-[#17030a] px-6 py-14 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-2xl border border-[#e8c87a]/30"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8c87a]">
          The Signature Volume
        </p>
        <h1 className="mt-4 font-serif text-5xl font-bold tracking-wide text-[#f3e2ac] sm:text-6xl">
          The Red Book
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[#d9b96a]">
          The Full Deep Reading
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#e9d9c8]">
          Prepared for <strong className="text-[#f3e2ac]">{profile.fullName}</strong>,
          born {formatLongDate(profile.dob)} · {profile.birthPlace}. Six chapters
          across the four traditions — numerology, Chinese, Western and Vedic —
          every figure reproducible, every interpretation sourced.
        </p>
        <p className="mt-4 text-xs text-[#c9a86a]">
          Generated for {today ? formatLongDate(today) : ""} · Same profile, same
          book — the Red Book is deterministic.
        </p>
      </section>

      {notice && (
        <p className="mt-4 rounded-lg border border-[#6e1420] bg-[#2c060c] px-4 py-3 text-sm text-[#f0d9a8]" role="status">
          {notice}
        </p>
      )}

      {/* ——— Pricing, plainly ——— */}
      <section className={`${RED_PANEL} mt-6 px-6 py-6 sm:px-8`}>
        <h2 className="text-base font-semibold text-[#f3e2ac]">Pricing, plainly</h2>
        <div className="mt-3 grid gap-4 text-sm leading-relaxed text-[#e9d9c8] sm:grid-cols-2">
          <p>
            <strong className={GOLD}>The free core — free forever.</strong> Every
            calculator, every chart, the name checker and the standard report on
            this site are free, with no account and no trial clock. That does
            not change.
          </p>
          <p>
            <strong className={GOLD}>The Red Book — CAD ${RED_BOOK_PRICE_CAD}, once.</strong>{" "}
            One payment for this profile&apos;s complete deep reading. No
            subscription, no tiers, no renewal. If the book ever fails to
            generate for a paid profile, we refund to the original payment
            method — never to a wallet, never as credit.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {unlocked ? (
            <p className="rounded-lg border border-[#8a6a2f] bg-[#3d0a10] px-4 py-2.5 text-sm font-semibold text-[#f3e2ac]">
              ✓ Unlocked for {profile.fullName} — all six chapters are open below.
            </p>
          ) : checkoutAvailable === null ? (
            <p className="text-sm text-[#c9a86a]">Checking checkout availability…</p>
          ) : checkoutAvailable ? (
            <button
              onClick={buy}
              disabled={buying}
              className="rounded-lg bg-gradient-to-r from-[#8a6a2f] to-[#c9a227] px-6 py-3 text-sm font-bold text-[#2c060c] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {buying ? "Opening secure checkout…" : `Unlock the full Red Book — CAD $${RED_BOOK_PRICE_CAD}`}
            </button>
          ) : (
            <>
              <button
                disabled
                className="cursor-not-allowed rounded-lg border border-[#8a6a2f]/60 px-6 py-3 text-sm font-bold text-[#c9a86a] opacity-70"
              >
                Checkout opens soon — CAD ${RED_BOOK_PRICE_CAD}
              </button>
              <p className="max-w-md text-xs leading-relaxed text-[#c9a86a]">
                Payments are being connected. The price is set — CAD $
                {RED_BOOK_PRICE_CAD}, one payment — and this button activates
                the moment secure checkout is live. Nothing can be charged
                before then, and Chapter 1 below is yours free, now.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ——— The book itself ——— */}
      <ChartWorkbench>
        {(input) => (
          <BookBody
            key={input.utc.toISOString()}
            input={input}
            today={today}
            unlocked={unlocked}
          />
        )}
      </ChartWorkbench>

      <p className="mt-6 text-center text-xs leading-relaxed text-fog">
        Interpretations in the Red Book are traditional indications from the
        sources cited in each chapter, presented for reflection and
        entertainment. They are not medical, financial or legal advice.
      </p>
    </div>
  );
}

function BookBody({
  input,
  today,
  unlocked,
}: {
  input: ChartInput;
  today: string;
  unlocked: boolean;
}) {
  const { profile } = useProfile();
  const book: RedBook | null = useMemo(
    () => (profile && today ? buildRedBook(profile, input, today) : null),
    [profile, input, today],
  );
  if (!book) return null;

  return (
    <div className="mt-8">
      {/* Table of contents */}
      <section className={`${RED_PANEL} px-6 py-6 sm:px-8`}>
        <h2 className="font-serif text-xl font-bold text-[#f3e2ac]">Contents</h2>
        <ol className="mt-3 space-y-2">
          {book.chapters.map((ch) => (
            <li
              key={ch.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#6e1420]/50 pb-2 text-sm"
            >
              <span className="text-[#e9d9c8]">
                <span className={GOLD}>Chapter {ch.number}.</span> {ch.title}
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  ch.free || unlocked ? "text-[#9fc98a]" : "text-[#c9a86a]"
                }`}
              >
                {ch.free ? "Free preview" : unlocked ? "Open" : "In the full book"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {book.chapters.map((ch) => (
        <ChapterView key={ch.id} chapter={ch} unlocked={unlocked} />
      ))}
    </div>
  );
}

function ChapterView({
  chapter,
  unlocked,
}: {
  chapter: RedBookChapter;
  unlocked: boolean;
}) {
  const open = chapter.free || unlocked;
  return (
    <section className={`${RED_PANEL} mt-6 px-6 py-7 sm:px-8`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a86a]">
        Chapter {chapter.number}
        {chapter.free && !unlocked ? " · Free preview" : ""}
      </p>
      <h2 className="mt-1.5 font-serif text-2xl font-bold text-[#f3e2ac]">
        {chapter.title}
      </h2>
      <p className="mt-1 text-sm italic text-[#d9b96a]">{chapter.subtitle}</p>

      {open ? (
        <div className="mt-5 space-y-6">
          {chapter.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#e8c87a]">
                {s.heading}
              </h3>
              <div className="mt-2 space-y-1.5">
                {s.lines.map((line, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[#e9d9c8]">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <p className="border-t border-[#6e1420]/60 pt-3 text-[11px] italic text-[#c9a86a]">
            Source: {chapter.source}
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <ul className="space-y-1.5">
            {chapter.sections.map((s) => (
              <li key={s.heading} className="text-sm text-[#cbb79a]">
                — {s.heading}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-[#8a6a2f]/50 bg-[#2c060c] px-4 py-3 text-sm text-[#e9d9c8]">
            🔒 This chapter is in the full Red Book — CAD ${RED_BOOK_PRICE_CAD},
            one payment, above. Its contents are listed honestly here; no
            countdowns, no pressure — it will be here when you want it.
          </p>
        </div>
      )}
    </section>
  );
}
