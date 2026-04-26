import Link from "next/link";
import { ForceDark } from "#/components/providers/force-dark";

/**
 * AuthShell — editoriales 2-Spalten-Frame für Login/Register.
 *
 * Linke Spalte: "Cue"-Wordmark in der Ecke, eyebrow + display-headline mit
 * kursivem Teal-Akzent, drei Feature-Bullets mit zarten Tealstrichen.
 *
 * Rechte Spalte: Glass-Card (slot via `children`) mit Formular.
 *
 * Sky-echo-Gradient + feines Grid-Masking im Hintergrund — echo der
 * Landing-Hero-Atmosphäre, ohne deren Gewicht.
 *
 * ForceDark sorgt dafür, dass auch mit user-light-preference der Auth-
 * Screen konsistent dunkel rendert. Beim Verlassen räumt ForceDark auf.
 */
interface AuthShellProps {
  /** z.B. "Willkommen zurück" / "Bühne bereiten" */
  eyebrow: string;
  /** Plain-text Teil vor dem italic accent */
  titleLead: string;
  /** Italic-styled, farbiger accent Teil */
  titleAccent: string;
  /** Kurzer Paragraph unter der Headline */
  lede: string;
  /** Drei kurze Stichpunkte für die Feature-Liste */
  bullets: readonly [string, string, string];
  /** Footer unten links — meistens navigations-Prompt "Noch kein Account?" */
  footerPrompt: string;
  footerHref: string;
  footerLinkLabel: string;
  /** Ecke rechts oben — "Zum Dashboard" / "Zurück" etc. */
  topRightHref: string;
  topRightLabel: string;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  titleLead,
  titleAccent,
  lede,
  bullets,
  footerPrompt,
  footerHref,
  footerLinkLabel,
  topRightHref,
  topRightLabel,
  children,
}: AuthShellProps): React.ReactElement {
  return (
    <>
      <ForceDark />
      <div className="relative isolate min-h-screen overflow-hidden bg-navy-1000 text-white">
        {/* Sky-echo — radiale Aurora oben-mittig wie bei der Landing-Hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] -z-10"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(94,234,212,0.14), rgba(94,234,212,0.04) 45%, transparent 72%)",
          }}
        />
        {/* Zweite, kühlere Welle unten rechts — bricht die Symmetrie */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-[-20%] w-[70%] -z-10"
          style={{
            background:
              "radial-gradient(closest-side, rgba(120,168,255,0.12), transparent 70%)",
          }}
        />
        {/* Feines Grid — editoriale Atmosphäre, kein Skeleton-Raster */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 85%)",
          }}
        />

        {/* Topbar */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8 sm:px-10">
          <Link
            href="/"
            className="group inline-flex items-baseline gap-2"
            aria-label="Zur Startseite"
          >
            <span className="font-display text-3xl italic leading-none tracking-[-0.04em] text-white transition-colors group-hover:text-teal-300">
              Cue
            </span>
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 translate-y-[-4px] rounded-full bg-teal-400 transition-transform group-hover:translate-y-[-6px]"
            />
          </Link>
          <Link
            href={topRightHref}
            className="text-xs font-medium uppercase tracking-[0.22em] text-white/60 transition-colors hover:text-teal-300"
          >
            {topRightLabel}
          </Link>
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-16 sm:px-10 md:grid-cols-12 md:gap-16 md:pt-24">
          {/* Linke Spalte — Editorial-Copy */}
          <section className="md:col-span-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-300/80">
              {eyebrow}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-white">
              {titleLead}{" "}
              <em className="font-display italic text-teal-300">
                {titleAccent}
              </em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
              {lede}
            </p>
            <ul className="mt-10 space-y-4 border-l border-white/10 pl-5">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="relative text-sm leading-relaxed text-white/75"
                >
                  <span
                    aria-hidden
                    className="absolute -left-[21px] top-[0.6em] h-px w-3 bg-teal-300/60"
                  />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-14 text-sm text-white/50">
              {footerPrompt}{" "}
              <Link
                href={footerHref}
                className="font-medium text-teal-300 underline-offset-4 hover:text-teal-200 hover:underline"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </section>

          {/* Rechte Spalte — Glass-Card mit Slot für Formular */}
          <section className="md:col-span-6">
            <div className="relative">
              {/* sanfter Außen-Glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] bg-teal-400/10 opacity-50 blur-3xl"
              />
              <div className="rounded-[32px] border border-white/10 bg-navy-900/70 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-10">
                {children}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/**
 * Field — wiederverwendbarer Label/Input-Slot mit konsistentem Spacing
 * und Error-State. Wird von login/register/new-handout genutzt.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          {label}
        </label>
        {hint && <span className="text-[11px] text-white/40">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-xs text-salmon-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Shared input style for auth forms — darker glass, pill radius,
 * teal focus ring. Used directly on <input>/<textarea>.
 */
export const authInputClass =
  "w-full rounded-pill border border-white/10 bg-navy-950/70 px-5 py-3.5 text-sm text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20 disabled:opacity-50";

/** Like authInputClass but rounded-card for multi-line textarea. */
export const authTextareaClass =
  "w-full rounded-card border border-white/10 bg-navy-950/70 px-5 py-4 text-sm leading-relaxed text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20 disabled:opacity-50";

/** Primary submit button — teal with soft underglow. */
export const authSubmitClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-pill bg-teal-400 px-6 py-3.5 text-sm font-semibold text-navy-1000 shadow-[0_12px_36px_-12px_rgba(94,234,212,0.65)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30 disabled:cursor-not-allowed disabled:bg-teal-400/50";
