"use client";

/**
 * The side chat (milestone 11) — a bubble on every page opening a
 * right-side drawer. Answers are computed by the site's engines via
 * /api/chat (Gemini tool loop when a key is configured; deterministic
 * calculator mode otherwise — clearly badged, never broken).
 *
 * Credits: 7 free replies per month per profile (localStorage, month
 * stamped); $15/month subscription = unlimited, verified server-side
 * before the entitlement is stored. At 0 credits the drawer shows the
 * subscribe state — the calculators remain fully free.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { chartInputFor, loadChartSettings } from "@/components/ChartWorkbench";
import {
  canSend,
  creditsHeader,
  deduct,
  freshCreditState,
  rollover,
  type CreditState,
} from "@/lib/chat-credits";
import { redBookProfileKey } from "@/lib/redbook";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  notes?: string[];
}

interface ChatConfig {
  aiAvailable: boolean;
  calculatorMode: boolean;
  freeCreditsPerMonth: number;
  subscriptionPriceCAD: number;
  subscriptionAvailable: boolean;
}

const STARTERS = [
  "What is my life path and how is it derived?",
  "Is my business name aligned?",
  "What dasha am I in?",
  "Show today's Panchanga",
  "Who is my Ishta Devta?",
];

const historyKey = (pk: string) => `astro-numerology:chat-history:v1:${pk}`;
const creditsKey = (pk: string) => `astro-numerology:chat-credits:v1:${pk}`;

export function ChatDrawer() {
  const { profile, today } = useProfile();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [subBusy, setSubBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileKey = useMemo(
    () => (profile ? redBookProfileKey(profile) : "guest"),
    [profile],
  );

  // Config + persisted state.
  useEffect(() => {
    fetch("/api/chat/config")
      .then((r) => r.json())
      .then((c) => setConfig(c as ChatConfig))
      .catch(() => setConfig({ aiAvailable: false, calculatorMode: true, freeCreditsPerMonth: 7, subscriptionPriceCAD: 15, subscriptionAvailable: false }));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyKey(profileKey));
      setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
      const rawCredits = window.localStorage.getItem(creditsKey(profileKey));
      const now = new Date();
      setCredits(
        rawCredits
          ? rollover(JSON.parse(rawCredits) as CreditState, now)
          : freshCreditState(now),
      );
    } catch {
      setMessages([]);
      setCredits(freshCreditState(new Date()));
    }
  }, [profileKey]);

  // Subscription return: verify server-side, then store entitlement.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") === "subscribed") {
      const session = params.get("session_id");
      if (session) {
        fetch(`/api/chat-subscribe/verify?session_id=${encodeURIComponent(session)}`)
          .then((r) => r.json())
          .then((data: { subscribed?: boolean }) => {
            if (data.subscribed) {
              setCredits((c) => {
                const next = { ...(c ?? freshCreditState(new Date())), subscribed: true };
                window.localStorage.setItem(creditsKey(profileKey), JSON.stringify(next));
                return next;
              });
              setOpen(true);
            }
          })
          .catch(() => undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open, busy]);

  const exhausted = credits ? !canSend(credits, new Date()) : false;

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || !credits) return;
    const now = new Date();
    if (!canSend(credits, now)) return;
    const afterDeduct = deduct(credits, now);
    if (!afterDeduct) return;
    setCredits(afterDeduct);
    window.localStorage.setItem(creditsKey(profileKey), JSON.stringify(afterDeduct));
    const nextMessages = [...messages, { role: "user" as const, text: message }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const settings = loadChartSettings();
      const derived = profile ? chartInputFor(profile, settings) : null;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          profile,
          chartInput: derived
            ? {
                utc: derived.input.utc.toISOString(),
                latitude: derived.input.latitude,
                longitudeEast: derived.input.longitudeEast,
              }
            : null,
          today,
        }),
      });
      const data = (await res.json()) as { reply?: string; toolNotes?: string[] };
      const reply: ChatMessage = {
        role: "assistant",
        text: data.reply ?? "The calculator could not answer that — please rephrase.",
        notes: data.toolNotes,
      };
      const finalMessages = [...nextMessages, reply];
      setMessages(finalMessages);
      window.localStorage.setItem(historyKey(profileKey), JSON.stringify(finalMessages.slice(-60)));
    } catch {
      const reply: ChatMessage = {
        role: "assistant",
        text: "The chat service did not respond. The calculators on this site are unaffected — every page still computes fully.",
      };
      setMessages([...nextMessages, reply]);
    } finally {
      setBusy(false);
    }
  }

  async function subscribe() {
    if (!config?.subscriptionAvailable) return;
    setSubBusy(true);
    try {
      const res = await fetch("/api/chat-subscribe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileKey }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setSubBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the calculator chat"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl text-[#171204] shadow-[0_10px_30px_-8px_rgba(201,164,92,0.8)] transition-transform hover:scale-105 print:hidden"
      >
        ✦
      </button>

      {open && (
        <div className="fixed inset-0 z-50 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-panel shadow-2xl">
            <header className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-moon">Ask — every answer calculated</h2>
                <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-lg border border-line px-2 py-1 text-sm text-mist hover:text-moon">✕</button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold-2">
                  {credits ? creditsHeader(credits, new Date()) : "…"}
                </span>
                {config?.calculatorMode && (
                  <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-mist">
                    Calculator mode — add a Gemini key for full conversational AI
                  </span>
                )}
                {config?.aiAvailable && (
                  <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-mist">AI · tool-verified answers</span>
                )}
              </div>
              {profile ? (
                <p className="mt-1 text-xs text-fog">Chatting as {profile.fullName} · born {profile.dob} — ask about other names or dates any time.</p>
              ) : (
                <p className="mt-1 text-xs text-fog">No profile yet — I can still compute for any date or name you give me.</p>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div>
                  <p className="text-sm text-mist">Ask anything — the answer is computed live by the site&apos;s engines, never invented. Try:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STARTERS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-xs text-moon hover:border-gold/60">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-gold text-[#171204]" : "border border-line bg-panel-2 text-mist"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.notes && m.notes.length > 0 && (
                    <p className="mt-1 text-[11px] text-fog">{m.notes.join(" · ")}</p>
                  )}
                </div>
              ))}
              {busy && <p className="text-sm text-fog">Calculating…</p>}

              {exhausted && (
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
                  <h3 className="font-semibold text-moon">You&apos;ve used this month&apos;s 7 free replies</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mist">
                    Every calculator, chart, the name checker, Panchanga and the standard report stay free
                    forever — only the chat is metered. Unlimited chat is $15/month: one public price, billed
                    under the real business name, cancel anytime in one click.
                  </p>
                  {config?.subscriptionAvailable ? (
                    <button onClick={subscribe} disabled={subBusy} className="mt-3 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#171204] disabled:opacity-50">
                      {subBusy ? "Opening checkout…" : "Subscribe — $15/month, unlimited chat"}
                    </button>
                  ) : (
                    <button disabled className="mt-3 rounded-lg border border-line bg-panel-2 px-4 py-2 text-sm text-mist">
                      Checkout opens soon — $15/month
                    </button>
                  )}
                </div>
              )}
            </div>

            <form
              className="border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={exhausted ? "Subscribe for unlimited chat — calculators stay free" : "Ask for a calculation…"}
                  disabled={exhausted}
                  className="flex-1 rounded-lg border border-line bg-night px-3 py-2.5 text-sm text-moon focus:border-gold/60 focus:outline-none disabled:opacity-60"
                />
                <button type="submit" disabled={busy || exhausted || !input.trim()} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#171204] disabled:opacity-50">
                  Ask
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
