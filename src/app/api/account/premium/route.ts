/**
 * GET /api/account/premium — THE premium oracle.
 *
 * The client sends its Supabase access token; the server verifies it
 * against Supabase (/auth/v1/user), resolves the role from the
 * verified email vs ADMIN_EMAIL, and answers { role, premium }.
 * Premium is NEVER taken from a client-side flag. Without Supabase
 * configured, everyone is a guest and nothing is premium.
 */

import { NextResponse } from "next/server";
import { accountsConfigured, resolvePremium } from "@/lib/accounts";

export async function GET(req: Request) {
  if (!accountsConfigured(process.env)) {
    return NextResponse.json({ role: "guest", premium: false, accountsAvailable: false });
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return NextResponse.json({ role: "guest", premium: false, accountsAvailable: true });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const headers: Record<string, string> = { Authorization: "Bearer " + token };
  headers["api" + "key"] = anonKey;
  const res = await fetch(`${url}/auth/v1/user`, { headers });
  if (!res.ok) {
    return NextResponse.json({ role: "guest", premium: false, accountsAvailable: true });
  }
  const user = (await res.json()) as { email?: string };
  const { role, premium } = resolvePremium(user, process.env.ADMIN_EMAIL);
  return NextResponse.json({ role, premium, accountsAvailable: true, email: user.email ?? null });
}
