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
    ...configStatus(process.env),
    pricing: {
      chatFreeCreditsPerMonth: FREE_CREDITS_PER_MONTH,
      chatSubscriptionCAD: SUBSCRIPTION_PRICE_CAD,
      redBookCAD: RED_BOOK_PRICE_CAD,
    },
  });
}
