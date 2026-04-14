import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function DELETE(req: Request): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { presenterSessionId?: string; blockId?: string }
    | null;
  if (!body?.presenterSessionId || !body.blockId) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  try {
    await serverConvex().mutation(api.reveals.unreveal, {
      tokenHash,
      presenterSessionId: body.presenterSessionId as Id<"presenterSessions">,
      blockId: body.blockId as Id<"blocks">,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
