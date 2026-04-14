import { api } from "@convex/_generated/api";
import { serverConvex } from "#/lib/auth/session";
import {
  bad,
  ok,
  preflight,
  unauthorized,
  verifyBearer,
} from "#/lib/addin/token";

export const runtime = "nodejs";

interface PresenterSessionRow {
  _id: string;
  handoutId: string;
  status: "live" | "ended";
  startedAt: number;
  endedAt?: number;
  currentSlide: number;
  audienceCount: number;
}

interface HandoutRow {
  _id: string;
  title: string;
}

export async function OPTIONS(): Promise<Response> {
  return preflight();
}

/**
 * Listet die Sessions des eingeloggten Users für den Add-in-Picker.
 * Bevorzugt: Live-Sessions zuerst, sortiert nach startedAt desc.
 */
export async function GET(req: Request): Promise<Response> {
  const userId = await verifyBearer(req);
  if (!userId) return unauthorized();

  const convex = serverConvex();
  const [sessions, handouts] = (await Promise.all([
    convex.query(api.sessions.listMine, { userId }),
    convex.query(api.handouts.listMine, { userId }),
  ])) as [PresenterSessionRow[], HandoutRow[]];

  const titles = new Map(handouts.map((h) => [h._id, h.title]));
  const shaped = sessions.map((s) => ({
    id: s._id,
    handoutId: s.handoutId,
    handoutTitle: titles.get(s.handoutId) ?? "—",
    status: s.status,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    currentSlide: s.currentSlide,
    audienceCount: s.audienceCount,
  }));

  // Sortieren: Live zuerst, dann nach startedAt desc.
  shaped.sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : 1;
    return b.startedAt - a.startedAt;
  });

  return ok({ sessions: shaped });
}
