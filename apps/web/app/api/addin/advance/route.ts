import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import {
  bad,
  ok,
  preflight,
  unauthorized,
  verifyBearer,
} from "#/lib/addin/token";

export const runtime = "nodejs";

export async function OPTIONS(): Promise<Response> {
  return preflight();
}

interface Body {
  presenterSessionId: string;
  slideNumber: number;
}

export async function POST(req: Request): Promise<Response> {
  const userId = await verifyBearer(req);
  if (!userId) return unauthorized();

  const body = (await req.json().catch(() => null)) as Body | null;
  if (
    !body?.presenterSessionId ||
    typeof body.slideNumber !== "number" ||
    body.slideNumber < 1
  ) {
    return bad("missing_or_invalid");
  }

  try {
    await serverConvex().mutation(api.sessions.advanceSlide, {
      userId,
      presenterSessionId: body.presenterSessionId as Id<"presenterSessions">,
      slideNumber: Math.floor(body.slideNumber),
    });
    return ok({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("FORBIDDEN")) return bad("forbidden", 403);
    if (msg.includes("SESSION_NOT_FOUND")) return bad("session_not_found", 404);
    return bad("server", 500);
  }
}
