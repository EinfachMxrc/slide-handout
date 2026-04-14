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
    const stats = await serverConvex().query(api.handouts.dashboardStats, {
      tokenHash,
    });
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
