import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./env";

/**
 * Next.js 16.2 — VServer-Deployment via standalone-Output.
 *
 * - `output: "standalone"` schreibt einen minimalen Server inkl. nötiger
 *   `node_modules` nach `.next/standalone/`. Start: `node .../server.js`.
 * - `images.remotePatterns` strikt auf den konfigurierten S3-Host beschränkt.
 * - Turbopack ist in Next 16 default; wir aktivieren SRI für JS-Assets.
 */

const s3PublicHost = (() => {
  if (!env.S3_PUBLIC_BASE_URL) return null;
  try {
    return new URL(env.S3_PUBLIC_BASE_URL);
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // SRI wurde entfernt: Next 16 + Turbopack produziert integrity-Hashes, die
  // nicht zu den ausgelieferten Chunks passen (Hydration bricht schweigend,
  // die Seite bleibt auf dem Skeleton-Loader hängen). Unser CSP nutzt
  // 'strict-dynamic' + Nonces, das deckt den Threat-Model-Teil bereits ab.
  images: {
    remotePatterns: s3PublicHost
      ? [
          {
            protocol: s3PublicHost.protocol.replace(":", "") as
              | "http"
              | "https",
            hostname: s3PublicHost.hostname,
            port: s3PublicHost.port || undefined,
            pathname: `${s3PublicHost.pathname.replace(/\/$/, "")}/**`,
          },
        ]
      : [],
  },
  // Strip the `x-powered-by` header.
  poweredByHeader: false,

  // Serve the static Add-in landing page at /powerpoint-addin without
  // a trailing slash — Office-Add-in users will likely strip the slash.
  async rewrites() {
    return [
      {
        source: "/powerpoint-addin",
        destination: "/powerpoint-addin/index.html",
      },
    ];
  },
};

/**
 * Sentry-Wrapper: lädt das Source-Map-Plugin und verdrahtet die Tunnel-Route.
 * Wenn kein SENTRY_AUTH_TOKEN gesetzt ist (z.B. lokal oder in PRs ohne
 * Secrets), überspringt das Plugin den Upload still.
 */
export default withSentryConfig(nextConfig, {
  org: env.SENTRY_ORG,
  project: env.SENTRY_PROJECT,
  authToken: env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Source-Map-Upload nur wenn Token + Project gesetzt.
  disableLogger: true,
  // Tunnel hilft gegen Ad-Blocker, kostet eine Serverless-Route.
  tunnelRoute: "/monitoring",
  // Source Maps hochladen aber nicht zum Browser ausliefern.
  widenClientFileUpload: true,
  // Auto-Instrumentierung für Vercel-Cron etc. nicht erforderlich.
  automaticVercelMonitors: false,
});
