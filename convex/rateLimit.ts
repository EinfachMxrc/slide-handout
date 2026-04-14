import { v } from "convex/values";
import { mutation } from "./_generated/server";

const WINDOW_MS = 60_000; // 1 minute

/**
 * Sliding-window-ish rate limiter. The Next.js auth routes call this BEFORE
 * doing any real work; if the count exceeds `limit`, they return 429.
 *
 * Atomic: reads-then-writes inside a single Convex mutation transaction.
 */
export const check = mutation({
  args: {
    key: v.string(), // e.g. "login:<ip>"
    limit: v.number(),
  },
  handler: async (ctx, { key, limit }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!existing || now - existing.windowStart > WINDOW_MS) {
      if (existing) {
        await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
      } else {
        await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
      }
      return { allowed: true, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }
    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: limit - existing.count - 1 };
  },
});
