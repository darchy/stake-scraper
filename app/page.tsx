import { Suspense } from "react";
import { getGames, getStatsSeries } from "@/lib/stats";
import { parseGameId, parseWindow } from "@/lib/stats-types";
import { DashboardView } from "./_components/dashboard-view";
import { ThemeSwitch } from "./_components/theme-switch";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="halo min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
        <header className="flex items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="size-6 text-data" aria-hidden fill="currentColor">
              <rect x="3" y="12" width="4" height="9" rx="1.5" />
              <rect x="10" y="7" width="4" height="14" rx="1.5" />
              <rect x="17" y="3" width="4" height="18" rx="1.5" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">Game stats</span>
            <span className="hidden text-muted sm:inline">from stake.com</span>
          </div>
          <ThemeSwitch />
        </header>

        <main>
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
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
