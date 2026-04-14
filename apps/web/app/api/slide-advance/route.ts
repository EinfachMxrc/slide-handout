import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { checkRateLimit } from "#/lib/auth/rate-limit";

export const runtime = "nodejs";

/**
 * PowerPoint-Add-in Endpoint.
 *
 * Wird von Office-Add-in aus PowerPoint aufgerufen. Kein Cookie — Auth via
 * 6-stelligem Pairing-Code, den der Presenter im Dashboard eingibt.
 *
 * Zwei Verbs:
 *   POST (ohne sessionId) → bind(pairingCode) → gibt session_id zurück
 *   POST (mit sessionId)  → advance(pairingCode, sessionId, slideNumber)
 *
 * CORS offen, damit der Add-in aus dem Office-Sandbox-Origin posten kann.
 */
function corsHeaders(origin: string | null): Record<string, string> {
  // Office Add-ins laufen in einem eigenen Origin (z.B.
  // https://word-edit.officeapps.live.com). Wir erlauben alle — die
  // Authentifizierung läuft über den Pairing-Code, nicht Origin.
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "3600",
  };
}

export async function OPTIONS(req: Request): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

interface Body {
  action: "bind" | "advance";
  pairingCode: string;
  presenterSessionId?: string;
  slideNumber?: number;
}

export async function POST(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action || !body.pairingCode) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400, headers: cors });
  }

  // Rate-limit by pairing code — an attacker brute-forcing 6-digit codes
  // gets 10 attempts per minute per code they try.
  const rl = await checkRateLimit(`addin:${body.pairingCode}`, 30);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: cors });
  }

  const convex = serverConvex();

  if (body.action === "bind") {
    try {
      const result = await convex.mutation(api.sessions.bindByPairingCode, {
        pairingCode: body.pairingCode,
      });
      return NextResponse.json(result, { headers: cors });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      const status =
        msg.includes("INVALID_PAIRING_CODE")
          ? 400
          : msg.includes("NOT_FOUND")
            ? 404
            : 500;
      return NextResponse.json({ error: msg }, { status, headers: cors });
    }
  }

  if (body.action === "advance") {
    if (!body.presenterSessionId || typeof body.slideNumber !== "number") {
      return NextResponse.json(
        { error: "missing_advance_fields" },
        { status: 400, headers: cors },
      );
    }
    try {
      await convex.mutation(api.sessions.advanceSlideByPairing, {
        pairingCode: body.pairingCode,
        presenterSessionId: body.presenterSessionId as Id<"presenterSessions">,
        slideNumber: body.slideNumber,
      });
      return NextResponse.json({ ok: true }, { headers: cors });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      const status =
        msg.includes("MISMATCH") || msg.includes("NOT_LIVE") ? 403 : 500;
      return NextResponse.json({ error: msg }, { status, headers: cors });
    }
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400, headers: cors });
}
