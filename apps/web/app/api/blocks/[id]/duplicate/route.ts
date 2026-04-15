import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

type Params = { id: string };

export const POST = defineRoute<Params>({
  name: "blocks.duplicate",
  run: async ({ userId, params }) => {
    const id = await serverConvex().mutation(api.blocks.duplicate, {
      userId,
      id: params.id as Id<"blocks">,
    });
    return { id };
  },
});
