import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import {
  serverConvex,
  getUserId,
} from "#/lib/auth/session";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const stats = await serverConvex().query(api.handouts.dashboardStats, {
      userId,
    });
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
