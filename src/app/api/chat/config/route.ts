/**
 * GET /api/chat/config — the chat's public configuration state,
 * following the Red Book config pattern: booleans and public prices
 * only, never key values.
 *  - aiAvailable: a Gemini key is configured → full conversational AI.
 *  - Otherwise the chat runs in deterministic calculator mode (fully
 *    working, clearly badged) — it never appears broken.
 */

import { NextResponse } from "next/server";
import { FREE_CREDITS_PER_MONTH, SUBSCRIPTION_PRICE_CAD } from "@/lib/chat-credits";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function GET() {
  const aiAvailable = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    ok: true,
    aiAvailable,
    calculatorMode: !aiAvailable,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    freeCreditsPerMonth: FREE_CREDITS_PER_MONTH,
    subscriptionPriceCAD: SUBSCRIPTION_PRICE_CAD,
    subscriptionAvailable: checkoutConfigured(),
  });
}
