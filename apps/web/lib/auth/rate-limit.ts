import { serverConvex } from "#/lib/auth/session";
import { api } from "@convex/_generated/api";

/**
 * Wrapper über die Convex-rateLimits-Mutation. 10 req/min/key ist Default
 * für die Auth-Routen.
 */
export async function checkRateLimit(
  key: string,
  limit = 10,
): Promise<{ allowed: boolean; remaining: number }> {
  return await serverConvex().mutation(api.rateLimit.check, { key, limit });
}
