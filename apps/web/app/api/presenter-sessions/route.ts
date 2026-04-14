import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { handoutId?: string }
    | null;
  if (!body?.handoutId) {
    return NextResponse.json({ error: "missing_handoutId" }, { status: 400 });
  }
  try {
    const id = await serverConvex().mutation(api.sessions.start, {
      userId,
      handoutId: body.handoutId as Id<"handouts">,
    });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
