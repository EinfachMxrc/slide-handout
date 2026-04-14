import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Seit der Migration auf Auth.js reicht der Next.js-Server die vom JWT
 * verifizierte `userId` direkt als Convex-Arg durch. Convex muss keinen
 * Cookie-Token mehr auflösen.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null | undefined,
): Promise<Doc<"users">> {
  if (!userId) throw new Error("UNAUTHENTICATED");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function getUserOpt(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null | undefined,
): Promise<Doc<"users"> | null> {
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export function assertNotDemo(user: Doc<"users">): void {
  if (user.isDemo) throw new Error("DEMO_ACCOUNT_READ_ONLY");
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
