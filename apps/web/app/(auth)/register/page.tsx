"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { RegisterPayload } from "#/lib/zod/auth";

type FormValues = RegisterPayload;

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card>
        <h1 className="text-2xl font-semibold">Account anlegen</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              Anzeigename
            </label>
            <Input {...register("displayName")} aria-invalid={!!errors.displayName} />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.displayName.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              E-Mail
            </label>
            <Input
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
              Passwort (mind. 10 Zeichen)
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Anlegen …" : "Account anlegen"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-navy-700 dark:text-navy-100">
          Schon registriert?{" "}
          <Link href="/login" className="text-teal-400 hover:underline">
            Anmelden
          </Link>
        </p>
      </Card>
    </main>
  );
}
