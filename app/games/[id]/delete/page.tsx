import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteGame } from "@/lib/actions";
import { formatInteger } from "@/lib/format";
import { getGame } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { DeleteForm } from "../../../_components/manage/delete-form";
import { PageHeading, Panel, PanelSkeleton } from "../../../_components/manage/ui";

export const metadata: Metadata = { title: "Delete game" };

export default function DeleteGamePage({ params }: PageProps<"/games/[id]/delete">) {
  return (
    <main>
      <PageHeading title="Delete game" back={{ href: "/games", label: "Games" }} />
      <Suspense fallback={<PanelSkeleton height="h-72 max-w-xl" />}>
        <DeleteGame params={params} />
      </Suspense>
    </main>
  );
}

async function DeleteGame({ params }: Pick<PageProps<"/games/[id]/delete">, "params">) {
  const id = parseId((await params).id);
  const game = id === null ? null : await getGame(id);
  if (!game) notFound();

  const snapshots = game.snapshotCount;
  return (
    <Panel className="max-w-xl">
      <div className="border-b border-hairline px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
        <p className="text-ink">
          This permanently deletes <strong className="font-semibold">{game.name}</strong>{" "}
          <span className="text-ink-2">({game.studio})</span>
          {snapshots === 0 ? (
            ". It has no statistics yet."
          ) : (
            <>
              {" "}and its{" "}
              <strong className="font-semibold tabular-nums">
                {formatInteger(snapshots)} statistics {snapshots === 1 ? "snapshot" : "snapshots"}
              </strong>
              .
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-muted">This can’t be undone.</p>
      </div>
      <DeleteForm
        action={deleteGame.bind(null, game.id)}
        name={game.name}
        submitLabel="Delete game"
        cancelHref={`/games?studio=${game.studioId}`}
      />
    </Panel>
  );
}
