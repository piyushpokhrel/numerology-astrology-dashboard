/**
 * Server-side Stripe configuration check. Keys live only in the
 * environment (STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
 * and are never sent to the browser.
 */
export function checkoutConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
