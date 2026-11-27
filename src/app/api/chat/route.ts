/**
 * POST /api/chat — the agentic chat endpoint.
 *
 * Body: { message, profile, chartInput, today, location? }
 *  - profile/chartInput come from the client's active profile +
 *    workbench settings, so the chat "knows" the user without
 *    re-asking. Users can still ask about other names/dates inline.
 *
 * Behaviour:
 *  - NO GEMINI_API_KEY → deterministic calculator mode: the fallback
 *    parser answers from the engines. Fully working, clearly badged.
 *  - WITH a key → Gemini (REST, no SDK) with function declarations
 *    for the site's tools; the server runs the tool loop (max 5 tool
 *    calls per reply) and the model explains tool results in plain
 *    language with sources. The model is instructed to NEVER state a
 *    number that did not come from a tool.
 *
 * Credits are enforced client-side per profile (localStorage) in
 * this build's storage model; the server reports config only.
 */

import { NextResponse } from "next/server";
import {
  calculatorAnswer,
  toolAnalyzeName,
  toolCheckName,
  toolChinese,
  toolCoreNumbers,
  toolDasha,
  toolIshta,
  toolKarma,
  toolLifePathForDate,
  toolPanchanga,
  toolPersonalCycles,
  toolRedBook,
  toolWestern,
  type ChatContext,
  type ToolResult,
} from "@/lib/chat-tools";
import type { Profile } from "@/lib/profile";
import type { ChartInput } from "@/lib/western";

interface ChatBody {
  message?: string;
  profile?: Profile | null;
  chartInput?: { utc: string; latitude: number; longitudeEast: number } | null;
  today?: string;
}

function toContext(body: ChatBody): ChatContext {
  return {
    profile: body.profile ?? null,
    chartInput: body.chartInput
      ? {
          utc: new Date(body.chartInput.utc),
          latitude: body.chartInput.latitude,
          longitudeEast: body.chartInput.longitudeEast,
        }
      : null,
    today: body.today ?? new Date().toISOString().slice(0, 10),
  };
}

const SYSTEM_PROMPT = `You are the assistant for AstroNumerology, a site whose promise is: every number is calculated, none is invented.

RULES (non-negotiable):
1. For ANY number, date, chart value, dasha, tithi or score, call a tool. Never state a figure from your own knowledge or memory.
2. Explain tool results in plain language. Cite the source system/text the tool names (e.g. BPHS, Cheiro, Decoz method). Label SCIENCE vs TRADITION vs MODERN where the tool does.
3. Master numbers are always written with their root: 11/2, 22/4, 33/6.
4. Never give medical or financial advice. Never invent past-life stories — report indicators only, as the karma tool does.
5. If a question needs data the tools do not have, say so plainly and name what is missing.
6. The active profile and today's date are in the context — do not ask for them again. Users may ask about other names or dates inline; pass those to the tools.`;

