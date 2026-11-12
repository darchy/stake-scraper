import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateGame } from "@/lib/actions";
import { getGame, getStudioOptions } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { GameForm } from "../../../_components/manage/game-form";
import { PageHeading, Panel, PanelSkeleton } from "../../../_components/manage/ui";

export const metadata: Metadata = { title: "Edit game" };

export default function EditGamePage({ params }: PageProps<"/games/[id]/edit">) {
  return (
    <main>
      <PageHeading title="Edit game" back={{ href: "/games", label: "Games" }} />
      <Suspense fallback={<PanelSkeleton height="h-[30rem] max-w-xl" />}>
        <EditGame params={params} />
      </Suspense>
    </main>
  );
}

async function EditGame({ params }: Pick<PageProps<"/games/[id]/edit">, "params">) {
  const id = parseId((await params).id);
  const [game, studios] = await Promise.all([id === null ? null : getGame(id), getStudioOptions()]);
  if (!game) notFound();

  return (
    <Panel className="max-w-xl">
      <GameForm
        action={updateGame.bind(null, game.id)}
        studios={studios}
        initial={game}
        submitLabel="Save changes"
        cancelHref={`/games?studio=${game.studioId}`}
      />
    </Panel>
  );
}
