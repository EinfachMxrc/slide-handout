"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "#/components/ui/card";
import { Input, Textarea } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { HandoutCreate } from "#/lib/zod/handout";

type FormValues = HandoutCreate;

/**
 * All Convex writes go through Next.js API routes — those routes read the
 * session cookie, hash it, and pass `tokenHash` as a typed Convex arg. We
 * never expose the raw hash to the browser.
 */
export default function NewHandoutPage(): React.ReactElement {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(HandoutCreate),
    mode: "onTouched",
    defaultValues: { title: "", description: "" },
  });

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
    <Card className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold">Neues Handout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
            Titel
          </label>
          <Input
            maxLength={120}
            {...register("title")}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
            Beschreibung
          </label>
          <Textarea
            rows={4}
            maxLength={2000}
            {...register("description")}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Anlegen …" : "Handout anlegen"}
        </Button>
      </form>
    </Card>
  );
}
