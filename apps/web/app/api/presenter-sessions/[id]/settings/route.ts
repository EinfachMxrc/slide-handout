import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | { syncMode?: "auto" | "hybrid" | "manual"; currentSlide?: number }
    | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    await serverConvex().mutation(api.sessions.updateSettings, {
      tokenHash,
      presenterSessionId: id as Id<"presenterSessions">,
      syncMode: body.syncMode,
      currentSlide: body.currentSlide,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
