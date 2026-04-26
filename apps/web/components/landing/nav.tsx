import Link from "next/link";

/**
 * Air-Style-Nav — transparent über dem Hero-Sky.
 *
 * Links: schlankes Wortmark + Section-Anker (Features/Pricing/Resources/About).
 * Rechts: Login (Plain), CTA-Outline (white) und CTA-Solid (white auf dunkel).
 *
 * Position: absolute, damit der Sky-Hero darunter Full-Bleed atmen kann. Auf
 * Sections darunter (Paper-Bereich) rendert die Page eine zweite, dunkle
 * Variante über sticky/scroll — kommt im nächsten Refactor-Schritt.
 */
export function LandingNav({
  loggedIn,
  email,
}: {
  loggedIn: boolean;
  email?: string;
}): React.ReactElement {
  return (
    <nav className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
        {/* Linke Section: Menü-Links (flex-1 damit sie den Raum links füllt) */}
        <div className="flex flex-1 items-center justify-start">
          <div className="hidden gap-6 text-sm text-white/85 sm:flex">
            <Link href="#features" className="transition hover:text-white">
              Features
            </Link>
            <Link href="#how" className="transition hover:text-white">
              So funktioniert&apos;s
            </Link>
            <Link href="/powerpoint-addin" className="transition hover:text-white">
              PowerPoint
            </Link>
          </div>
        </div>

        {/* Mitte: Brand-Slot — hier landet der FLIP vom Hero-Wordmark.
            flex-shrink-0 damit es sich nicht stauchen lässt. */}
        <div className="flex flex-shrink-0 items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]"
          >
            {/* Brand-Slot: Hero-Wordmark fliegt hier rein. Initial hidden,
                wird von air-intro-scene nach dem FLIP enthüllt. */}
            <span
              id="air-brand-target"
              className="font-display italic"
              style={{ opacity: 0 }}
            >
              Cue
            </span>
          </Link>
        </div>

        {/* Rechte Section: Auth / CTAs (flex-1, rechts ausgerichtet) */}
        <div className="flex flex-1 items-center justify-end gap-2 text-sm">
          {loggedIn ? (
            <>
              {email && (
                <span className="hidden text-xs text-white/70 sm:inline">
                  {email}
                </span>
              )}
              <Link
                href="/dashboard"
                className="rounded-pill bg-white px-4 py-2 font-semibold text-ink shadow-[0_4px_18px_rgba(0,0,0,0.12)] transition hover:bg-white/90"
              >
                Dashboard →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-white/85 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-pill border border-white/60 bg-white/10 px-4 py-2 font-medium text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Kostenlos starten
              </Link>
              <Link
                href="#how"
                className="hidden rounded-pill bg-white px-4 py-2 font-semibold text-ink shadow-[0_4px_18px_rgba(0,0,0,0.12)] transition hover:bg-white/90 sm:inline-flex"
              >
                Demo ansehen
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
