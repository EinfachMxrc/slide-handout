import { describe, expect, test } from "vitest";
import { initialRank, rankAfter, rankBefore, rankBetween } from "./lexorank";

/**
 * Tests use real ranks (produced by the functions themselves) rather than
 * hand-written strings, because the npm `lexorank` format is "0|xxxxxx:" and
 * arbitrary single chars are not valid. Order invariants are what actually
 * matter for the drag-and-drop use case.
 */

describe("lexorank", () => {
  describe("initialRank", () => {
    test("returns a non-empty string", () => {
      expect(initialRank().length).toBeGreaterThan(0);
    });

    test("is stable across calls", () => {
      expect(initialRank()).toBe(initialRank());
    });
  });

  describe("rankBetween", () => {
    test("returns a value lexicographically between prev and next", () => {
      const a = rankBefore(initialRank());
      const c = rankAfter(initialRank());
      const r = rankBetween(a, c);
      expect(r > a).toBe(true);
      expect(r < c).toBe(true);
    });

    test("treats null prev as MIN", () => {
      const next = initialRank();
      const r = rankBetween(null, next);
      expect(r < next).toBe(true);
    });

    test("treats null next as MAX", () => {
      const prev = initialRank();
      const r = rankBetween(prev, null);
      expect(r > prev).toBe(true);
    });

    test("multiple inserts between same bookends remain ordered", () => {
      let prev = rankBefore(initialRank());
      const next = rankAfter(initialRank());
      const ranks: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = rankBetween(prev, next);
        ranks.push(r);
        prev = r;
      }
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]! > ranks[i - 1]!).toBe(true);
      }
      expect(ranks[ranks.length - 1]! < next).toBe(true);
    });
  });

  describe("rankAfter / rankBefore", () => {
    test("rankAfter produces a rank greater than input", () => {
      const base = initialRank();
      expect(rankAfter(base) > base).toBe(true);
    });

    test("rankBefore produces a rank less than input", () => {
      const base = initialRank();
      expect(rankBefore(base) < base).toBe(true);
    });

    test("rankAfter(null) returns a non-empty string", () => {
      expect(rankAfter(null).length).toBeGreaterThan(0);
    });

    test("rankBefore(null) returns a non-empty string", () => {
      expect(rankBefore(null).length).toBeGreaterThan(0);
    });
  });

  describe("legacy rank fallback", () => {
    test("gracefully handles legacy single-char rank as prev", () => {
      // Old data had ranks like "i"; wrapper should not throw.
      const r = rankAfter("i");
      expect(r.length).toBeGreaterThan(0);
    });
  });
});
