/**
 * LexoRank wrapper — fractional ordering for drag-and-drop.
 *
 * Delegates to the `lexorank` npm package (JIRA-style reference impl) but
 * exposes the same `rankBetween` / `rankAfter` / `rankBefore` / `initialRank`
 * API the rest of the code was using. The package handles the tricky
 * midpoint / bucket / rebalance edge cases we previously hand-rolled.
 *
 * Rank strings now look like "0|hzzzzz:" (bucket + base-36 decimal). These
 * sort lexicographically — same contract as before. Old 1-char ranks
 * ("i", "k") from earlier builds need migration: see `migrateRanks` in
 * `convex/blocks.ts`.
 */
import { LexoRank } from "lexorank";

function parseOrMin(s: string | null): LexoRank {
  if (!s) return LexoRank.min();
  try {
    return LexoRank.parse(s);
  } catch {
    // Legacy single-char rank ("i"); replace with a middle bucket value.
    return LexoRank.middle();
  }
}

function parseOrMax(s: string | null): LexoRank {
  if (!s) return LexoRank.max();
  try {
    return LexoRank.parse(s);
  } catch {
    return LexoRank.middle();
  }
}

/** Pick a rank lexicographically between `prev` and `next`. */
export function rankBetween(
  prev: string | null,
  next: string | null,
): string {
  const left = parseOrMin(prev);
  const right = parseOrMax(next);
  return left.between(right).toString();
}

export function initialRank(): string {
  return LexoRank.middle().toString();
}

export function rankAfter(prev: string | null): string {
  if (!prev) return initialRank();
  try {
    return LexoRank.parse(prev).genNext().toString();
  } catch {
    return initialRank();
  }
}

export function rankBefore(next: string | null): string {
  if (!next) return initialRank();
  try {
    return LexoRank.parse(next).genPrev().toString();
  } catch {
    return initialRank();
  }
}

// Kept for backwards-compat with tests/importers that inspect bounds.
// LexoRank's min/max are "0|000000:" and "0|zzzzzz:" respectively.
export const LEXORANK_MIN_CHAR = "0";
export const LEXORANK_MAX_CHAR = "z";
