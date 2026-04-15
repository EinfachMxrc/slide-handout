import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BlockCreate } from "#/lib/zod/block";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

export const GET = defineRoute({
  name: "blocks.list",
  run: async ({ userId, req }) => {
    const handoutId = new URL(req.url).searchParams.get("handoutId");
    if (!handoutId) {
      return NextResponse.json({ error: "missing_handoutId" }, { status: 400 });
    }
    try {
      return await serverConvex().query(api.blocks.list, {
        userId,
        handoutId: handoutId as Id<"handouts">,
      });
    } catch {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  },
});

const PostBody = BlockCreate.extend({
  handoutId: z.string().min(1),
});

export const POST = defineRoute<Record<string, string>, z.infer<typeof PostBody>>({
  name: "blocks.create",
  body: PostBody,
  errorMap: (err) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("DEMO_ACCOUNT_READ_ONLY")) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }
    return null;
  },
  run: async ({ userId, body }) => {
    const { handoutId, ...data } = body;
    const id = await serverConvex().mutation(api.blocks.create, {
      userId,
      handoutId: handoutId as Id<"handouts">,
      ...data,
    });
    return { id };
  },
});
