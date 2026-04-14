import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

interface Body {
  action: "all" | "none";
  presenterSessionId: string;
}

export async function POST(req: Request): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action || !body.presenterSessionId) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const convex = serverConvex();
  const id = body.presenterSessionId as Id<"presenterSessions">;
  try {
    if (body.action === "all") {
      await convex.mutation(api.reveals.revealAll, {
        tokenHash,
        presenterSessionId: id,
      });
    } else {
      await convex.mutation(api.reveals.hideAll, {
        tokenHash,
        presenterSessionId: id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
