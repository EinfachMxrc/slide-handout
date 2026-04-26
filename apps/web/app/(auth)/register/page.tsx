"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterPayload } from "#/lib/zod/auth";
import {
  AuthShell,
  Field,
  authInputClass,
  authSubmitClass,
} from "#/components/auth/auth-shell";

type FormValues = RegisterPayload;

/**
 * Register — Client-Component (react-hook-form + zodResolver), POSTet an
 * `/api/auth/register`. Auf Erfolg → Dashboard-Redirect + Router-Refresh
 * damit der neue Cookie beim nächsten RSC-Aufruf verfügbar ist.
 *
 * Editorial treatment spiegelt das Login: 2-Spalten-Shell, Glass-Card mit
 * pill-Inputs, salmon-Akzent für Fehlermeldungen.
 */
export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(RegisterPayload),
    mode: "onTouched",
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setSubmitError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (data.error === "email_taken") {
        setSubmitError("Diese E-Mail ist bereits registriert.");
      } else if (data.error === "rate_limited") {
        setSubmitError("Zu viele Versuche. Warte einen Moment.");
      } else {
        setSubmitError("Registrierung fehlgeschlagen.");
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Bühne bereiten"
      titleLead="Leg los."
      titleAccent="In unter 60 Sekunden."
      lede="Account erstellen, erstes Handout anlegen, Reader-Link teilen — kein Setup, keine Karte."
      bullets={[
        "Unbegrenzte Handouts, Blöcke, Sitzungen — auch in der Free-Stufe.",
        "Live-Sync mit Folien oder per Klick — du entscheidest pro Sitzung.",
        "Volle Kontrolle über Branding: Logo, Farben, Schrift, Theme.",
      ]}
      footerPrompt="Schon registriert?"
      footerHref="/login"
      footerLinkLabel="Zum Login"
      topRightHref="/login"
      topRightLabel="Anmelden"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
            Account
          </p>
          <h2 className="font-display text-2xl italic leading-tight text-white">
            Registrieren
          </h2>
        </div>

        <Field label="Anzeigename" error={errors.displayName?.message}>
          <input
            {...register("displayName")}
            aria-invalid={!!errors.displayName}
            placeholder="z. B. Maria Müller"
            className={authInputClass}
          />
        </Field>

        <Field label="E-Mail" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
            placeholder="du@beispiel.de"
            className={authInputClass}
          />
        </Field>

        <Field
          label="Passwort"
          hint="mind. 10 Zeichen"
          error={errors.password?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={!!errors.password}
            className={authInputClass}
          />
        </Field>

        {submitError && (
          <div
            role="alert"
            className="rounded-card border border-salmon-400/30 bg-salmon-500/10 px-4 py-3 text-sm text-salmon-200"
          >
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={authSubmitClass}
        >
          {isSubmitting ? "Anlegen …" : "Account anlegen →"}
        </button>

        <p className="text-center text-[11px] text-white/40">
          Mit der Registrierung akzeptierst du unsere leichten
          Nutzungsbedingungen. Keine Werbung. Kein Tracking.
        </p>
      </form>
    </AuthShell>
  );
}
