import { cookies, headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { sha256Hex } from "#/lib/auth/hash";

export const SESSION_COOKIE = "sh_session";
const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

let _client: ConvexHttpClient | null = null;

/**
 * Server-side Convex client. Reads a single env var.
 * Lazily initialized so build doesn't fail if the env is unset at import time.
 */
export function serverConvex(): ConvexHttpClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
    _client = new ConvexHttpClient(url);
  }
  return _client;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string;
  isDemo: boolean;
  expiresAt: number;
}

/**
 * Reads the cookie, hashes it, asks Convex for the matching session.
 * Returns `null` if missing/invalid/expired.
 *
 * Use this in RSCs and Route Handlers — NOT in the proxy (no DB calls there).
 */
export async function getSession(): Promise<SessionInfo | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const session = await serverConvex().query(api.auth.sessionByHash, {
    tokenHash,
  });
  return session as SessionInfo | null;
}

export async function getTokenHashFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await sha256Hex(token);
}

/**
 * Set the session cookie on a freshly-issued session token.
 * Must be called from a Server Action or Route Handler.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Best-effort client IP from upstream proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function getUserAgent(): Promise<string | undefined> {
  const h = await headers();
  return h.get("user-agent") ?? undefined;
}
