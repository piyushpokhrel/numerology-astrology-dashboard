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
  /** True when this user turn arrived by voice (dictation or a recorded voice message's transcript). */
  viaVoice?: boolean;
}

/* ------------------------------------------------------------------ */
/* Voice (milestone 13) — browser speech APIs, all on-device.          */
/* Dictation: SpeechRecognition / webkitSpeechRecognition.             */
/* Recording: MediaRecorder — the audio stays in this browser as a     */
/* blob URL and is NEVER uploaded; only a transcript the browser        */
/* itself produced can be sent, as ordinary chat text.                 */
/* Read-aloud: speechSynthesis over the markdown-stripped answer.      */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function speechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined;
  return ctor ?? null;
}

/** Remove markdown so an answer can be spoken naturally. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/°/g, " degrees")
    .replace(/\s+/g, " ")
    .trim();
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
  const [ownerPremium, setOwnerPremium] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice state (milestone 13).
  const [readAloud, setReadAloud] = useState(false);
  const readAloudRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [inputViaVoice, setInputViaVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pendingRecording, setPendingRecording] = useState<{ url: string; seconds: number } | null>(null);
  const [recordTranscript, setRecordTranscript] = useState("");
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTranscriptRef = useRef("");
  const recordSecondsRef = useRef(0);

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
    // Owner premium is decided by the server (verified session +
    // ADMIN_EMAIL) — when it answers premium, credits are bypassed.
    void import("@/lib/accounts-client").then(({ fetchPremium }) =>
      fetchPremium().then((p) => setOwnerPremium(p.premium)),
    );
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

  // Stop all voice activity when the drawer closes or unmounts.
  useEffect(() => {
    if (!open && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [open ]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function speakAnswer(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(stripForSpeech(text));
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  }

  function toggleReadAloud() {
    const next = !readAloud;
    setReadAloud(next);
    readAloudRef.current = next;
    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  /** Mic dictation into the chat input (not a recording). */
  function toggleDictation() {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      setListening(false);
      return;
    }
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      setVoiceNote(
        "Voice dictation is not supported in this browser — Chrome and Edge offer it. Typing works as always, and voice recording below still works where MediaRecorder is available.",
      );
      return;
    }
    setVoiceNote(null);
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalText) {
        setInputViaVoice(true);
        setInput((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
      } else if (interim) {
        setVoiceNote(`Listening… ${interim}`);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setVoiceNote("Dictation stopped — the microphone may have been blocked. Check the browser's mic permission, or type your question.");
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setVoiceNote("Listening — speak your question, then it lands in the input box for you to send.");
    } catch {
      setListening(false);
    }
  }

  /** Start a recorded voice message (MediaRecorder, on-device only). */
  async function startRecording() {
    setVoiceNote(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceNote("Voice recording is not supported in this browser — MediaRecorder is unavailable here. Dictation or typing still work.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceNote("The microphone was blocked, so recording cannot start. Allow mic access in the browser, or type your question.");
      return;
    }
    recordStreamRef.current = stream;
    recordChunksRef.current = [];
    recordTranscriptRef.current = "";
    setRecordTranscript("");
    recordSecondsRef.current = 0;
    setRecordSeconds(0);

    // Best-effort live transcript alongside the recording, where the
    // browser offers recognition — the audio itself is never sent.
    const Ctor = speechRecognitionCtor();
    if (Ctor) {
      try {
        const rec = new Ctor();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (e) => {
          let finalText = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          }
          if (finalText) {
            recordTranscriptRef.current = `${recordTranscriptRef.current} ${finalText}`.trim();
            setRecordTranscript(recordTranscriptRef.current);
          }
        };
        rec.onend = () => undefined;
        rec.onerror = () => undefined;
        recognitionRef.current = rec;
        rec.start();
      } catch {
        /* recording continues without a transcript */
      }
    }

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      if (blob.size > 0) {
        setPendingRecording((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: URL.createObjectURL(blob), seconds: recordSecondsRef.current };
        });
      }
      setRecording(false);
    };
    recorder.start();
    setRecording(true);
    recordTimerRef.current = setInterval(() => {
      recordSecondsRef.current += 1;
      setRecordSeconds(recordSecondsRef.current);
    }, 1000);
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } catch {
      setRecording(false);
    }
  }

  function deleteRecording() {
    setPendingRecording((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setRecordTranscript("");
    recordTranscriptRef.current = "";
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
  }

  const exhausted = !ownerPremium && credits ? !canSend(credits, new Date()) : false;

  async function send(text: string, opts?: { viaVoice?: boolean }) {
    const message = text.trim();
    if (!message || busy || !credits) return;
    const now = new Date();
    if (!ownerPremium) {
      if (!canSend(credits, now)) return;
      const afterDeduct = deduct(credits, now);
      if (!afterDeduct) return;
      setCredits(afterDeduct);
      window.localStorage.setItem(creditsKey(profileKey), JSON.stringify(afterDeduct));
    }
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: message, viaVoice: opts?.viaVoice || undefined },
    ];
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
      if (readAloudRef.current) speakAnswer(reply.text);
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
                  {ownerPremium ? "Unlimited — owner premium" : credits ? creditsHeader(credits, new Date()) : "…"}
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={toggleReadAloud}
                  aria-pressed={readAloud}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    readAloud
                      ? "border-gold/60 bg-gold/15 text-gold-2"
                      : "border-line bg-panel-2 text-mist hover:text-moon"
                  }`}
                >
                  Read answers aloud: {readAloud ? "On" : "Off"}
                </button>
                <span className="text-[11px] text-fog">
                  Voice stays on this device — recordings are never uploaded.
                </span>
              </div>
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
                  <div className={`mt-1 flex items-center gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.viaVoice && (
                      <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-[11px] text-fog">
                        Voice turn — sent from a voice transcript
                      </span>
                    )}
                    {m.role === "assistant" && (
                      <button
                        onClick={() => speakAnswer(m.text)}
                        className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-[11px] text-mist hover:border-gold/60 hover:text-moon"
                      >
                        Listen
                      </button>
                    )}
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

            <div className="border-t border-line p-3">
              {(voiceNote || recording || pendingRecording) && (
                <div className="mb-3 rounded-xl border border-line bg-panel-2 px-3 py-2.5">
                  {recording && (
                    <p className="text-sm text-rose">
                      Recording… {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")} — tap Stop recording when you finish.
                    </p>
                  )}
                  {pendingRecording && !recording && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-fog">
                        Your voice message — {pendingRecording.seconds}s, stored only in this browser
                      </p>
                      <audio controls src={pendingRecording.url} className="mt-2 w-full" />
                      {recordTranscript ? (
                        <p className="mt-2 text-sm text-mist">
                          Transcript: <span className="text-moon">{recordTranscript}</span>
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-fog">
                          No transcript was captured for this recording (transcription needs the
                          browser&apos;s speech recognition). You can play it back here, or type
                          your question — the audio itself is never uploaded to any server.
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const t = recordTranscript.trim();
                            if (!t) return;
                            deleteRecording();
                            void send(t, { viaVoice: true });
                          }}
                          disabled={!recordTranscript.trim() || busy || exhausted}
                          className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#171204] disabled:opacity-50"
                        >
                          Send transcript as message
                        </button>
                        <button
                          onClick={deleteRecording}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-mist hover:text-moon"
                        >
                          Delete recording
                        </button>
                      </div>
                    </div>
                  )}
                  {voiceNote && !recording && (
                    <p className="mt-2 text-xs leading-relaxed text-fog">{voiceNote}</p>
                  )}
                  {voiceNote && recording && (
                    <p className="mt-1 text-xs leading-relaxed text-fog">{voiceNote}</p>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const viaVoice = inputViaVoice;
                  setInputViaVoice(false);
                  void send(input, { viaVoice });
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={exhausted}
                    className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
                      listening
                        ? "border-rose/60 bg-rose/10 text-rose"
                        : "border-line bg-panel-2 text-mist hover:text-moon"
                    }`}
                  >
                    {listening ? "Stop dictation" : "Dictate with mic"}
                  </button>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={() => void startRecording()}
                      disabled={exhausted}
                      className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs text-mist hover:text-moon disabled:opacity-50"
                    >
                      Record a voice message
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-lg border border-rose/60 bg-rose/10 px-3 py-1.5 text-xs text-rose"
                    >
                      Stop recording
                    </button>
                  )}
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
