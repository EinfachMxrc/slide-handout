import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const newId = await serverConvex().mutation(api.blocks.duplicate, {
      userId,
      id: id as Id<"blocks">,
    });
    return NextResponse.json({ id: newId });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
