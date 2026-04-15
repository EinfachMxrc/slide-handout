import { describe, expect, test, beforeEach, vi, afterEach } from "vitest";

/**
 * Tests use vi.useFakeTimers, weil das Modul interne `Date.now()`-Aufrufe
 * macht und ein 1-Min-Fenster benutzt. Wir importieren das Modul frisch in
 * jedem Test, damit die in-memory Map gecleared ist.
 */
async function freshLimiter(): Promise<typeof import("./rate-limit")> {
  // vi.resetModules() invalidiert den ESM-Cache → Map wird neu initialisiert.
  vi.resetModules();
  return import("./rate-limit");
}

describe("rate-limit (in-memory)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("first call is allowed and returns limit-1 remaining", async () => {
    const { checkRateLimit } = await freshLimiter();
    const r = await checkRateLimit("ip:1", 5);
    expect(r).toEqual({ allowed: true, remaining: 4 });
  });

  test("blocks after limit reached within window", async () => {
    const { checkRateLimit } = await freshLimiter();
    for (let i = 0; i < 5; i++) await checkRateLimit("ip:2", 5);
    const blocked = await checkRateLimit("ip:2", 5);
    expect(blocked).toEqual({ allowed: false, remaining: 0 });
  });

  test("resets after window expires", async () => {
    const { checkRateLimit } = await freshLimiter();
    for (let i = 0; i < 5; i++) await checkRateLimit("ip:3", 5);
    expect((await checkRateLimit("ip:3", 5)).allowed).toBe(false);

    // Advance past the 1-min window.
    vi.setSystemTime(new Date("2026-04-15T12:01:01Z"));
    const r = await checkRateLimit("ip:3", 5);
    expect(r).toEqual({ allowed: true, remaining: 4 });
  });

  test("different keys have independent buckets", async () => {
    const { checkRateLimit } = await freshLimiter();
    for (let i = 0; i < 5; i++) await checkRateLimit("ip:a", 5);
    const blocked = await checkRateLimit("ip:a", 5);
    const fresh = await checkRateLimit("ip:b", 5);
    expect(blocked.allowed).toBe(false);
    expect(fresh.allowed).toBe(true);
  });
});
