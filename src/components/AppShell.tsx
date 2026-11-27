"use client";

/**
 * Application chrome: left sidebar (primary nav), top bar (profile chip +
 * last-updated stamp), mobile nav row. Wraps every page.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useProfile } from "./ProfileProvider";
import { formatDateTime } from "@/lib/profile";

const NAV: ReadonlyArray<{ href: string; label: string; icon: string }> = [
  { href: "/", label: "Home", icon: "✦" },
  { href: "/numerology", label: "Numerology", icon: "№" },
  { href: "/name-checker", label: "Name Checker", icon: "✓" },
  { href: "/chinese", label: "Chinese", icon: "龍" },
  { href: "/western", label: "Western", icon: "☉" },
  { href: "/vedic", label: "Vedic", icon: "ॐ" },
  { href: "/report", label: "Full Report", icon: "▤" },
  { href: "/science", label: "Science", icon: "⚛" },
  { href: "/elements", label: "Elements", icon: "🜁" },
  { href: "/chakras", label: "Chakras", icon: "☸" },
  { href: "/karma-purpose", label: "Karma & Purpose", icon: "♻" },
  { href: "/red-book", label: "The Red Book", icon: "❦" },
];

function NavLinks({ vertical }: { vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={vertical ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto"}>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-panel-2 font-semibold text-gold-2 shadow-[inset_0_0_0_1px_var(--color-line)]"
                : "text-mist hover:bg-panel-2/60 hover:text-moon"
            }`}
          >
            <span className={`w-5 text-center ${active ? "text-gold" : "text-fog"}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, loaded } = useProfile();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-night px-4 py-6 print:hidden md:flex">
        <Link href="/" className="mb-1 px-2">
          <div className="text-lg font-bold tracking-tight text-moon">
            Astro<span className="text-gold">Numerology</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-fog">
            Four traditions · one verified profile
          </div>
        </Link>
        <div className="mt-6">
          <NavLinks vertical />
        </div>
        <div className="mt-auto px-2 text-xs leading-relaxed text-fog">
          Calculations are exact and test-locked. Interpretations follow the
          classical texts — labelled as tradition, never sold as certainty.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-abyss/85 backdrop-blur print:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="font-bold tracking-tight text-moon md:hidden">
              Astro<span className="text-gold">Numerology</span>
            </Link>
            <div className="hidden text-sm text-fog md:block">
              Chaldean · Pythagorean · Western · Vedic · Chinese
            </div>
            {loaded && profile ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold leading-tight text-moon">
                    {profile.fullName}
                  </div>
                  <div className="text-[11px] leading-tight text-fog">
                    Last updated {formatDateTime(profile.updatedAt)}
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist transition-colors hover:border-gold/60 hover:text-gold-2"
                >
                  Edit profile
                </Link>
              </div>
            ) : (
              <Link
                href="/profile"
                className="rounded-lg bg-gold px-3.5 py-1.5 text-xs font-semibold text-[#171204] transition-colors hover:bg-gold-2"
              >
                Create profile
              </Link>
            )}
          </div>
          <div className="border-t border-line px-4 py-2 md:hidden">
            <NavLinks />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 print:max-w-none print:p-0">
          {children}
        </main>

        <footer className="border-t border-line py-5 text-center text-xs text-fog print:hidden">
          AstroNumerology — calculations are exact and reproducible.
          Interpretations are traditional indications, provided for reflection
          and entertainment. Not medical, financial or legal advice.
        </footer>
      </div>
    </div>
  );
}
