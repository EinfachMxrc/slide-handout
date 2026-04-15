import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest-Config — Unit-Tests für reine TS-Module (lib/, convex/utils).
 * E2E-Tests laufen separat über Playwright (siehe playwright.config.ts).
 *
 * Pfad-Aliase spiegeln `apps/web/tsconfig.json`, damit `import "#/lib/..."`
 * in Tests ohne weitere Konfiguration funktioniert.
 */
export default defineConfig({
  resolve: {
    alias: {
      "#": path.join(root, "apps/web"),
      "@convex": path.join(root, "convex"),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: ["{apps/web,convex}/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/_generated/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/web/lib/**/*.ts", "convex/lexorank.ts"],
      exclude: [
        "**/_generated/**",
        "**/*.test.ts",
        "**/*.d.ts",
      ],
    },
  },
});
