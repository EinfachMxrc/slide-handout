import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "#/auth";
import {
  AuthShell,
  Field,
  authInputClass,
  authSubmitClass,
} from "#/components/auth/auth-shell";

/**
 * Login — 100 % Server-Component + Server-Action.
 * Auth.js `signIn()` läuft auf dem Server, setzt das JWT-Cookie und
 * redirectet zurück zur `next`-URL (oder `/dashboard`).
 *
 * Editorial-Treatment: 2-Spalten-AuthShell, dunkel geframed, Glass-Card
 * mit pill-Inputs + teal Submit. Keine Titelkarte mehr — die Spalte links
 * trägt die Botschaft.
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

  const errorMessage =
    errorCode === "CredentialsSignin"
      ? "E-Mail oder Passwort stimmt nicht."
      : errorCode
        ? "Anmelden fehlgeschlagen."
        : undefined;

  return (
    <AuthShell
      eyebrow="Willkommen zurück"
      titleLead="Melde dich an."
      titleAccent="Dein Auftritt wartet."
      lede="Cue erinnert sich an jede Szene, jeden Takt, jede Folie — du musst nur loslegen."
      bullets={[
        "Handouts synchron zu deiner Präsentation freigeben.",
        "Live-Reveal, QR-Pairing, Hybrid-Modus — alles eingebaut.",
        "Dark-Mode, Accent-Farben, Print-Ready PDF per Klick.",
      ]}
      footerPrompt="Noch kein Account?"
      footerHref="/register"
      footerLinkLabel="Kostenlos registrieren"
      topRightHref="/register"
      topRightLabel="Registrieren"
    >
      <form action={login} className="space-y-6" noValidate>
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
            Anmelden
          </p>
          <h2 className="font-display text-2xl italic leading-tight text-white">
            Mit deinem Cue-Account
          </h2>
        </div>
        <Field label="E-Mail">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="du@beispiel.de"
            className={authInputClass}
          />
        </Field>
        <Field label="Passwort">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            className={authInputClass}
          />
        </Field>
        {errorMessage && (
          <div
            role="alert"
            className="rounded-card border border-salmon-400/30 bg-salmon-500/10 px-4 py-3 text-sm text-salmon-200"
          >
            {errorMessage}
          </div>
        )}
        <button type="submit" className={authSubmitClass}>
          Anmelden →
        </button>
      </form>
    </AuthShell>
  );
}
