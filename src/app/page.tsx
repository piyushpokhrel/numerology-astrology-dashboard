import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { HomeCycles } from "@/components/HomeCycles";

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
      "Chaldean and Pythagorean engines side by side — life path, destiny, soul urge, compound numbers and personal cycles, each figure shown with its arithmetic.",
    status: "Live",
  },
  {
    href: "/chinese",
    icon: "龍",
    title: "Chinese Astrology",
    blurb:
      "Your animal and element resolved against the real Lunar New Year boundary, with secret-friend, clash and trine relations and year outlooks.",
    status: "Live",
  },
  {
    href: "/western",
    icon: "☉",
    title: "Western Astrology",
    blurb:
      "Tropical chart on a published ephemeris — planets, houses and aspects, cross-checked against published charts to within 0.013°.",
    status: "Live",
  },
  {
    href: "/vedic",
    icon: "ॐ",
    title: "Vedic Astrology",
    blurb:
      "Sidereal chart with Lahiri ayanamsa, Moon nakshatra and the Vimshottari dasha timeline from the classical Parashari system.",
    status: "Live",
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
          Exact calculations from four traditions —
          <br />
          <span className="bg-gradient-to-r from-gold-2 via-gold to-violet bg-clip-text text-transparent">
            one verified profile.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">
          Chaldean and Pythagorean numerology, Western and Vedic astrology,
          and Chinese astrology, computed precisely from a single birth
          profile. Every result shows its mathematics. Every interpretation
          names its source.
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

      {/* Personal cycles for the active profile (if one exists) */}
      <HomeCycles />

      {/* The four systems */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-moon">The four traditions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SYSTEMS.map((s) => (
          <Link key={s.href} href={s.href} className="group block">
            <Card className="h-full transition-colors group-hover:border-gold/50">
              <div className="flex items-start justify-between">
                <span className="text-3xl text-gold">{s.icon}</span>
                <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs font-medium text-jade">
                  {s.status}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-moon">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{s.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Campaign — what the service offers, and to whom */}
      <h2 className="mb-4 mt-12 text-lg font-semibold text-moon">What this service does</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "For individuals",
            h: "Your numbers, checked properly",
            d: "A complete personal profile — life path, destiny, personal cycles and charts in four traditions — calculated exactly and explained step by step, so you can verify every figure yourself.",
          },
          {
            t: "For founders",
            h: "Business names, checked before you commit",
            d: "The name checker scores a business or personal name against the founder's birth numbers in both numerology systems, using a documented, deterministic method with the full reasoning shown.",
          },
          {
            t: "For practitioners",
            h: "Client reports you can stand behind",
            d: "One verified profile produces a consistent, reproducible report across all four traditions — the same inputs always give the same results, ready to print or save as PDF.",
          },
        ].map((c) => (
          <Card key={c.t}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              {c.t}
            </div>
            <h3 className="mt-2 font-semibold text-moon">{c.h}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist">{c.d}</p>
          </Card>
        ))}
      </div>

      {/* Pricing — the free core and the one paid product */}
      <h2 className="mb-4 mt-12 text-lg font-semibold text-moon">Pricing, plainly</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-jade">
            Free — forever
          </div>
          <h3 className="mt-2 font-semibold text-moon">Everything that calculates</h3>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            All calculators, charts, the name checker, Panchanga and the
            standard report — free forever. No account, no trial clock, no
            feature held back. That is permanent, not an introductory offer.
          </p>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            AI chat — 7 free replies a month
          </div>
          <h3 className="mt-2 font-semibold text-moon">Unlimited with the $15/month subscription</h3>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            The side chat answers from the same engines — 7 free replies
            every month, no card needed. Unlimited chat is $15/month: cancel
            anytime in one click, billed under the real business name. No
            countdowns, no fake discounts, no teaser prices.
          </p>
        </Card>
        <Link href="/red-book" className="group block">
          <Card className="h-full border-[#6e1420] bg-[#20070c] transition-colors group-hover:border-[#8a6a2f]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a86a]">
              One-time
            </div>
            <h3 className="mt-2 font-serif text-lg font-bold text-[#f3e2ac]">
              The Red Book — $19, once
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#e9d9c8]">
              The full deep reading for one profile: eight chapters across
              the four traditions, with the compounds, the dasha sub-periods,
              karma and purpose, and the combined synthesis. One payment per
              profile — no subscription, no tiers. The first chapter is free
              to read, and refunds go to the original payment method.
            </p>
          </Card>
        </Link>
      </div>

      {/* Motive */}
      <section className="mt-12 rounded-3xl border border-line bg-panel-2/40 px-6 py-10 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Our motive
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-snug tracking-tight text-moon">
          Authentic knowledge, computed exactly and shown openly.
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-mist sm:text-base">
          <p>
            Much of this industry sells certainty it cannot show: readings
            written vaguely enough to fit anyone, fear used to sell remedies,
            and subscriptions designed to be difficult to leave. We built the
            opposite.
          </p>
          <p>
            The classical traditions — Parashara&apos;s Jyotisha, Cheiro&apos;s
            Chaldean numbers, the Chinese calendar masters — worked in exact
            numbers and named methods. This service holds to that standard:
            calculations you can reproduce, sources you can check, and honest
            labels wherever a method is modern rather than classical. If a
            figure here cannot be traced to its calculation and its source,
            it does not belong here.
          </p>
        </div>
      </section>

      {/* How it works */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: "Enter your birth details once",
            d: "Name, date of birth, time and place — validated field by field before anything is stored, and kept only in your browser.",
          },
          {
            n: "2",
            t: "Calculations run exactly",
            d: "Test-locked engines compute every number and chart position. Your cycles are recomputed against today every time you look — never stale.",
          },
          {
            n: "3",
            t: "Interpretation, with its source",
            d: "Readings follow the classical texts and cite them. Modern methods are labelled modern. Tradition is presented as tradition — never sold as certainty.",
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
