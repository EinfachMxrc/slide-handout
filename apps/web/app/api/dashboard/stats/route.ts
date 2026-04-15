import { api } from "@convex/_generated/api";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

export const GET = defineRoute({
  name: "handouts.dashboardStats",
  run: async ({ userId }) =>
    serverConvex().query(api.handouts.dashboardStats, { userId }),
});
