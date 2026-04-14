import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { sha256Hex, generateSessionToken } from "#/lib/auth/hash";
import { serverConvex } from "#/lib/auth/session";

/**
 * Gemeinsame Helpers für die `/api/addin/*`-Routen.
 *
 * Das Add-in läuft im Office-Sandbox-Origin. Der Add-in hält ein
 * lang laufendes Bearer-Token (30 d TTL), gespeichert in localStorage.
 * Wir speichern serverseitig nur den SHA-256-Hash.
 */

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Max-Age": "3600",
};

export function corsHeaders(): Record<string, string> {
  return CORS;
}

export function preflight(): Response {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function unauthorized(): Response {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: CORS },
  );
}

export function bad(reason: string, status = 400): Response {
  return NextResponse.json(
    { error: reason },
    { status, headers: CORS },
  );
}

export function ok<T>(data: T): Response {
  return NextResponse.json(data, { headers: CORS });
}

/** Liest Bearer-Token aus dem Authorization-Header und liefert die userId. */
export async function verifyBearer(req: Request): Promise<Id<"users"> | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (!match) return null;
  const rawToken = match[1]!;
  const tokenHash = await sha256Hex(rawToken);
  const session = await serverConvex().query(api.auth.verifyAddinToken, {
    tokenHash,
  });
  if (!session) return null;
  // Fire-and-forget: update lastUsedAt.
  void serverConvex()
    .mutation(api.auth.touchAddinToken, { tokenHash })
    .catch(() => {});
  return session.userId as Id<"users">;
}

/** Neuer Roh-Token + Hash-Paar. */
export async function mintToken(): Promise<{ raw: string; hash: string }> {
  const raw = generateSessionToken();
  const hash = await sha256Hex(raw);
  return { raw, hash };
}
