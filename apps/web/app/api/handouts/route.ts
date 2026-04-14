import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { HandoutCreate } from "#/lib/zod/handout";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = HandoutCreate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  try {
    const id = await serverConvex().mutation(api.handouts.create, {
      tokenHash,
      title: parsed.data.title,
      description: parsed.data.description,
    });
    return NextResponse.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("UNAUTHENTICATED")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (msg.includes("DEMO_ACCOUNT_READ_ONLY")) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
