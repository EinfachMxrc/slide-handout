import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getUserId } from "#/lib/auth/session";
import type { Id } from "@convex/_generated/dataModel";
import { logApiError } from "#/lib/log/api";
import { checkRateLimit } from "#/lib/auth/rate-limit";

/**
 * Thin Next.js App Router wrapper that eats the boilerplate every
 * Convex-proxy route was repeating:
 *
 *   1. Load session → 401 if missing
 *   2. Parse JSON → 400 on invalid
 *   3. Zod-validate body → 400 on schema error
 *   4. Run the handler in a try/catch → log + 500 on throw
 *
 * Handlers stay focused on the one thing that varies: the Convex call and
 * the shape of the response.
 *
 * This is an interim step before the full P6 refactor (client-direct Convex
 * with NextAuth identity). Once the latter lands, these routes go away.
 */

type RouteContext<P> = {
  userId: Id<"users">;
  params: P;
  req: Request;
};

interface DefineRouteOpts<P, B> {
  /** Stable name for logs / Sentry tag. */
  name: string;
  /** Optional Zod schema for the JSON body. Omit for GET/DELETE without body. */
  body?: ZodType<B>;
  /**
   * Optional per-user rate limit. Key is prefixed with the authenticated
   * userId so each user has their own bucket.
   */
  rateLimit?: { key: string; limit: number };
  /**
   * Optional hook to map thrown errors (typically Convex error messages
   * tunneled as strings like "DEMO_ACCOUNT_READ_ONLY") onto specific
   * responses. Return `null` to fall through to the generic 500 logger.
   */
  errorMap?: (err: unknown) => Response | null;
  /** Handler that returns the response payload (will be JSON-serialized). */
  run: (ctx: RouteContext<P> & { body: B }) => Promise<unknown>;
}

export function defineRoute<P = Record<string, string>, B = undefined>(
  opts: DefineRouteOpts<P, B>,
): (
  req: Request,
  ctx: { params: Promise<P> },
) => Promise<Response> {
  return async (req, ctx) => {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401 },
      );
    }
    const params = (await ctx.params) as P;

    if (opts.rateLimit) {
      const rl = await checkRateLimit(
        `${opts.rateLimit.key}:${userId}`,
        opts.rateLimit.limit,
      );
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "rate_limited" },
          { status: 429 },
        );
      }
    }

    let body: B = undefined as B;
    if (opts.body) {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        return NextResponse.json(
          { error: "invalid_json" },
          { status: 400 },
        );
      }
      const parsed = opts.body.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      body = parsed.data as B;
    }

    try {
      const result = await opts.run({ userId, params, req, body });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (opts.errorMap) {
        const mapped = opts.errorMap(err);
        if (mapped) return mapped;
      }
      logApiError(opts.name, err, { userId });
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
  };
}
