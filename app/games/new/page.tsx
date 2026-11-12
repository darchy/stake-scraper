import type { Metadata } from "next";
import { Suspense } from "react";
import { createGame } from "@/lib/actions";
import { getStudioOptions } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { GameForm } from "../../_components/manage/game-form";
import { PageHeading, Panel, PanelSkeleton } from "../../_components/manage/ui";

export const metadata: Metadata = { title: "Add game" };

export default function NewGamePage({ searchParams }: PageProps<"/games/new">) {
  return (
    <main>
      <PageHeading title="Add game" back={{ href: "/games", label: "Games" }} />
      <Suspense fallback={<PanelSkeleton height="h-[30rem] max-w-xl" />}>
        <NewGame searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function NewGame({ searchParams }: Pick<PageProps<"/games/new">, "searchParams">) {
  const requested = parseId((await searchParams).studio);
  const studios = await getStudioOptions();
  const studioId = studios.some((studio) => studio.id === requested) ? requested : null;

  return (
    <Panel className="max-w-xl">
      <GameForm
        action={createGame}
        studios={studios}
        initial={{ name: "", studioId, gameSlug: "", stakeId: null, saves: null }}
        submitLabel="Add game"
        cancelHref={studioId === null ? "/games" : `/games?studio=${studioId}`}
      />
    </Panel>
  );
}
