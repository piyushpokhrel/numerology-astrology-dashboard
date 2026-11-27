/**
 * Accounts (milestone 12) — two roles, honestly gated on env.
 *
 * Backend: Supabase Auth (email + password) via REST. Enabled ONLY
 * when NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are
 * present (Piyush adds them himself — never in code). Without them
 * the site stays in today's local-profile guest mode and the sign-in
 * pages say "Accounts open soon" — nothing fake.
 *
 * Roles:
 *  - guest  — no session. Everything free works exactly as before;
 *             signing in is additive, never a wall.
 *  - client — any signed-in account. Chat = 7 free credits/month or
 *             the $15/month unlimited subscription; Red Book $19 per
 *             profile.
 *  - admin  — the account whose email matches the ADMIN_EMAIL env
 *             var. ADMIN = PREMIUM AUTOMATICALLY: unlimited chat,
 *             Red Book unlocked, no subscription prompts. Premium is
 *             resolved SERVER-SIDE from the verified Supabase session
 *             (see /api/account/premium) — never from a client flag.
 */

export type Role = "guest" | "client" | "admin";

export interface EnvLike {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  ADMIN_EMAIL?: string;
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  GEMINI_API_KEY?: string;
}

export function accountsConfigured(env: EnvLike): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Booleans only — key presence for the admin panel, never values. */
export function configStatus(env: EnvLike) {
  return {
    accountsAvailable: accountsConfigured(env),
    adminConfigured: Boolean(env.ADMIN_EMAIL),
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    supabaseConfigured: accountsConfigured(env),
  };
}

/** Pure role resolution — the single source of truth, used by the API. */
export function resolveRole(
  email: string | null | undefined,
  adminEmail: string | null | undefined,
): Role {
  if (!email) return "guest";
  if (adminEmail && email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
    return "admin";
  }
  return "client";
}

export function isPremium(role: Role): boolean {
  return role === "admin";
}

export interface PremiumResolution {
  role: Role;
  premium: boolean;
}

/** Pure premium resolution from a verified session user. */
export function resolvePremium(
  user: { email?: string | null } | null,
  adminEmail: string | null | undefined,
): PremiumResolution {
  const role = resolveRole(user?.email ?? null, adminEmail);
  return { role, premium: isPremium(role) };
}
