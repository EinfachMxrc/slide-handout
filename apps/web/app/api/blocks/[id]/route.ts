import type { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BlockUpdate } from "#/lib/zod/block";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

type Params = { id: string };

export const PATCH = defineRoute<Params, z.infer<typeof BlockUpdate>>({
  name: "blocks.update",
  body: BlockUpdate,
  run: async ({ userId, params, body }) => {
    await serverConvex().mutation(api.blocks.update, {
      userId,
      id: params.id as Id<"blocks">,
      ...body,
    });
  },
});

export const DELETE = defineRoute<Params>({
  name: "blocks.remove",
  run: async ({ userId, params }) => {
    await serverConvex().mutation(api.blocks.remove, {
      userId,
      id: params.id as Id<"blocks">,
    });
  },
});
