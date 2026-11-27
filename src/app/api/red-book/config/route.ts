/**
 * GET /api/red-book/config — tells the Red Book page whether Stripe
 * Checkout is configured. Keys are read from the environment only and
 * never exposed; the response carries no secret material.
 */

import { NextResponse } from "next/server";
import { RED_BOOK_PRICE_CAD } from "@/lib/redbook";
import { checkoutConfigured } from "@/lib/stripe-config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    checkoutAvailable: checkoutConfigured(),
    priceCAD: RED_BOOK_PRICE_CAD,
    currency: "cad",
  });
}
