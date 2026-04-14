/**
 * Minimal LexoRank implementation — fractional ordering for drag-and-drop.
 *
 * Ranks are base-36 strings using digits/lowercase letters. Lexicographic
 * comparison matches the desired order. Inserting between two ranks produces
 * a new string by midpointing the digit sequences. Append-only "between"
 * operations never need rebalancing.
 *
 * Initial bookends: MIN = "0", MAX = "z" (we use "1".."y" as the working range
 * and reserve outer space for safe extension on either side).
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;
const MIN_CHAR = ALPHABET[1]; // "1"
const MAX_CHAR = ALPHABET[BASE - 2]; // "y"

function charIndex(ch: string): number {
  const i = ALPHABET.indexOf(ch);
  if (i < 0) throw new Error(`Invalid LexoRank char: ${ch}`);
  return i;
}

/** Pick a rank lexicographically between `prev` and `next`. */
export function rankBetween(
  prev: string | null,
  next: string | null,
): string {
  const p = prev ?? "";
  const n = next ?? "";
  let i = 0;
  let result = "";
  while (true) {
    const pc = i < p.length ? charIndex(p[i]!) : 0;
    const nc = i < n.length ? charIndex(n[i]!) : BASE - 1;
    if (pc === nc) {
      result += p[i] ?? n[i] ?? MIN_CHAR;
      i++;
      continue;
    }
    const mid = Math.floor((pc + nc) / 2);
    if (mid > pc) {
      result += ALPHABET[mid];
      return result;
    }
    // Difference is 1 — descend by emitting prev's char and continuing.
    result += ALPHABET[pc];
    i++;
    // Need to find midpoint of pc+1..MAX (n is "later" so we go above pc).
    // Loop continues; eventually we either find space or append a digit beyond p.
    if (i >= p.length && i >= n.length) {
      result += ALPHABET[Math.floor(BASE / 2)];
      return result;
    }
  }
}

export function initialRank(): string {
  return ALPHABET[Math.floor(BASE / 2)]!; // "i"
}

export function rankAfter(prev: string | null): string {
  return rankBetween(prev, null);
}

export function rankBefore(next: string | null): string {
  return rankBetween(null, next);
}

export const LEXORANK_MIN_CHAR = MIN_CHAR;
export const LEXORANK_MAX_CHAR = MAX_CHAR;
