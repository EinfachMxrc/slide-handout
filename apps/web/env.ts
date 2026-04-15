import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Zentrale, typisierte Env-Validierung.
 *
 * Wird beim Import validiert (Startup-Check + Build-Time). Missing/ungültige
 * Werte => Crash mit klarer Fehlermeldung, statt silent undefined zur
 * Laufzeit. Ersetzt alle `process.env.*`-Zugriffe in der Web-App.
 *
 * Convex-runtime env vars (z.B. S3_* in `convex/storage.ts`) laufen NICHT
 * durch dieses File — die werden vom Convex-Dashboard verwaltet.
 */
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be >=32 chars (openssl rand -base64 32)"),
    CONVEX_DEPLOY_KEY: z.string().optional(),
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    DEMO_EMAIL: z.string().email().default("demo@slide-handout.app"),
    DEMO_PASSWORD: z.string().min(8).default("slide-handout-demo-2026"),
    // Sentry — nur für Source-Map-Upload beim Build. DSN ist public.
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_S3_PUBLIC_BASE_URL: z.string().url().optional(),
    // Sentry DSN. Leer => Sentry deaktiviert (z.B. lokal / Dev).
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().default("development"),
    // Sentry Security-Header-Report-URI (CSP-Violations). Leer => kein CSP-Reporting.
    NEXT_PUBLIC_SENTRY_CSP_REPORT_URI: z.string().url().optional(),
  },
  /**
   * Next.js bündelt nur das, was als Literal referenziert wird — deshalb
   * müssen wir die `NEXT_PUBLIC_*`-Vars hier explizit durchreichen.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY,
    S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
    DEMO_EMAIL: process.env.DEMO_EMAIL,
    DEMO_PASSWORD: process.env.DEMO_PASSWORD,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_S3_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_CSP_REPORT_URI: process.env.NEXT_PUBLIC_SENTRY_CSP_REPORT_URI,
  },
  /**
   * Skip validation in Docker-build step (env vars kommen zur Runtime).
   * `SKIP_ENV_VALIDATION=1 next build` ist der Escape-Hatch.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
