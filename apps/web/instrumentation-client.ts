import * as Sentry from "@sentry/nextjs";
import { env } from "./env";

/**
 * Client-Side Sentry Init (Next 15.3+ pattern).
 *
 * Läuft im Browser vor dem ersten Render. Replay-Integration ist bewusst
 * ausgelassen — das Reader-UI enthält möglicherweise private Handout-Inhalte.
 */
if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    tracesSampleRate: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    enableLogs: true,
  });
}

/**
 * Hook für Next.js Client-Side Navigation Instrumentation.
 * Wird von @sentry/nextjs erwartet, um Navigation-Spans zu erzeugen.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
