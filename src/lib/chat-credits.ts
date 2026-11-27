/**
 * Chat credits (milestone 11, as amended by Piyush):
 *  - Free tier: 7 chat credits per month. 1 credit = 1 assistant
 *    reply, regardless of how many tool calls the reply used.
 *  - Credits are tracked per profile with the month stamped; a new
 *    month resets the balance automatically.
 *  - Subscription: CAD $15/month ("$15/month"), unlimited chat.
 *  - At 0 credits the chat shows the subscribe state — the
 *    calculators stay fully free; nothing dies silently.
 *  - Admin (owner) accounts bypass credits entirely — enforced
 *    server-side in milestone 12; this module's `subscribed` flag is
 *    also set for a verified subscription entitlement.
 *
 * Pure logic only — storage lives in the component (localStorage).
 */

export const FREE_CREDITS_PER_MONTH = 7;
export const SUBSCRIPTION_PRICE_CAD = 15;

export interface CreditState {
  /** "YYYY-MM" the usage belongs to. */
  monthStamp: string;
  used: number;
  /** Verified subscription (or admin premium) — unlimited. */
  subscribed: boolean;
}

export function monthStampOf(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
}

export function freshCreditState(at: Date): CreditState {
  return { monthStamp: monthStampOf(at), used: 0, subscribed: false };
}

/** Apply the monthly rollover: a new month zeroes the usage counter. */
export function rollover(state: CreditState, at: Date): CreditState {
  const stamp = monthStampOf(at);
  if (state.monthStamp === stamp) return state;
  return { monthStamp: stamp, used: 0, subscribed: state.subscribed };
}

/** Credits remaining this month (Infinity when subscribed). */
export function creditsRemaining(state: CreditState, at: Date): number {
  const s = rollover(state, at);
  if (s.subscribed) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_CREDITS_PER_MONTH - s.used);
}

export function canSend(state: CreditState, at: Date): boolean {
  return creditsRemaining(state, at) > 0;
}

/**
 * Deduct one credit for one assistant reply. Returns the new state,
 * or null when no credit is available (the caller shows the
 * subscribe state). Subscribed users are never deducted.
 */
export function deduct(state: CreditState, at: Date): CreditState | null {
  const s = rollover(state, at);
  if (s.subscribed) return s;
  if (s.used >= FREE_CREDITS_PER_MONTH) return null;
  return { ...s, used: s.used + 1 };
}

/** The header line, exactly as the product shows it. */
export function creditsHeader(state: CreditState, at: Date): string {
  const s = rollover(state, at);
  if (s.subscribed) return "Unlimited";
  return `Credits: ${Math.max(0, FREE_CREDITS_PER_MONTH - s.used)} / ${FREE_CREDITS_PER_MONTH} this month`;
}
