/**
 * GET /api/account/config — public account configuration state:
 * whether accounts are enabled and key-presence BOOLEANS for the
 * admin panel. Never key values.
 */

import { NextResponse } from "next/server";
import { configStatus } from "@/lib/accounts";
import { FREE_CREDITS_PER_MONTH, SUBSCRIPTION_PRICE_CAD } from "@/lib/chat-credits";
import { RED_BOOK_PRICE_CAD } from "@/lib/redbook";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...configStatus({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    }),
    pricing: {
      chatFreeCreditsPerMonth: FREE_CREDITS_PER_MONTH,
      chatSubscriptionCAD: SUBSCRIPTION_PRICE_CAD,
      redBookCAD: RED_BOOK_PRICE_CAD,
    },
  });
}
