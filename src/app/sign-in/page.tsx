"use client";

/**
 * /sign-in — the CLIENT entrance. Signing in is additive: profiles
 * stay on this device and sync to the account when accounts are
 * enabled; guest mode keeps working exactly as before either way.
 */

import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Account</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-moon">Sign in</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-mist">
        For customers. Your profiles, chat credits (7 free replies a month, or
        unlimited on the $15/month subscription) and Red Book purchases
        ($19 once per profile) attach to your account. Everything free stays
        free signed-out too — signing in is never a wall in front of the
        calculators.
      </p>
      <AuthForm variant="client" />
    </div>
  );
}
