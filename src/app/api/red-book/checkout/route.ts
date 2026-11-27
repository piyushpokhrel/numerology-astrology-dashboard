/**
 * POST /api/red-book/checkout — create a Stripe Checkout session for
 * The Red Book (single payment, CAD $19, no subscription).
 *
 * Talks to the Stripe REST API directly (form-encoded), so no SDK is
 * bundled. Requires STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * in the environment (TEST MODE keys until the merchant account's KYC
 * is complete). Without keys the route answers 503 and the page shows
 * its honest "Checkout opens soon" state — no purchase is ever faked.
 */

import { NextResponse } from "next/server";
import { RED_BOOK_PRICE_CAD } from "@/lib/redbook";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function POST(req: Request) {
  if (!checkoutConfigured()) {
    return NextResponse.json(
      { ok: false, error: "checkout_unavailable" },
      { status: 503 },
    );
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
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "cad",
    "line_items[0][price_data][unit_amount]": String(RED_BOOK_PRICE_CAD * 100),
    "line_items[0][price_data][product_data][name]": "The Red Book — Full Deep Reading",
    "line_items[0][price_data][product_data][description]":
      "The complete deep reading for one profile: numerology, Chinese, Western and Vedic in depth, with sources cited. One payment — no subscription.",
    success_url: `${origin}/red-book?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/red-book?checkout=cancelled`,
    "metadata[profileKey]": profileKey,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    return NextResponse.json(
      { ok: false, error: data.error?.message ?? "stripe_error" },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, url: data.url });
}
