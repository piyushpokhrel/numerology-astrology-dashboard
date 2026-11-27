"use client";

/**
 * /admin — the OWNER entrance. Visually distinct (Red Book red/gold),
 * reached only via the quiet footer "Owner" link. Premium is granted
 * by the server when the signed-in email matches ADMIN_EMAIL — the
 * page itself grants nothing. The panel shows config status as
 * booleans only, pricing constants, and entitlement test tools.
 */

import { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import type { PremiumState } from "@/lib/accounts-client";

interface AccountConfig {
  accountsAvailable: boolean;
  adminConfigured: boolean;
  stripeConfigured: boolean;
  geminiConfigured: boolean;
  supabaseConfigured: boolean;
  pricing: { chatFreeCreditsPerMonth: number; chatSubscriptionCAD: number; redBookCAD: number };
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#8a6a2f]/25 py-2 text-sm last:border-0">
      <span className="text-[#e9d9c8]">{label}</span>
      <span className={value ? "text-[#9fd6a8]" : "text-[#e9a0a0]"}>{value ? "set" : "missing"}</span>
    </div>
  );
}

export default function AdminPage() {
  const [premium, setPremium] = useState<PremiumState | null>(null);
  const [config, setConfig] = useState<AccountConfig | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function loadPanel() {
    const res = await fetch("/api/account/config");
    setConfig((await res.json()) as AccountConfig);
  }

  async function runEntitlementTest() {
    const headers: Record<string, string> = {};
    try {
      const raw = window.localStorage.getItem("astro-numerology:supabase-session:v1");
      const token = raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : null;
      if (token) headers.Authorization = "Bearer " + token;
    } catch {
      /* no session — the server will answer guest */
    }
    const res = await fetch("/api/account/premium", { headers });
    const data = (await res.json()) as PremiumState & { email?: string };
    setTestResult(
      `Server verdict — role: ${data.role}, premium: ${data.premium ? "YES" : "no"}${data.email ? `, verified email: ${data.email}` : ""}. This answer came from the server after verifying the session token; no client flag was trusted.`,
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-[#6e1420] bg-[#20070c] p-6 text-[#e9d9c8] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a86a]">Owner entrance</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-[#f3e2ac]">Admin sign-in</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed">
        Separate from the customer sign-in. The owner account — the one whose email
        matches the ADMIN_EMAIL setting — is premium automatically: unlimited chat,
        the Red Book unlocked, no subscription prompts. That is decided on the
        server from the verified session, never by this page.
      </p>

      <AuthForm
        variant="admin"
        onPremium={(p) => {
          setPremium(p);
          if (p.premium) void loadPanel();
        }}
      />

      {premium?.premium && (
        <div className="mt-6 rounded-2xl border border-[#8a6a2f]/60 bg-[#2a0a10] p-5">
          <h2 className="font-serif text-lg font-bold text-[#f3e2ac]">Owner panel</h2>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a86a]">
            Configuration status (presence only — values never shown)
          </h3>
          {config ? (
            <div className="mt-1">
              <BoolRow label="Supabase (accounts)" value={config.supabaseConfigured} />
              <BoolRow label="ADMIN_EMAIL" value={config.adminConfigured} />
              <BoolRow label="Stripe (Red Book + subscription)" value={config.stripeConfigured} />
              <BoolRow label="Gemini (conversational AI)" value={config.geminiConfigured} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#cbb27a]">Loading…</p>
          )}
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a86a]">Pricing constants</h3>
          {config && (
            <p className="mt-1 text-sm leading-relaxed">
              Chat: {config.pricing.chatFreeCreditsPerMonth} free replies/month · subscription $
              {config.pricing.chatSubscriptionCAD}/month · Red Book ${config.pricing.redBookCAD} one-time
              per profile. These are the only prices on the site.
            </p>
          )}
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a86a]">Entitlement test</h3>
          <button
            onClick={runEntitlementTest}
            className="mt-2 rounded-lg bg-[#c9a86a] px-4 py-2 text-sm font-semibold text-[#2a0a10]"
          >
            Ask the server: am I premium?
          </button>
          {testResult && <p className="mt-2 text-sm leading-relaxed">{testResult}</p>}
        </div>
      )}
    </div>
  );
}
