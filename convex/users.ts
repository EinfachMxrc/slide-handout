import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getUserByTokenHash } from "./_lib/authHelpers";

/**
 * USER lifecycle.
 *
 * Note: password hashing happens in Next.js Node-runtime, not here.
 * `createUser` only stores the already-hashed value sent by the API route,
 * which is itself authenticated against the calling deployment via Convex's
 * built-in admin key (used by ConvexHttpClient on the server).
 */

export const me = query({
  args: { tokenHash: v.union(v.string(), v.null()) },
  handler: async (ctx, { tokenHash }) => {
    const user = await getUserByTokenHash(ctx, tokenHash);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isDemo: user.isDemo,
    };
  },
});

export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { email, passwordHash, displayName }) => {
    const normalized = email.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (existing) throw new Error("EMAIL_ALREADY_REGISTERED");

    return await ctx.db.insert("users", {
      email: normalized,
      passwordHash,
      displayName,
      isDemo: false,
      createdAt: Date.now(),
    });
  },
});

export const seedDemoUser = internalMutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, { email, passwordHash }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("users", {
      email,
      passwordHash,
      displayName: "Demo User",
      isDemo: true,
      createdAt: Date.now(),
    });
  },
});
