/**
 * Milestone 12 — accounts: role resolution, premium bypass logic,
 * config reporting. No real credentials anywhere: env objects are
 * fabricated, sessions are mocked user objects.
 *
 * Rules under test:
 *  - admin email → admin + premium automatically
 *  - any other signed-in email → client, not premium
 *  - no session → guest, not premium
 *  - accountsAvailable is false until BOTH Supabase env vars exist
 *  - config status reports key presence as booleans only
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  accountsConfigured,
  configStatus,
  isPremium,
  resolvePremium,
  resolveRole,
} from "../src/lib/accounts.ts";

const ADMIN = "owner@example.com";

test("ACCOUNTS: role resolution — admin / client / guest", () => {
  assert.equal(resolveRole(ADMIN, ADMIN), "admin");
  assert.equal(resolveRole("Owner@Example.com", ADMIN), "admin", "case-insensitive");
  assert.equal(resolveRole("customer@example.com", ADMIN), "client");
  assert.equal(resolveRole(null, ADMIN), "guest");
  assert.equal(resolveRole(undefined, ADMIN), "guest");
  assert.equal(resolveRole("customer@example.com", undefined), "client", "no ADMIN_EMAIL set → nobody is admin");
  assert.equal(resolveRole(ADMIN, undefined), "client", "without ADMIN_EMAIL even the owner address is a client");
});

test("ACCOUNTS: premium bypass logic with mocked sessions", () => {
  assert.deepEqual(resolvePremium({ email: ADMIN }, ADMIN), { role: "admin", premium: true });
  assert.deepEqual(resolvePremium({ email: "customer@example.com" }, ADMIN), { role: "client", premium: false });
  assert.deepEqual(resolvePremium(null, ADMIN), { role: "guest", premium: false });
  assert.deepEqual(resolvePremium({}, ADMIN), { role: "guest", premium: false });
  assert.equal(isPremium("admin"), true);
  assert.equal(isPremium("client"), false);
  assert.equal(isPremium("guest"), false);
});

test("ACCOUNTS: config reporting — accountsAvailable + booleans only", () => {
  assert.equal(accountsConfigured({}), false);
  assert.equal(accountsConfigured({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }), false);
  assert.equal(
    accountsConfigured({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    }),
    true,
  );
  const status = configStatus({
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    ADMIN_EMAIL: ADMIN,
    GEMINI_API_KEY: "g",
  });
  assert.deepEqual(status, {
    accountsAvailable: true,
    adminConfigured: true,
    stripeConfigured: false,
    geminiConfigured: true,
    supabaseConfigured: true,
  });
  // Booleans only — no value from the env leaks into the status object.
  assert.ok(!JSON.stringify(status).includes("anon"));
  assert.ok(!JSON.stringify(status).includes(ADMIN));
});
