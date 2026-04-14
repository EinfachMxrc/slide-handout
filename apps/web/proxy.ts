import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 PROXY (ex-`middleware.ts`).
 *
 * Läuft auf Node-Runtime. Aufgaben:
 *   1. Cookie-Existenz-Gate für geschützte Bereiche (kein DB-Lookup).
 *   2. Setzen strikter Security-Header inkl. CSP mit per-Request-Nonce.
 *
 * KEINE Auth-Lookups gegen Convex hier — der echte Session-Check passiert
 * in den RSC-Layouts via `getSession()` (lib/auth/session.ts).
 */

const SESSION_COOKIE = "sh_session";

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

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", // Tailwind v4 inline styles in dev/prod
    `img-src 'self' data: blob: https: ${s3Public}`,
    "font-src 'self' data:",
    `connect-src 'self' ${convexHttps} ${convexWs}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directives.join("; ");
}

const COMMON_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const nonce = generateNonce();

  // Forward nonce to the app so RSC can attach it to inline scripts.
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: reqHeaders } });

  // Security headers on every matched route.
  for (const [k, v] of Object.entries(COMMON_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", buildCsp(nonce));

  // Cookie existence-gate for the dashboard cluster.
  const isDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/handouts");
  if (isDashboard) {
    const hasCookie = req.cookies.has(SESSION_COOKIE);
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/handouts/:path*",
    "/api/auth/:path*",
    "/h/:path*",
  ],
};
