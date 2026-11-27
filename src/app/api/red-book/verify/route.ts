/**
 * GET /api/red-book/verify?session_id=… — confirm a completed Stripe
 * Checkout before the page grants the local entitlement. The browser
 * never self-declares a purchase: it asks here, and only a session
 * Stripe reports as paid unlocks the book.
 */

import { NextResponse } from "next/server";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function GET(req: Request) {
  if (!checkoutConfigured()) {
    return NextResponse.json({ ok: false, paid: false }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ ok: false, paid: false }, { status: 400 });
  }
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } },
  );
  if (!res.ok) {
    return NextResponse.json({ ok: false, paid: false }, { status: 502 });
  }
  const data = (await res.json()) as {
    payment_status?: string;
    metadata?: { profileKey?: string };
  };
  return NextResponse.json({
    ok: true,
    paid: data.payment_status === "paid",
    profileKey: data.metadata?.profileKey ?? null,
  });
}
