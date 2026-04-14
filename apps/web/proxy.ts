import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Next.js 16 Proxy (ex-middleware).
 *
 * Zwei Aufgaben:
 *  1. Auth-Gate für geschützte Routen — via Auth.js `authorized`-Callback
 *     aus `auth.config.ts`. Keine DB-Lookups hier, nur JWT-Verify.
 *  2. Security-Header inkl. CSP mit per-Request-Nonce.
 *
 * Wir nutzen den Edge-safen `authConfig` (ohne Credentials-Provider) —
 * das vollständige Auth.js-Binding ist in `auth.ts` und nur in den
 * Node-Runtime-Routen aktiv.
 */
const { auth } = NextAuth(authConfig);

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function buildCsp(nonce: string): string {
  const convexHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_CONVEX_URL ?? "").host;
    } catch {
      return "";
    }
  })();
  const convexWs = convexHost ? `wss://${convexHost}` : "";
  const convexHttps = convexHost ? `https://${convexHost}` : "";
  const s3Public = process.env.S3_PUBLIC_BASE_URL ?? "";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${s3Public}`,
    "font-src 'self' data:",
    `connect-src 'self' ${convexHttps} ${convexWs}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

const COMMON_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
};

export default auth((req) => {
  // `auth()` hat den Redirect für geschützte Routen bereits behandelt, falls
  // der User nicht eingeloggt ist (siehe `authorized` in auth.config.ts).
  // Wir ergänzen nur Security-Header und den CSP-Nonce.
  const nonce = generateNonce();
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  for (const [k, v] of Object.entries(COMMON_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/handouts/:path*",
    "/api/auth/:path*",
    "/api/addin/:path*",
    "/h/:path*",
  ],
};
