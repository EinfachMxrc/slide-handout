import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BlockCreate } from "#/lib/zod/block";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const handoutId = new URL(req.url).searchParams.get("handoutId");
  if (!handoutId) {
    return NextResponse.json({ error: "missing_handoutId" }, { status: 400 });
  }
  try {
    const blocks = await serverConvex().query(api.blocks.list, {
      userId,
      handoutId: handoutId as Id<"handouts">,
    });
    return NextResponse.json(blocks);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}

export async function POST(req: Request): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const handoutId =
    body && typeof body === "object" && "handoutId" in body
      ? ((body as { handoutId: string }).handoutId as Id<"handouts">)
      : null;
  if (!handoutId) {
    return NextResponse.json({ error: "missing_handoutId" }, { status: 400 });
  }
  const parsed = BlockCreate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  try {
    const id = await serverConvex().mutation(api.blocks.create, {
      userId,
      handoutId,
      ...parsed.data,
    });
    return NextResponse.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("DEMO_ACCOUNT_READ_ONLY")) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
