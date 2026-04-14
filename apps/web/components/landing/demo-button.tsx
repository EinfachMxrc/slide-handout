"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Ein-Klick-Demo-Login: ruft `/api/auth/demo` auf (seedet falls nötig, logt
 * als `isDemo`-User ein) und navigiert ins Dashboard. Der Demo-User ist
 * serverseitig read-only (assertNotDemo blockt alle Schreib-Mutations auf
 * Handouts und Blöcken), kann aber Sessions starten und Reveals auslösen.
 */
export function DemoButton({
  className = "",
  label = "Demo ansehen",
}: {
  className?: string;
  label?: string;
}): React.ReactElement {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        setError("Konnte Demo nicht starten.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={startDemo} disabled={pending} className={className}>
        {pending ? "Demo wird vorbereitet …" : label}
      </button>
      {error && (
        <p className="mt-2 w-full text-center text-xs text-salmon-300">
          {error}
        </p>
      )}
    </>
  );
}
