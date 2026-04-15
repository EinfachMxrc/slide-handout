import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Config — E2E gegen lokalen Dev-Server.
 *
 * Annahme: Dev-Server läuft bereits auf Port 3000 (`pnpm dev:web`). Wir
 * starten ihn nicht via `webServer`, weil der Server Auth.js + Convex-Stub
 * braucht und die CI-Settings projektspezifisch sind. Lokal: erst Server
 * hochfahren, dann `pnpm test:e2e`.
 *
 * Tests, die echte DB-Mutations brauchen (Login, Handout-Create), werden
 * geskipped solange kein Convex läuft (siehe e2e/smoke.spec.ts).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
