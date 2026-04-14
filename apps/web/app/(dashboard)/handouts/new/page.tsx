"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "#/components/ui/card";
import { Input, Textarea } from "#/components/ui/input";
import { Button } from "#/components/ui/button";

/**
 * All Convex writes go through Next.js API routes — those routes read the
 * session cookie, hash it, and pass `tokenHash` as a typed Convex arg. We
 * never expose the raw hash to the browser.
 */
export default function NewHandoutPage(): React.ReactElement {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/handouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        setError("Konnte nicht angelegt werden.");
        return;
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/handouts/${id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold">Neues Handout</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
            Titel
          </label>
          <Input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-400">
            Beschreibung
          </label>
          <Textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Anlegen …" : "Handout anlegen"}
        </Button>
      </form>
    </Card>
  );
}
