/**
 * In-Memory Rate-Limiter (Single-Instance VServer-Deploy).
 *
 * Fixed-Window Counter mit 1-Min-Fenster. Reicht für unsere Last (Auth-Routen
 * + Reveals) und vermeidet den vorherigen Convex-Mutation-Roundtrip pro Check.
 *
 * Achtung: funktioniert nur korrekt bei genau EINEM Node-Prozess. Wer
 * irgendwann auf >1 Instanz / Vercel / Cloudflare geht, muss hier auf einen
 * shared Store (Redis o.ä.) wechseln — sonst leakt das Limit pro Node.
 */

type Decision = { allowed: boolean; remaining: number };

const WINDOW_MS = 60_000;

const buckets = new Map<string, { windowStart: number; count: number }>();

// Periodischer GC, damit verwaiste Keys (IPs die nie wiederkommen) nicht
// für immer im Speicher hängen. Lazy-Init: erst beim ersten Aufruf.
let gcStarted = false;
function startGc(): void {
  if (gcStarted) return;
  gcStarted = true;
  // unref() => verhindert dass das Interval den Prozess am Leben hält.
  setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [k, b] of buckets) {
      if (b.windowStart < cutoff) buckets.delete(k);
    }
  }, 5 * 60_000).unref();
}

export async function checkRateLimit(
  key: string,
  limit = 10,
): Promise<Decision> {
  startGc();
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }
  if (b.count >= limit) return { allowed: false, remaining: 0 };
  b.count += 1;
  return { allowed: true, remaining: limit - b.count };
}
