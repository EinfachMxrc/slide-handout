import { api } from "@convex/_generated/api";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

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

export const GET = defineRoute({
  name: "dashboard.sessions",
  run: async ({ userId }) => {
    const convex = serverConvex();
    const [sessions, handouts] = (await Promise.all([
      convex.query(api.sessions.listMine, { userId }),
      convex.query(api.handouts.listMine, { userId }),
    ])) as [PresenterSession[], Handout[]];
    const titles = new Map(handouts.map((h) => [h._id, h.title]));
    return sessions.map((s) => ({
      _id: s._id,
      handoutId: s.handoutId,
      handoutTitle: titles.get(s.handoutId) ?? "—",
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      audienceCount: s.audienceCount,
    }));
  },
});
