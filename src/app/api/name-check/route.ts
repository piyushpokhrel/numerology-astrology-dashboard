/**
 * POST /api/name-check — validates the checker inputs with zod, then
 * runs the harmony engine server-side and returns the full result.
 *
 * Responses:
 *   200 { ok: true, result: NameCheckResult }
 *   400 { ok: false, errors: { _form: [...] } }
 *   422 { ok: false, errors: { <field>: [messages] } }
 */

import { NextResponse } from "next/server";
import { nameCheckSchema, zodFieldErrors } from "@/lib/schemas";
import { checkNameHarmony } from "@/lib/namecheck";

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

  const parsed = nameCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: zodFieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { name, founderName, founderDob } = parsed.data;
  const result = checkNameHarmony(name, founderName, founderDob);
  return NextResponse.json({ ok: true, result });
}
