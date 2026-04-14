import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "#/lib/auth/session";
import { ForceDark } from "#/components/providers/force-dark";

/**
 * Dashboard-Bereich ist immer dunkel — der Theme-Toggle gilt nur im Reader
 * für Endnutzer. Vermeidet inkonsistente Light-Mode-Cards im Editor.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <ForceDark />
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
            >
              <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-br from-teal-400 to-salmon-400" />
              Slide&nbsp;Handout
            </Link>
            <nav className="hidden gap-5 text-sm text-navy-100 sm:flex">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <Link href="/handouts" className="hover:text-white">
                Handouts
              </Link>
              <Link
                href="/powerpoint-addin"
                className="hover:text-white"
              >
                PowerPoint
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-navy-400 sm:inline">
              {session.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-pill border border-white/10 px-3 py-1.5 text-xs font-medium text-navy-100 hover:border-salmon-400 hover:text-white"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
