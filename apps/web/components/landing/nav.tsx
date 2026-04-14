import Link from "next/link";

export function LandingNav(): React.ReactElement {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-semibold tracking-tight text-white"
      >
        <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-br from-teal-400 to-salmon-400" />
        Slide Handout
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="px-3 py-2 text-navy-100 hover:text-white"
        >
          Anmelden
        </Link>
        <Link
          href="/register"
          className="rounded-pill bg-teal-400 px-4 py-2 font-semibold text-navy-1000 shadow-sm shadow-teal-400/30 hover:bg-teal-300"
        >
          Kostenlos starten
        </Link>
      </div>
    </nav>
  );
}
