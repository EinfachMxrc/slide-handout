import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id wrapper. OWASP-Empfehlung 2026:
 *   m=19456 KiB, t=2 iterations, p=1 parallelism.
 *
 * `@node-rs/argon2` defaultet bereits auf Argon2id — wir setzen nur die
 * Cost-Parameter explizit. (Algorithm-Enum entfernt, weil isolatedModules
 * + TS 6 keinen ambient-const-enum-Zugriff erlaubt.)
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  return await hash(plaintext, ARGON2_OPTIONS);
}

export async function verifyPassword(
  encoded: string,
  plaintext: string,
): Promise<boolean> {
  try {
    return await verify(encoded, plaintext);
  } catch {
    return false;
  }
}

/** SHA-256 hex of an arbitrary string — used for session-token-at-rest hashing. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** 32 random bytes as hex (64 chars) — the cookie-side session token. */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
