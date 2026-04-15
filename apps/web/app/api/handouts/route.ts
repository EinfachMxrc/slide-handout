import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import { HandoutCreate } from "#/lib/zod/handout";
import { serverConvex } from "#/lib/auth/session";
import { defineRoute } from "#/lib/api/route";

export const runtime = "nodejs";

export const POST = defineRoute<Record<string, string>, z.infer<typeof HandoutCreate>>({
  name: "handouts.create",
  body: HandoutCreate,
  errorMap: (err) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNAUTHENTICATED")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (msg.includes("DEMO_ACCOUNT_READ_ONLY")) {
      return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
    }
    return null;
  },
  run: async ({ userId, body }) => {
    const id = await serverConvex().mutation(api.handouts.create, {
      userId,
      title: body.title,
      description: body.description,
    });
    return { id };
  },
});
