import pino from "pino";

/**
 * Server-side structured logger.
 *
 * Why no `pino-http`? That's Express middleware; Next.js App Router has no
 * per-request middleware hook for route handlers. We log from handlers directly
 * via `logApiError` / `log.info(...)` instead.
 *
 * Dev: pretty-printed, colorized. Prod: NDJSON — one line per event, ingestible
 * by any log shipper (Loki, Vector, Docker json-file driver).
 *
 * Client-safe? No. This file uses `pino-pretty` which is Node-only. Don't
 * import it from "use client" components. For client-side logging we rely on
 * Sentry (see `instrumentation-client.ts`).
 */
export const log = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { service: "slide-handout-web" },
  ...(process.env.NODE_ENV === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname,service",
          },
        },
      }),
});
