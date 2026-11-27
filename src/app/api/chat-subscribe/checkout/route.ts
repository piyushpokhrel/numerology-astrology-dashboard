/**
 * POST /api/chat-subscribe/checkout — Stripe subscription checkout
 * for unlimited chat: CAD $15/month, mode=subscription, following the
 * Red Book pattern (REST, no SDK). Without Stripe keys the route
 * answers 503 and the chat honestly shows "Checkout opens soon —
 * $15/month". Test mode until the merchant KYC is complete.
 */

import { NextResponse } from "next/server";
import { SUBSCRIPTION_PRICE_CAD } from "@/lib/chat-credits";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function POST(req: Request) {
  if (!checkoutConfigured()) {
    return NextResponse.json({ ok: false, error: "checkout_unavailable" }, { status: 503 });
  }
  let profileKey = "";
  try {
    const body = (await req.json()) as { profileKey?: string };
    profileKey = typeof body.profileKey === "string" ? body.profileKey.slice(0, 200) : "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "cad",
    "line_items[0][price_data][unit_amount]": String(SUBSCRIPTION_PRICE_CAD * 100),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "AstroNumerology Chat — Unlimited",
    "line_items[0][price_data][product_data][description]":
      "Unlimited AI chat, billed monthly. Cancel anytime in one click. 7 replies free every month without subscribing.",
    success_url: `${origin}/?chat=subscribed&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?chat=cancelled`,
    "metadata[profileKey]": profileKey,
    "subscription_data[metadata][profileKey]": profileKey,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
Authorization: <redacted>
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    return NextResponse.json({ ok: false, error: data.error?.message ?? "stripe_error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: data.url });
}
