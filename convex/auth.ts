import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Auth-Funktionen für den PowerPoint-Add-in (einziger Rest der Convex-
 * seitigen Auth nach der Migration auf Auth.js für das Web-Frontend).
 *
 * Flow:
 *   1. User tippt Email+Passwort direkt im Taskpane ein
 *   2. Next.js verifiziert das Passwort (Argon2) und ruft `issueAddinToken`
 *      auf — wir speichern den SHA-256-Hash des Tokens
 *   3. Der Add-in erhält den Roh-Token einmalig, speichert ihn in
 *      localStorage und sendet ihn als Bearer-Header bei jedem Call
 *   4. Alle weiteren Add-in-Calls gehen über `verifyAddinToken` → userId
 */

const ADDIN_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

export const issueAddinToken = mutation({
  args: {
    userId: v.id("users"),
    tokenHash: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { userId, tokenHash, label }) => {
    const now = Date.now();
    return await ctx.db.insert("addinTokens", {
      userId,
      tokenHash,
      label,
      expiresAt: now + ADDIN_TOKEN_TTL_MS,
      createdAt: now,
      lastUsedAt: now,
    });
  },
});

export const verifyAddinToken = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const record = await ctx.db
      .query("addinTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!record) return null;
    if (record.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(record.userId);
    if (!user) return null;
    return {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isDemo: user.isDemo,
    };
  },
});

export const touchAddinToken = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const record = await ctx.db
      .query("addinTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (record) {
      await ctx.db.patch(record._id, { lastUsedAt: Date.now() });
    }
  },
});

export const revokeAddinToken = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const record = await ctx.db
      .query("addinTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (record) await ctx.db.delete(record._id);
  },
});
