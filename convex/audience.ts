import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PRESENCE_WINDOW_MS = 45_000;

/**
 * Reader pings jede ~20s. Upsert der Row. Kein Auth — public, rate-limited
 * via Clientid (so kann ein bösartiger Client nicht beliebig Rows anlegen).
 */
export const heartbeat = mutation({
  args: {
    presenterSessionId: v.id("presenterSessions"),
    clientId: v.string(),
  },
  handler: async (ctx, { presenterSessionId, clientId }) => {
    // Must be a live session.
    const session = await ctx.db.get(presenterSessionId);
    if (!session || session.status !== "live") return { ok: false };

    const existing = await ctx.db
      .query("audienceHeartbeats")
      .withIndex("by_session_client", (q) =>
        q
          .eq("presenterSessionId", presenterSessionId)
          .eq("clientId", clientId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
    } else {
      await ctx.db.insert("audienceHeartbeats", {
        presenterSessionId,
        clientId,
        lastSeenAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

/** Presenter-seitig: Live-Subscription auf die Zahl aktiver Hörer. */
export const countForSession = query({
  args: { presenterSessionId: v.id("presenterSessions") },
  handler: async (ctx, { presenterSessionId }) => {
    const cutoff = Date.now() - PRESENCE_WINDOW_MS;
    const rows = await ctx.db
      .query("audienceHeartbeats")
      .withIndex("by_session_lastSeenAt", (q) =>
        q.eq("presenterSessionId", presenterSessionId).gt("lastSeenAt", cutoff),
      )
      .collect();
    return rows.length;
  },
});
