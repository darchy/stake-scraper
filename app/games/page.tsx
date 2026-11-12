import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getStudioOptions, listGames } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { GamesTable } from "../_components/manage/games-table";
import { StudioFilter } from "../_components/manage/studio-filter";
import { BUTTON, EmptyState, PageHeading, Panel, PanelSkeleton } from "../_components/manage/ui";

export const metadata: Metadata = { title: "Games" };

export default function GamesPage({ searchParams }: PageProps<"/games">) {
  return (
    <main>
      <PageHeading title="Games">
        The scraper collects statistics for each game by its slug. Statistics can’t be edited here;
        deleting a game also deletes its statistics.
      </PageHeading>
      <Suspense fallback={<PanelSkeleton />}>
        <Games searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Games({ searchParams }: Pick<PageProps<"/games">, "searchParams">) {
  const requested = parseId((await searchParams).studio);
  const studios = await getStudioOptions();
  // An unknown ?studio= falls back to all studios rather than an empty page.
  const studioId = studios.some((studio) => studio.id === requested) ? requested : null;
  const games = await listGames(studioId);
  const addHref = studioId === null ? "/games/new" : `/games/new?studio=${studioId}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-5">
        <StudioFilter studios={studios} studioId={studioId} />
        {studios.length > 0 && (
          <Link href={addHref} className={BUTTON.primary}>
            Add game
          </Link>
        )}
      </div>
      <Panel>
        {studios.length === 0 ? (
          <EmptyState>
            Games belong to a studio.{" "}
            <Link href="/studios/new" className="font-medium text-data hover:underline">
              Add a studio
            </Link>{" "}
            first.
          </EmptyState>
        ) : games.length === 0 ? (
          <EmptyState>
            {studioId === null ? "No games yet." : "This studio has no games yet."}{" "}
            <Link href={addHref} className="font-medium text-data hover:underline">
              Add one
            </Link>
            .
          </EmptyState>
        ) : (
          <GamesTable games={games} showStudio={studioId === null} />
        )}
      </Panel>
    </>
  );
}
