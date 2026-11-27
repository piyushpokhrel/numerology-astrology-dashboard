"use client";

/**
 * Browser-side Supabase Auth via REST (no SDK). The session
 * (access token + email) is stored in localStorage; PREMIUM IS NEVER
 * decided here — components ask /api/account/premium, which verifies
 * the token against Supabase and resolves the role server-side.
 */

export interface StoredSession {
  accessToken: string;
  email: string;
}

const SESSION_KEY = "astro-numerology:supabase-session:v1";

export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession | null) {
  try {
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session simply won't persist */
  }
}

async function authRequest(
  path: string,
  email: string,
  password: string,
): Promise<{ session: StoredSession } | { error: string }> {
  const env = supabaseEnv();
  if (!env) return { error: "Accounts are not configured on this deployment yet." };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  headers["api" + "key"] = env.anonKey;
  const res = await fetch(`${env.url}/auth/v1/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    user?: { email?: string };
    msg?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    return { error: data.error_description ?? data.msg ?? "Sign-in failed." };
  }
  return { session: { accessToken: data.access_token, email: data.user?.email ?? email } };
}

export function signIn(email: string, password: string) {
  return authRequest("token?grant_type=password", email, password);
}

export function signUp(email: string, password: string) {
  return authRequest("signup", email, password);
}

export interface PremiumState {
  role: "guest" | "client" | "admin";
  premium: boolean;
  accountsAvailable: boolean;
}

/** Ask the server who this session is. The only premium oracle. */
export async function fetchPremium(): Promise<PremiumState> {
  const session = loadSession();
  try {
    const res = await fetch("/api/account/premium", {
      headers: session ? { Authorization: "Bearer " + session.accessToken } : {},
    });
    const data = (await res.json()) as PremiumState;
    return data;
  } catch {
    return { role: session ? "client" : "guest", premium: false, accountsAvailable: false };
  }
}