const FUNCTION_DECLARATIONS = [
  { name: "core_numbers", description: "The active profile's core numerology numbers.", parameters: { type: "object", properties: {} } },
  { name: "personal_cycles", description: "Personal Year/Month/Day for a birth date on a given date.", parameters: { type: "object", properties: { dob: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" } }, required: ["dob", "date"] } },
  { name: "life_path_for_date", description: "Life Path for any birth date (YYYY-MM-DD).", parameters: { type: "object", properties: { dob: { type: "string" } }, required: ["dob"] } },
  { name: "analyze_name", description: "Chaldean + Pythagorean values of any name.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "check_name", description: "Score a candidate name against the active profile.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "chinese_sign", description: "Chinese sign, elements and coming-year relations for a birth date.", parameters: { type: "object", properties: { dob: { type: "string" } }, required: ["dob"] } },
  { name: "current_dasha", description: "Vimshottari Mahadasha/Antardasha for the active profile on a date.", parameters: { type: "object", properties: { date: { type: "string" } }, required: ["date"] } },
  { name: "western_summary", description: "Western chart summary for the active profile.", parameters: { type: "object", properties: {} } },
  { name: "panchanga", description: "Panchanga (five limbs + timings) for a date at the profile location/default.", parameters: { type: "object", properties: { date: { type: "string" } }, required: ["date"] } },
  { name: "ishta_devta", description: "Ishta Devta + karakas for the active profile.", parameters: { type: "object", properties: {} } },
  { name: "karma_purpose", description: "Karma indicators + true purpose synthesis for the active profile.", parameters: { type: "object", properties: {} } },
  { name: "red_book", description: "Red Book contents: free chapter in full, locked chapters summary-only.", parameters: { type: "object", properties: {} } },
];

function runTool(name: string, args: Record<string, string>, ctx: ChatContext): ToolResult {
  switch (name) {
    case "core_numbers":
      return ctx.profile ? toolCoreNumbers(ctx.profile, ctx.today) : { text: "No active profile.", note: "—" };
    case "personal_cycles":
      return toolPersonalCycles(args.dob || ctx.profile?.dob || "", args.date || ctx.today);
    case "life_path_for_date":
      return toolLifePathForDate(args.dob);
    case "analyze_name":
      return toolAnalyzeName(args.name);
    case "check_name":
      return ctx.profile ? toolCheckName(args.name, ctx.profile) : { text: "No active profile.", note: "—" };
    case "chinese_sign":
      return toolChinese(args.dob || ctx.profile?.dob || "");
    case "current_dasha":
      return toolDasha(ctx, args.date || ctx.today) ?? { text: "No chart input available.", note: "—" };
    case "western_summary":
      return toolWestern(ctx) ?? { text: "No chart input available.", note: "—" };
    case "panchanga":
      return toolPanchanga(ctx, args.date || ctx.today);
    case "ishta_devta":
      return toolIshta(ctx) ?? { text: "No chart input available.", note: "—" };
    case "karma_purpose":
      return toolKarma(ctx) ?? { text: "No chart input available.", note: "—" };
    case "red_book":
      return toolRedBook(ctx) ?? { text: "No chart input available.", note: "—" };
    default:
      return { text: `Unknown tool ${name}.`, note: "—" };
  }
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, string> };
  functionResponse?: { name: string; response: { result: string } };
}

async function geminiChat(message: string, ctx: ChatContext): Promise<{ reply: string; notes: string[] }> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const contextLine = `Context: today is ${ctx.today}. Active profile: ${ctx.profile ? `${ctx.profile.fullName}, born ${ctx.profile.dob}${ctx.profile.birthTime ? ` at ${ctx.profile.birthTime}` : ""}` : "none"}. Chart input available: ${ctx.chartInput ? "yes" : "no"}.`;
  const contents: Array<{ role: string; parts: GeminiPart[] }> = [
    { role: "user", parts: [{ text: `${contextLine}\n\nQuestion: ${message}` }] },
  ];
  const notes: string[] = [];
  for (let round = 0; round < 6; round++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      }),
    });
    if (!res.ok) throw new Error(`gemini_${res.status}`);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);
    if (calls.length === 0) {
      const text = parts.map((p) => p.text ?? "").join("").trim();
      return { reply: text || "I could not form an answer from the calculations.", notes };
    }
    if (notes.length >= 5) {
      return { reply: "That question needed more than five calculations in one reply — please split it into smaller questions.", notes };
    }
    contents.push({ role: "model", parts });
    const responses: GeminiPart[] = [];
    for (const call of calls.slice(0, 5 - notes.length)) {
      const result = runTool(call.functionCall!.name, call.functionCall!.args ?? {}, ctx);
      notes.push(result.note);
      responses.push({
        functionResponse: { name: call.functionCall!.name, response: { result: result.text } },
      });
    }
    contents.push({ role: "function", parts: responses });
  }
  return { reply: "The calculation loop did not settle — please rephrase the question.", notes };
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const message = (body.message ?? "").slice(0, 2000).trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }
  const ctx = toContext(body);

  if (!process.env.GEMINI_API_KEY) {
    const answer = calculatorAnswer(message, ctx);
    return NextResponse.json({
      ok: true,
      mode: "calculator",
      reply: answer.text,
      toolNotes: [answer.note],
      intent: answer.intent,
    });
  }

  try {
    const { reply, notes } = await geminiChat(message, ctx);
    return NextResponse.json({ ok: true, mode: "ai", reply, toolNotes: [...new Set(notes)] });
  } catch {
    // The chat must never appear broken: fall back to the calculator.
    const answer = calculatorAnswer(message, ctx);
    return NextResponse.json({
      ok: true,
      mode: "calculator",
      reply: answer.text,
      toolNotes: [answer.note],
      intent: answer.intent,
      aiError: true,
    });
  }
}

export type { ChatBody };
export type { ChartInput };
