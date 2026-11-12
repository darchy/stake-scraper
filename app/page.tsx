import { Suspense } from "react";
import { getGames, getStatsSeries } from "@/lib/stats";
import { parseGameId, parseWindow } from "@/lib/stats-types";
import { DashboardView } from "./_components/dashboard-view";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const window = parseWindow(params.window);
  const requestedGame = parseGameId(params.game);

  const games = await getGames();
  // An unknown ?game= falls back to all games rather than an empty page.
  const gameId = games.some((game) => game.id === requestedGame) ? requestedGame : null;
  const series = await getStatsSeries(gameId, window);

  return <DashboardView games={games} series={series} gameId={gameId} window={window} />;
}

function DashboardSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="space-y-3 pt-10 pb-10 sm:pt-14">
        <div className="h-12 w-4/5 max-w-3xl rounded-xl bg-hairline" />
        <div className="h-12 w-3/5 max-w-2xl rounded-xl bg-hairline" />
      </div>
      <div className="mb-5 h-10 w-72 rounded-full bg-hairline" />
      <div className="h-[36rem] rounded-3xl border border-hairline bg-plate" />
    </div>
  );
}
