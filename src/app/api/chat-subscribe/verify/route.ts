/**
 * GET /api/chat-subscribe/verify?session_id=… — verify a completed
 * subscription checkout server-side before the client grants the
 * unlimited entitlement. The session must be complete AND its
 * subscription active/trialing — the browser never self-declares.
 */

import { NextResponse } from "next/server";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function GET(req: Request) {
  if (!checkoutConfigured()) {
    return NextResponse.json({ ok: false, subscribed: false }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ ok: false, subscribed: false }, { status: 400 });
  }
  const headers = { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` };
  const sres = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers },
  );
  if (!sres.ok) return NextResponse.json({ ok: false, subscribed: false }, { status: 502 });
  const session = (await sres.json()) as {
    status?: string;
    subscription?: string;
    metadata?: { profileKey?: string };
  };
  let subscribed = false;
  if (session.subscription) {
    const sub = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(session.subscription)}`,
      { headers },
    );
    if (sub.ok) {
      const data = (await sub.json()) as { status?: string };
      subscribed = data.status === "active" || data.status === "trialing";
    }
  }
  return NextResponse.json({
    ok: true,
    subscribed: session.status === "complete" && subscribed,
    profileKey: session.metadata?.profileKey ?? null,
  });
}
