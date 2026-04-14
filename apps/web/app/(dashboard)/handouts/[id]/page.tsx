import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getUserId } from "#/lib/auth/session";
import { BlockEditor } from "#/components/editor/block-editor";
import { Card } from "#/components/ui/card";
import { HandoutHeader } from "#/components/dashboard/handout-header";
import { HandoutSettings } from "#/components/editor/handout-settings";

export default async function HandoutEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const userId = await getUserId();
  const handoutId = id as Id<"handouts">;
  const handout = await fetchQuery(api.handouts.get, {
    userId,
    id: handoutId,
  });
  if (!handout) notFound();
  const blocks = await fetchQuery(api.blocks.list, { userId, handoutId });

  const publicUrl =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "") + "/h/" + handout.publicToken;

  return (
    <div className="space-y-6">
      <Card>
        <HandoutHeader
          handoutId={handout._id}
          initialTitle={handout.title}
          initialDescription={handout.description}
          publicUrl={publicUrl}
        />
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/handouts/${handout._id}/present`}
            className="rounded-pill bg-teal-400 px-4 py-2 text-sm font-semibold text-navy-1000 hover:bg-teal-300"
          >
            Präsentieren →
          </Link>
          <span className="text-xs text-navy-400">
            Reader-Link:{" "}
            <code className="rounded bg-navy-100 px-2 py-0.5 dark:bg-navy-800">
              {publicUrl}
            </code>
          </span>
        </div>
      </Card>

      <HandoutSettings
        handoutId={handout._id}
        initial={{
          accentColor: handout.accentColor ?? null,
          coverImageUrl: handout.coverImageUrl ?? null,
          logoUrl: handout.logoUrl ?? null,
          fontFamily: handout.fontFamily ?? null,
          readerTheme: handout.readerTheme ?? null,
          footerMarkdown: handout.footerMarkdown ?? null,
        }}
      />

      <BlockEditor handoutId={handout._id} initialBlocks={blocks} />
    </div>
  );
}
