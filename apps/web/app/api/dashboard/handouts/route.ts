import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const handouts = await serverConvex().query(api.handouts.listMine, {
      tokenHash,
    });
    return NextResponse.json(handouts);
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
