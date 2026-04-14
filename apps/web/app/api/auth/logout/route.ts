import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import {
  serverConvex,
  clearSessionCookie,
  getTokenHashFromCookie,
} from "#/lib/auth/session";

export const runtime = "nodejs";

async function doLogout(): Promise<void> {
  const tokenHash = await getTokenHashFromCookie();
  if (tokenHash) {
    await serverConvex().mutation(api.auth.revokeSession, { tokenHash });
  }
  await clearSessionCookie();
}

/**
 * Logout supports two flows:
 *  - Classic <form method="POST"> (no JS) — we reply 303 → /, which makes
 *    the browser navigate to the landing page instead of rendering the JSON.
 *  - fetch() from JS — we detect Accept: application/json and return JSON so
 *    callers can handle it programmatically.
 */
export async function POST(req: Request): Promise<Response> {
  await doLogout();
  const wantsJson = (req.headers.get("accept") ?? "").includes(
    "application/json",
  );
  if (wantsJson) {
    return NextResponse.json({ ok: true });
  }
  // 303 = "see other" — force GET on the redirect target.
  // Use a RELATIVE Location so the client preserves its own host (the
  // container sees `req.url` as 0.0.0.0:3000, which would mis-redirect).
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/" },
  });
}

// Also accept GET/DELETE for convenience (e.g., link-based logout).
export async function GET(req: Request): Promise<Response> {
  return POST(req);
}
