/**
 * Small hand-built component set for the dashboard — Button, Card,
 * Input/Field, Stat, Tabs, Badge. Tailwind v4 utilities on the theme
 * tokens defined in globals.css. No component library.
 */

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "ghost" | "subtle" | "danger";

const buttonClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-[#171204] font-semibold hover:bg-gold-2 shadow-[0_0_0_1px_rgba(201,164,92,0.35),0_8px_24px_-12px_rgba(201,164,92,0.7)]",
  ghost:
    "border border-line text-moon hover:border-gold/60 hover:text-gold-2 bg-transparent",
  subtle: "bg-panel-2 text-mist hover:text-moon border border-line",
  danger: "border border-rose/50 text-rose hover:bg-rose/10 bg-transparent",
};

function buttonClassName(variant: ButtonVariant, className = ""): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm",
    "transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
    buttonClasses[variant],
    className,
  ].join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-panel p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold tracking-wide text-moon">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-fog">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stat                                                                */
/* ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel-2/60 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-fog">
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-bold leading-none ${accent ? "text-gold-2" : "text-moon"}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-mist">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field + Input                                                       */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-mist">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-fog">{hint}</span>}
      {error && error.length > 0 && (
        <span className="mt-1 block text-xs font-medium text-rose" role="alert">
          {error[0]}
        </span>
      )}
    </label>
  );
}

export function Input({
  invalid,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={[
        "w-full rounded-lg border bg-night px-3 py-2.5 text-sm text-moon",
        "placeholder:text-fog focus:outline-none focus:ring-2",
        invalid
          ? "border-rose/70 focus:ring-rose/40"
          : "border-line focus:border-gold/60 focus:ring-gold/25",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

const badgeTones: Record<string, string> = {
  gold: "border-gold/40 text-gold-2 bg-gold/10",
  violet: "border-violet/40 text-violet bg-violet/10",
  jade: "border-jade/40 text-jade bg-jade/10",
  amber: "border-amber/40 text-amber bg-amber/10",
  rose: "border-rose/40 text-rose bg-rose/10",
  mist: "border-line text-mist bg-panel-2",
};

export function Badge({
  tone = "mist",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex rounded-lg border border-line bg-night p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3.5 py-1.5 text-sm transition-colors ${
            active === tab.id
              ? "bg-panel-2 font-semibold text-gold-2 shadow-[inset_0_0_0_1px_var(--color-line)]"
              : "text-mist hover:text-moon"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared page bits                                                    */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  blurb,
  action,
}: {
  title: string;
  blurb?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-moon">{title}</h1>
        {blurb && <p className="mt-1 max-w-2xl text-sm text-mist">{blurb}</p>}
      </div>
      {action}
    </div>
  );
}

export function NoProfile({ what }: { what: string }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <div className="py-6">
        <div className="mb-3 text-4xl text-gold">✦</div>
        <h2 className="text-lg font-semibold text-moon">No profile yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
          {what} needs your birth profile first. It takes under a minute —
          name, date of birth, and birth place.
        </p>
        <div className="mt-5">
          <ButtonLink href="/profile">Create your profile</ButtonLink>
        </div>
      </div>
    </Card>
  );
}
