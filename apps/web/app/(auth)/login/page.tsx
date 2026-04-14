import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "#/auth";
import { Card } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";

/**
 * Login-Seite — 100% Server-Component + Server-Action.
 * Auth.js `signIn()` läuft auf dem Server, setzt das JWT-Cookie, und
 * redirectet zurück zur `next`-URL (oder `/dashboard`).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const errorCode = sp.error;

  async function login(formData: FormData): Promise<void> {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: next,
      });
    } catch (e) {
      if (e instanceof AuthError) {
        redirect(`/login?error=${e.type}&next=${encodeURIComponent(next)}`);
      }
      throw e;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card>
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <p className="mt-1 text-sm text-navy-700 dark:text-navy-100">
          Mit deinem Slide-Handout-Account.
        </p>
        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              E-Mail
            </label>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              Passwort
            </label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {errorCode && (
            <p className="text-sm text-red-500">
              {errorCode === "CredentialsSignin"
                ? "E-Mail oder Passwort stimmt nicht."
                : "Anmelden fehlgeschlagen."}
            </p>
          )}
          <Button type="submit" className="w-full">
            Anmelden
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-navy-700 dark:text-navy-100">
          Noch kein Account?{" "}
          <Link href="/register" className="text-teal-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </Card>
    </main>
  );
}
