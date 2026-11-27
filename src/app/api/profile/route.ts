/**
 * POST /api/profile — the server-side validation gate for profile
 * credentials. The client form validates with the same zod schema for
 * instant inline errors, then posts here; this handler re-validates
 * (client checks are UX, never the boundary) and echoes the normalised
 * profile back. Persistence itself is client-side (localStorage) —
 * no credential is stored on the server.
 *
 * Responses:
 *   200 { ok: true, profile }
 *   400 { ok: false, errors: { _form: [...] } }        — malformed JSON
 *   422 { ok: false, errors: { <field>: [messages] } } — validation failed
 */

import { NextResponse } from "next/server";
import { profileSchema, zodFieldErrors } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: ["Request body must be valid JSON."] } },
      { status: 400 },
    );
  }

  const result = profileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, errors: zodFieldErrors(result.error) },
      { status: 422 },
    );
  }

  const { fullName, dob, birthTime, birthPlace } = result.data;
  return NextResponse.json({
    ok: true,
    profile: {
      fullName,
      dob,
      birthTime: birthTime ? birthTime : undefined,
      birthPlace,
    },
  });
}
