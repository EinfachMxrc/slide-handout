"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandoutCreate } from "#/lib/zod/handout";

type FormValues = HandoutCreate;

/**
 * New Handout — editoriale Version.
 *
 * Kein Card-Wrapper mehr: die Page rendert eine Hero-Sektion mit eyebrow,
 * kursivem Display-Titel und einer großzügigen Form-Surface rechts.
 *
 * Alle Convex-Writes laufen weiterhin über `/api/handouts` — die Route
 * liest den Session-Cookie, hasht ihn und übergibt `tokenHash` an Convex.
 * Der raw Token verlässt nie den Browser.
 */
export default function NewHandoutPage(): React.ReactElement {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(HandoutCreate),
    mode: "onTouched",
    defaultValues: { title: "", description: "" },
  });

  const liveTitle = watch("title");
  const liveDescription = watch("description");

  async function onSubmit(values: FormValues): Promise<void> {
    setSubmitError(null);
    const res = await fetch("/api/handouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setSubmitError("Konnte nicht angelegt werden.");
      return;
    }
    const { id } = (await res.json()) as { id: string };
    router.push(`/handouts/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Breadcrumb-Zeile */}
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
        <Link
          href="/dashboard"
          className="transition-colors hover:text-teal-300"
        >
          Dashboard
        </Link>
        <span aria-hidden className="text-white/25">
          /
        </span>
        <span className="text-white/70">Neu anlegen</span>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-12">
        {/* Linke Spalte: Editorial-Copy + Live-Preview */}
        <section className="md:col-span-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-300/80">
            Neues Handout
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] leading-[0.95] tracking-[-0.02em] text-white">
            Gib ihm{" "}
            <em className="font-display italic text-teal-300">einen Namen.</em>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
            Der Titel steht oben im Reader. Die Beschreibung erscheint
            darunter — ein kurzer Hook, ein Untertitel, ein Datum. Alles
            lässt sich später im Editor anpassen.
          </p>

          {/* Live-Vorschau des Readers — editoriale Spoiler-Karte */}
          <div className="mt-10 rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
              Vorschau im Reader
            </p>
            <div className="mt-4 border-l-2 border-teal-400/60 pl-4">
              <h2 className="font-display text-2xl italic leading-tight text-white">
                {liveTitle?.trim() || "Dein Handout-Titel"}
              </h2>
              {liveDescription?.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {liveDescription}
                </p>
              ) : (
                <p className="mt-2 text-sm italic leading-relaxed text-white/35">
                  Eine Beschreibung — so wie sie Leser sehen werden.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Rechte Spalte: Form */}
        <section className="md:col-span-7">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 -z-10 rounded-[36px] bg-teal-400/5 opacity-60 blur-2xl"
            />
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-7 rounded-[28px] border border-white/10 bg-navy-900/70 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              noValidate
            >
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal-300/80">
                  Eckdaten
                </p>
                <h3 className="font-display text-xl italic leading-tight text-white">
                  Fundament legen
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                    Titel
                  </label>
                  <span className="text-[11px] text-white/40">max. 120</span>
                </div>
                <input
                  maxLength={120}
                  {...register("title")}
                  aria-invalid={!!errors.title}
                  placeholder="z. B. Vortrag zur Zukunft der Arbeit"
                  className="w-full rounded-pill border border-white/10 bg-navy-950/70 px-5 py-3.5 text-sm text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
                />
                {errors.title && (
                  <p className="text-xs text-salmon-300" role="alert">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                    Beschreibung
                  </label>
                  <span className="text-[11px] text-white/40">optional</span>
                </div>
                <textarea
                  rows={5}
                  maxLength={2000}
                  {...register("description")}
                  aria-invalid={!!errors.description}
                  placeholder="Ein kurzer Hook, Untertitel oder Datum. Markdown erlaubt."
                  className="w-full rounded-card border border-white/10 bg-navy-950/70 px-5 py-4 text-sm leading-relaxed text-white placeholder:text-white/30 transition-[border-color,box-shadow] focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
                />
                {errors.description && (
                  <p className="text-xs text-salmon-300" role="alert">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-card border border-salmon-400/30 bg-salmon-500/10 px-4 py-3 text-sm text-salmon-200"
                >
                  {submitError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-pill bg-teal-400 px-6 py-3 text-sm font-semibold text-navy-1000 shadow-[0_12px_36px_-12px_rgba(94,234,212,0.6)] transition hover:bg-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-400/30 disabled:cursor-not-allowed disabled:bg-teal-400/50"
                >
                  {isSubmitting ? "Anlegen …" : "Handout anlegen →"}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-pill border border-white/15 px-5 py-3 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white"
                >
                  Abbrechen
                </Link>
              </div>

              <p className="text-[11px] text-white/45">
                Du kannst Blöcke, Branding und Theme nach dem Anlegen im
                Editor pflegen.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
