import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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
  const body = (await req.json().catch(() => null)) as
    | { handoutId?: string }
    | null;
  if (!body?.handoutId) {
    return NextResponse.json({ error: "missing_handoutId" }, { status: 400 });
  }
  try {
    const convex = serverConvex();
    const id = await convex.mutation(api.sessions.start, {
      tokenHash,
      handoutId: body.handoutId as Id<"handouts">,
    });
    // Read back the fresh session to forward the pairing code to the client.
    const session = await convex.query(api.sessions.getForOwner, {
      tokenHash,
      presenterSessionId: id,
    });
    return NextResponse.json({ id, pairingCode: session?.pairingCode ?? null });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
