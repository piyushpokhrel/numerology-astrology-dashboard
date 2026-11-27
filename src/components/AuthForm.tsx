"use client";

/**
 * Shared email/password auth form (Supabase REST). Used by /sign-in
 * (client) and /admin (owner entrance, distinct styling). When
 * accounts are not configured on this deployment it renders the
 * honest "Accounts open soon" state — nothing fake.
 */

import { useEffect, useState } from "react";
import {
  fetchPremium,
  loadSession,
  saveSession,
  signIn,
  signUp,
  type PremiumState,
} from "@/lib/accounts-client";

export function AuthForm({
  variant,
  onPremium,
}: {
  variant: "client" | "admin";
  onPremium?: (state: PremiumState) => void;
}) {
  const [accountsAvailable, setAccountsAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premium, setPremium] = useState<PremiumState | null>(null);
  const [signedEmail, setSignedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/config")
      .then((r) => r.json())
      .then((c: { accountsAvailable?: boolean }) => setAccountsAvailable(Boolean(c.accountsAvailable)))
      .catch(() => setAccountsAvailable(false));
    const session = loadSession();
    if (session) {
      setSignedEmail(session.email);
      void fetchPremium().then((p) => {
        setPremium(p);
        onPremium?.(p);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    saveSession(result.session);
    setSignedEmail(result.session.email);
    const p = await fetchPremium();
    setPremium(p);
    onPremium?.(p);
  }

  function signOut() {
    saveSession(null);
    setSignedEmail(null);
    setPremium(null);
    onPremium?.({ role: "guest", premium: false, accountsAvailable: true });
  }

  const dark = variant === "admin";

  if (accountsAvailable === null) {
    return <p className={dark ? "text-[#cbb27a]" : "text-fog"}>Checking account status…</p>;
  }

  if (!accountsAvailable) {
    return (
      <div className={`rounded-2xl border p-5 ${dark ? "border-[#8a6a2f]/60 bg-[#2a0a10] text-[#e9d9c8]" : "border-line bg-panel text-mist"}`}>
        <h2 className={`font-semibold ${dark ? "text-[#f3e2ac]" : "text-moon"}`}>Accounts open soon</h2>
        <p className="mt-1 text-sm leading-relaxed">
          Sign-in is not switched on for this deployment yet — the owner enables it by
          adding the Supabase keys to the project settings. Nothing is faked in the
          meantime: every calculator, chart, Panchanga and the standard report work
          fully in guest mode, and your profiles stay saved on this device.
        </p>
      </div>
    );
  }

  if (signedEmail) {
    return (
      <div className={`rounded-2xl border p-5 ${dark ? "border-[#8a6a2f]/60 bg-[#2a0a10] text-[#e9d9c8]" : "border-line bg-panel text-mist"}`}>
        <p className="text-sm">
          Signed in as <span className={dark ? "text-[#f3e2ac]" : "text-moon"}>{signedEmail}</span>
          {premium && (
            <>
              {" "}· role <span className={dark ? "text-[#f3e2ac]" : "text-moon"}>{premium.role}</span>
              {premium.premium && (
                <span className="ml-2 rounded-full border border-[#c9a86a]/60 bg-[#c9a86a]/10 px-2 py-0.5 text-xs text-[#f3e2ac]">
                  Premium — automatic (owner)
                </span>
              )}
            </>
          )}
        </p>
        {variant === "admin" && premium && !premium.premium && (
          <p className="mt-2 text-sm text-[#e9a0a0]">
            This account is not the owner account (its email does not match the
            ADMIN_EMAIL setting), so no premium is granted here. The owner entrance
            grants nothing by itself — premium comes only from the server-verified
            owner email.
          </p>
        )}
        <button
          onClick={signOut}
          className={`mt-3 rounded-lg border px-3 py-1.5 text-sm ${dark ? "border-[#8a6a2f]/60 text-[#f3e2ac]" : "border-line text-moon"}`}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border p-5 ${dark ? "border-[#8a6a2f]/60 bg-[#2a0a10]" : "border-line bg-panel"}`}
    >
      <div className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none ${dark ? "border-[#8a6a2f]/50 bg-[#17040a] text-[#f3e2ac] placeholder:text-[#8a7a5f]" : "border-line bg-night text-moon"}`}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none ${dark ? "border-[#8a6a2f]/50 bg-[#17040a] text-[#f3e2ac] placeholder:text-[#8a7a5f]" : "border-line bg-night text-moon"}`}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${dark ? "bg-[#c9a86a] text-[#2a0a10]" : "bg-gold text-[#171204]"}`}
        >
          {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className={`text-sm underline decoration-dotted underline-offset-2 ${dark ? "text-[#cbb27a]" : "text-mist"}`}
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </form>
  );
}
