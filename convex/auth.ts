import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * AUTH session storage.
 *
 * The cookie token is generated and SHA-256-hashed in the Next.js API route.
 * Convex only ever sees the hash. Lookup by hash → user.
 */

export const sessionByHash = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user) return null;
    return {
      sessionId: session._id,
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isDemo: user.isDemo,
      expiresAt: session.expiresAt,
    };
  },
});

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    tokenHash: v.string(),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      tokenHash: args.tokenHash,
      expiresAt: now + SESSION_TTL_MS,
      userAgent: args.userAgent,
      ip: args.ip,
      createdAt: now,
    });
  },
});

/** Invalidate by hash. Idempotent — does nothing if session unknown. */
export const revokeSession = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const revokeAllForUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(sessions.map((s) => ctx.db.delete(s._id)));
  },
});
