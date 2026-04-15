"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Root-Error-Boundary für Next.js App Router.
 *
 * Wird gerendert, wenn Layout- oder Root-Provider crashen — also Fälle, die
 * `app/error.tsx` nicht mehr abfängt. Meldet den Fehler an Sentry und zeigt
 * einen minimalen Fallback.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1.5rem",
          maxWidth: "40rem",
          margin: "0 auto",
          color: "#111",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          Etwas ist schiefgelaufen.
        </h1>
        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          Ein unerwarteter Fehler ist aufgetreten. Wir wurden benachrichtigt
          und kümmern uns darum.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1rem",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Seite neu laden
        </button>
      </body>
    </html>
  );
}
