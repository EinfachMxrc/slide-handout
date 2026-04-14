import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Resolves the calling user from a session-token-hash header.
 *
 * Convex itself has no built-in cookie reader — Next.js sends the SHA-256 hash
 * of the cookie token via the typed function arg `tokenHash`. We never accept
 * the raw token over the wire from the client.
 */
export async function getUserByTokenHash(
  ctx: QueryCtx | MutationCtx,
  tokenHash: string | null | undefined,
): Promise<Doc<"users"> | null> {
  if (!tokenHash) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  tokenHash: string | null | undefined,
): Promise<Doc<"users">> {
  const user = await getUserByTokenHash(ctx, tokenHash);
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function assertNotDemo(user: Doc<"users">): void {
  if (user.isDemo) {
    throw new Error("DEMO_ACCOUNT_READ_ONLY");
  }
}

export async function assertHandoutOwner(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  handoutId: Id<"handouts">,
): Promise<Doc<"handouts">> {
  const handout = await ctx.db.get(handoutId);
  if (!handout) throw new Error("HANDOUT_NOT_FOUND");
  if (handout.ownerId !== user._id) throw new Error("FORBIDDEN");
  return handout;
}
