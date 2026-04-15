import * as Sentry from "@sentry/nextjs";
import { env } from "./env";

/**
 * Next.js Instrumentation Hook.
 *
 * Läuft einmalig beim Server-Start, getrennt pro Runtime (Node + Edge).
 * Wir nutzen ihn zur Sentry-Initialisierung auf Server-Seite.
 *
 * Client-Init passiert in `instrumentation-client.ts`.
 */
export function register(): void {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      // Sampling moderat — Prod sollte 0.1 oder tiefer.
      tracesSampleRate: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      // PII stays out unless explicitly scoped in.
      sendDefaultPii: false,
      enableLogs: true,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      tracesSampleRate: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      sendDefaultPii: false,
      enableLogs: true,
    });
  }
}

/**
 * React Server Component / Server Action error hook (Next 15+).
 * Muss exportiert werden, damit Sentry serverseitige Render-Errors sieht.
 */
export const onRequestError = Sentry.captureRequestError;
