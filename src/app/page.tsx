import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";

const SYSTEMS: ReadonlyArray<{
  href: string;
  icon: string;
  title: string;
  blurb: string;
  status: string;
}> = [
  {
    href: "/numerology",
    icon: "№",
    title: "Numerology",
    blurb:
      "Chaldean and Pythagorean engines side by side — life path, destiny, soul urge, compound numbers and personal cycles, all test-locked.",
    status: "Live in this prototype",
  },
  {
    href: "/chinese",
    icon: "龍",
    title: "Chinese Astrology",
    blurb:
      "Your animal and element resolved against the real Lunar New Year boundary, with secret-friend, clash and trine relations and year outlooks.",
    status: "Live in this prototype",
  },
  {
    href: "/western",
    icon: "☉",
    title: "Western Astrology",
    blurb:
      "Tropical chart on the astronomy-engine ephemeris — planets, houses, aspects and transits, cross-checked against published charts.",
    status: "Building next",
  },
  {
    href: "/vedic",
    icon: "ॐ",
    title: "Vedic Astrology",
    blurb:
      "Sidereal chart with Lahiri ayanamsa, Moon nakshatra and the Vimshottari dasha timeline from the classical Parashari system.",
    status: "Building next",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel-2 via-night to-abyss px-6 py-14 sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Chaldean · Pythagorean · Western · Vedic · Chinese
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-moon sm:text-5xl">
          Every system you trust,
          <br />
          <span className="bg-gradient-to-r from-gold-2 via-gold to-violet bg-clip-text text-transparent">
            one exact dashboard.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">
          Enter your name and birth details once. The engines do the rest —
          verifiable calculations first, classical interpretation second,
          clearly labelled as tradition.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/profile" className="px-6 py-3 text-base">
            Create your profile
          </ButtonLink>
          <ButtonLink href="/name-checker" variant="ghost" className="px-6 py-3 text-base">
            Check a business name
          </ButtonLink>
        </div>
      </section>

      {/* The four systems */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-moon">The systems</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SYSTEMS.map((s) => (
          <Link key={s.href} href={s.href} className="group block">
            <Card className="h-full transition-colors group-hover:border-gold/50">
              <div className="flex items-start justify-between">
                <span className="text-3xl text-gold">{s.icon}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    s.status.startsWith("Live")
                      ? "border-jade/40 bg-jade/10 text-jade"
                      : "border-line bg-panel-2 text-mist"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-moon">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{s.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: "Post your credentials once",
            d: "Name, date of birth, time and place — validated field by field before anything is stored.",
          },
          {
            n: "2",
            t: "Engines calculate exactly",
            d: "Pure, test-locked mathematics. Your cycles are recomputed against today every time you look — never stale.",
          },
          {
            n: "3",
            t: "Read tradition, labelled",
            d: "Interpretations come from the classical texts and are marked as tradition — never sold as certainty.",
          },
        ].map((step) => (
          <Card key={step.n}>
            <div className="text-2xl font-bold text-gold">{step.n}</div>
            <h3 className="mt-2 font-semibold text-moon">{step.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist">{step.d}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
