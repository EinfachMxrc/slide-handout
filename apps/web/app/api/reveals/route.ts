import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";
import { checkRateLimit } from "#/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const rl = await checkRateLimit(`reveal:${userId}`, 120);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { presenterSessionId?: string; blockId?: string }
    | null;
  if (!body?.presenterSessionId || !body.blockId) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  try {
    await serverConvex().mutation(api.reveals.reveal, {
      userId,
      presenterSessionId: body.presenterSessionId as Id<"presenterSessions">,
      blockId: body.blockId as Id<"blocks">,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
