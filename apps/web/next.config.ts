import type { NextConfig } from "next";

/**
 * Next.js 16.2 — VServer-Deployment via standalone-Output.
 *
 * - `output: "standalone"` schreibt einen minimalen Server inkl. nötiger
 *   `node_modules` nach `.next/standalone/`. Start: `node .../server.js`.
 * - `images.remotePatterns` strikt auf den konfigurierten S3-Host beschränkt.
 * - Turbopack ist in Next 16 default; wir aktivieren SRI für JS-Assets.
 */

const s3PublicHost = (() => {
  const url = process.env.S3_PUBLIC_BASE_URL;
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    sri: { algorithm: "sha256" },
  },
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

export default nextConfig;
