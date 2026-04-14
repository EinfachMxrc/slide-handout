import { ConvexHttpClient } from "convex/browser";
import type { Id } from "@convex/_generated/dataModel";
import { auth } from "#/auth";

let _client: ConvexHttpClient | null = null;

/**
 * Server-side Convex client. Initialized lazily, wiederverwendet über Lebenszeit
 * des Next-Prozesses.
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
  userId: Id<"users">;
  email: string;
  displayName?: string;
  isDemo: boolean;
}

/**
 * Liest die Auth.js-Session aus dem Cookie. `null` wenn nicht eingeloggt
 * oder JWT ungültig / abgelaufen.
 */
export async function getSession(): Promise<SessionInfo | null> {
  const s = await auth();
  const user = s?.user as
    | { id?: string; email?: string; displayName?: string; isDemo?: boolean }
    | undefined;
  if (!user?.id) return null;
  return {
    userId: user.id as Id<"users">,
    email: user.email ?? "",
    displayName: user.displayName,
    isDemo: Boolean(user.isDemo),
  };
}

/**
 * Kurzform: nur die userId. Convenience für API-Routes, die nur den
 * User-ID brauchen, um Convex aufzurufen.
 */
export async function getUserId(): Promise<Id<"users"> | null> {
  const s = await getSession();
  return s?.userId ?? null;
}
