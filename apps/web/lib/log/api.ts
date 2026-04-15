import * as Sentry from "@sentry/nextjs";
import { log } from "./logger";

/**
 * Log + forward-to-Sentry helper for API-route catch blocks.
 *
 * Pattern:
 *   try { ... } catch (err) {
 *     logApiError("handouts.update", err, { handoutId: id });
 *     return NextResponse.json({ error: "server" }, { status: 500 });
 *   }
 *
 * Sentry still gets the exception (for alerting / stack traces). Pino gets
 * structured context (route, user, resource ids) for grep-friendly logs.
 */
export function logApiError(
  route: string,
  err: unknown,
  meta: Record<string, unknown> = {},
): void {
  const message = err instanceof Error ? err.message : String(err);
  log.error({ route, err: message, ...meta }, `api_error:${route}`);
  Sentry.captureException(err, { tags: { route }, extra: meta });
}
