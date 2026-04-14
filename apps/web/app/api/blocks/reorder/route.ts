import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";

export const runtime = "nodejs";

interface Body {
  id: string;
  prevRank: string | null;
  nextRank: string | null;
}

export async function POST(req: Request): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.id) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  try {
    await serverConvex().mutation(api.blocks.reorder, {
      userId,
      id: body.id as Id<"blocks">,
      prevRank: body.prevRank,
      nextRank: body.nextRank,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
