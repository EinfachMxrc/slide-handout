import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import {
  serverConvex,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

interface PresenterSession {
  _id: string;
  handoutId: string;
  status: "live" | "ended";
  startedAt: number;
  endedAt?: number;
  audienceCount: number;
}

interface Handout {
  _id: string;
  title: string;
}

export async function GET(): Promise<Response> {
  const tokenHash = await getTokenHashFromCookie();
  if (!tokenHash) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const convex = serverConvex();
    const [sessions, handouts] = (await Promise.all([
      convex.query(api.sessions.listMine, { tokenHash }),
      convex.query(api.handouts.listMine, { tokenHash }),
    ])) as [PresenterSession[], Handout[]];
    const titles = new Map(handouts.map((h) => [h._id, h.title]));
    return NextResponse.json(
      sessions.map((s) => ({
        _id: s._id,
        handoutId: s.handoutId,
        handoutTitle: titles.get(s.handoutId) ?? "—",
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        audienceCount: s.audienceCount,
      })),
    );
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
