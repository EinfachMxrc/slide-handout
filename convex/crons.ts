import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const SESSION_AUTO_END_MS = 12 * 60 * 60 * 1000; // 12 hours
const EXPIRED_AUTH_GRACE_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_GC_MS = 10 * 60 * 1000;

export const sweepStaleSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. End presenter sessions that have been live for too long.
    const live = await ctx.db
      .query("presenterSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();
    for (const s of live) {
      if (now - s.startedAt > SESSION_AUTO_END_MS) {
        await ctx.db.patch(s._id, { status: "ended", endedAt: now });
      }
    }

    // 2. Delete expired add-in tokens (with a grace period).
    //    Auth.js-Web-Sessions laufen als JWT im Cookie — kein GC nötig.
    const tokens = await ctx.db.query("addinTokens").collect();
    for (const t of tokens) {
      if (t.expiresAt + EXPIRED_AUTH_GRACE_MS < now) {
        await ctx.db.delete(t._id);
      }
    }

    // 3. GC rate-limit windows.
    const buckets = await ctx.db.query("rateLimits").collect();
    for (const r of buckets) {
      if (now - r.windowStart > RATE_LIMIT_GC_MS) {
        await ctx.db.delete(r._id);
      }
    }

    // 4. GC stale audience heartbeats (anything older than 5 min).
    const heartbeats = await ctx.db.query("audienceHeartbeats").collect();
    for (const h of heartbeats) {
      if (now - h.lastSeenAt > 5 * 60_000) {
        await ctx.db.delete(h._id);
      }
    }
  },
});

const crons = cronJobs();
crons.interval(
  "sweep stale sessions",
  { minutes: 15 },
  internal.crons.sweepStaleSessions,
);
export default crons;
