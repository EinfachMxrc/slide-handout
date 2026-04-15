import { test, expect } from "@playwright/test";

/**
 * Smoke-Tests gegen den Dev-Server. Decken die HTML-Render-Pfade ab, die
 * KEIN Convex-Backend brauchen (Landing, Login-Page, Static-Routes).
 *
 * Tests die echtes Backend brauchen → eigene Spec sobald Convex-Test-Setup
 * existiert (geseededer Test-User, isolierter Convex-Deployment).
 */

test.describe("smoke (no backend required)", () => {
  test("login page renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anmelden" }),
    ).toBeEnabled();
  });

  test("login page links to register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.getByRole("link", { name: "Registrieren" });
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("powerpoint-addin landing serves static html", async ({ page }) => {
    const res = await page.goto("/powerpoint-addin");
    expect(res?.status()).toBe(200);
  });

  test("dashboard requires auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
