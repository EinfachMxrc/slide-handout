import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "#/lib/auth/session";
import { signOut } from "#/auth";
import { ForceDark } from "#/components/providers/force-dark";

/**
 * Dashboard-Shell — editorialer Dark-Look, der die Cue-Brand aus dem Hero
 * aufgreift: italic Wordmark, sanfter Sky-Hauch oben, Hairline-Borders,
 * ruhiger Rhythmus. Logout läuft als Server-Action über Auth.js.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();
  if (!session) redirect("/login");

  async function logout(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const initial = (session.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="relative min-h-screen bg-navy-950 text-white">
      <ForceDark />

      {/* Sky-Echo — minimaler Hauch vom Landing-Hero, damit es nicht wie ein
       * generisches Admin-Panel wirkt. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[340px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(94,234,212,0.09), transparent 72%)",
        }}
      />

      <header className="relative z-10 border-b border-white/5 bg-navy-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="Zur Startseite"
              className="flex items-baseline gap-2 text-white transition hover:opacity-90"
            >
              <span className="font-display text-xl italic leading-none tracking-tight">
                Cue
              </span>
              <span
                aria-hidden
                className="inline-block h-1 w-1 rounded-full bg-teal-400"
              />
            </Link>
            <nav
              aria-label="Dashboard-Navigation"
              className="hidden items-center gap-6 text-sm text-navy-100 sm:flex"
            >
              <Link
                href="/handouts"
                className="py-1 transition hover:text-white"
              >
                Handouts
              </Link>
              <Link
                href="/powerpoint-addin"
                className="py-1 transition hover:text-white"
              >
                PowerPoint
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden items-center gap-2 sm:flex">
              <div
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-600 text-[11px] font-semibold text-navy-1000 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
              >
                {initial}
              </div>
              <span className="text-xs text-navy-400">{session.email}</span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-pill border border-white/10 bg-navy-900 px-3 py-1.5 text-xs font-medium text-navy-100 transition hover:border-salmon-400/60 hover:text-white"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {children}
      </main>
    </div>
  );
}
