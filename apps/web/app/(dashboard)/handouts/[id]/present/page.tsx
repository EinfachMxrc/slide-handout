import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getTokenHashFromCookie } from "#/lib/auth/session";
import { SessionShell } from "#/components/session/session-shell";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const handoutId = id as Id<"handouts">;
  const tokenHash = await getTokenHashFromCookie();

  const handout = await fetchQuery(api.handouts.get, {
    tokenHash,
    id: handoutId,
  });
  if (!handout) notFound();

  const blocks = await fetchQuery(api.blocks.list, { tokenHash, handoutId });

  const publicUrl =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") +
    "/h/" +
    handout.publicToken;

  return (
    <SessionShell
      handout={{
        _id: handout._id,
        title: handout.title,
        publicToken: handout.publicToken,
      }}
      blocks={blocks}
      publicUrl={publicUrl}
    />
  );
}
