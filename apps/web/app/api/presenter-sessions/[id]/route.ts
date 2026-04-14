import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await serverConvex().mutation(api.sessions.end, {
      tokenHash,
      presenterSessionId: id as Id<"presenterSessions">,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

/** Slide advance — used by the future PowerPoint Add-in. */
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
    | { slideNumber?: number }
    | null;
  if (typeof body?.slideNumber !== "number") {
    return NextResponse.json({ error: "missing_slideNumber" }, { status: 400 });
  }
  try {
    await serverConvex().mutation(api.sessions.advanceSlide, {
      tokenHash,
      presenterSessionId: id as Id<"presenterSessions">,
      slideNumber: body.slideNumber,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
