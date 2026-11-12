"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { formatDateTime, formatDay, formatInteger, formatPercent } from "@/lib/format";
import {
  STATS_WINDOWS,
  WINDOW_LABELS,
  WINDOW_PHRASES,
  type GameOption,
  type StatsPoint,
  type StatsWindow,
} from "@/lib/stats-types";
import { MetricChart } from "./metric-chart";
import { describeDelta, METRICS, type Metric } from "./metrics";
import { Segmented } from "./segmented";
import { StatsTable } from "./stats-table";
import { useHydrated, usePrefersReducedMotion } from "./use-client-env";

type Filters = { gameId: number | null; window: StatsWindow };

type Props = Filters & {
  games: GameOption[];
  series: StatsPoint[];
};

const WINDOW_OPTIONS = STATS_WINDOWS.map((value) => ({ value, label: WINDOW_LABELS[value] }));
const VIEW_OPTIONS = [
  { value: "chart", label: "Charts" },
  { value: "table", label: "Table" },
] as const;

export function DashboardView({ games, series, gameId, window }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Show the new selection immediately while the server fetches its data.
  const [filters, setFilters] = useOptimistic<Filters>({ gameId, window });
  const [view, setView] = useState<"chart" | "table">("chart");
  const hydrated = useHydrated();
  const reducedMotion = usePrefersReducedMotion();

  function updateFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.gameId !== null) params.set("game", String(merged.gameId));
    if (merged.window !== "day") params.set("window", merged.window);
    const query = params.toString();
    startTransition(() => {
      setFilters(merged);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  const selectedGame = games.find((game) => game.id === gameId) ?? null;
  const latest = series.at(-1) ?? null;
  const previous = series.at(-2) ?? null;
  const studios = groupByStudio(games);

  return (
    <>
      <section className="pt-10 pb-10 sm:pt-14">
        <Headline latest={latest} game={selectedGame} window={window} />
        <p className="mt-4 max-w-[60ch] text-ink-2">
          {latest && hydrated ? (
            <>
              Based on {series.length} {series.length === 1 ? "snapshot" : "snapshots"}, the latest
              taken {formatDateTime(latest.takenAt)}.
            </>
          ) : (
            " "
          )}
        </p>
      </section>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 pb-5">
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-sm text-ink-2 sm:max-w-80 sm:flex-none">
          Game
          <span className="relative">
            <select
              value={filters.gameId ?? ""}
              onChange={(event) =>
                updateFilters({ gameId: event.target.value ? Number(event.target.value) : null })
              }
              className="w-full appearance-none rounded-full border border-hairline bg-plate py-2 pr-10 pl-4 text-[0.95rem] font-medium text-ink transition-colors hover:border-axis"
            >
              <option value="">All games</option>
              {studios.map(([studio, studioGames]) => (
                <optgroup key={studio} label={studio}>
                  {studioGames.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5.5 8 4.5 4.5L14.5 8" />
            </svg>
          </span>
        </label>

        <div className="flex flex-col gap-1.5 text-sm text-ink-2">
          <span>Period</span>
          <Segmented
            label="Statistics period"
            options={WINDOW_OPTIONS}
            value={filters.window}
            onChange={(value) => updateFilters({ window: value })}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-ink-2 sm:ml-auto">
          <span>View</span>
          <Segmented label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
      </div>

      <section
        aria-busy={isPending}
        aria-label="Statistics"
        className={`overflow-hidden rounded-3xl border border-hairline bg-plate transition-opacity duration-200 ${
          isPending ? "opacity-55" : ""
        }`}
      >
        {series.length === 0 ? (
          <EmptyState game={selectedGame} />
        ) : view === "table" ? (
          hydrated && <StatsTable data={series} showGameCount={gameId === null} />
        ) : (
          <div className="grid md:grid-cols-2">
            {METRICS.map((metric, index) => {
              const current = latest?.[metric.key] ?? null;
              const delta = describeDelta(metric, current, previous?.[metric.key] ?? null);
              return (
                <figure key={metric.key} className={`border-hairline p-5 sm:p-6 ${cellBorders(metric, index)}`}>
                  <figcaption>
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="font-medium text-ink-2">{metric.title}</h2>
                      {delta && previous && hydrated && (
                        <p className="text-sm text-muted">
                          <span aria-hidden>
                            {delta.direction === "up" ? "▲ " : delta.direction === "down" ? "▼ " : ""}
                          </span>
                          <span className="sr-only">
                            {delta.direction === "up" ? "Up " : delta.direction === "down" ? "Down " : "No change "}
                          </span>
                          {delta.text} since {formatDay(previous.takenAt)}
                        </p>
                      )}
                    </div>
                    <p
                      className={`mt-1 font-semibold tracking-tight text-ink ${
                        metric.featured ? "text-4xl" : "text-3xl"
                      }`}
                    >
                      {current === null ? "—" : metric.format(current)}
                    </p>
                    <p className="mt-1 text-sm text-muted">{metric.note}</p>
                  </figcaption>
                  <div className="mt-4 -ml-2 h-[216px]">
                    {hydrated && (
                      <MetricChart
                        metric={metric}
                        data={series}
                        index={index}
                        animate={!reducedMotion}
                        showGameCount={gameId === null}
                      />
                    )}
                  </div>
                </figure>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Headline({
  latest,
  game,
  window,
}: {
  latest: StatsPoint | null;
  game: GameOption | null;
  window: StatsWindow;
}) {
  const subject = game ? game.name : `${latest?.games ?? 0} ${latest?.games === 1 ? "game" : "games"}`;
  const className =
    "max-w-[24ch] text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.05] font-semibold tracking-[-0.025em] text-balance text-ink";

  if (!latest) {
    return <h1 className={className}>No statistics recorded yet{game ? ` for ${game.name}` : ""}.</h1>;
  }

  const rtp = latest.rtp === null ? null : formatPercent(latest.rtp);
  return (
    <h1 className={className}>
      Players placed {formatInteger(latest.betCount)} bets on {subject} {WINDOW_PHRASES[window]}, staking{" "}
      {formatInteger(latest.wageredValue)}
      {rtp ? ` and getting back ${rtp}` : ""}.
    </h1>
  );
}

function EmptyState({ game }: { game: GameOption | null }) {
  return (
    <div className="px-6 py-20 text-center">
      <p className="text-lg font-medium text-ink">No snapshots to chart yet</p>
      <p className="mt-2 text-ink-2">
        {game
          ? `The scraper hasn't stored any statistics for ${game.name}. Pick another game, or check back after its next run.`
          : "The scraper hasn't stored any statistics. They'll appear here after its next run."}
      </p>
    </div>
  );
}

const FEATURED_COUNT = METRICS.filter((metric) => metric.featured).length;

/**
 * Hairlines between cells: featured metrics span the full width on top, the
 * rest form a two-column grid on md+ and a single column below that.
 */
function cellBorders(metric: Metric, index: number): string {
  if (metric.featured) return "border-b md:col-span-2";
  const cell = index - FEATURED_COUNT;
  return [
    index < METRICS.length - 1 && "max-md:border-b",
    cell < METRICS.length - FEATURED_COUNT - 2 && "md:border-b",
    cell % 2 === 0 && "md:border-r",
  ]
    .filter(Boolean)
    .join(" ");
}

function groupByStudio(games: GameOption[]): [string, GameOption[]][] {
  const groups = new Map<string, GameOption[]>();
  for (const game of games) {
    const list = groups.get(game.studio) ?? [];
    list.push(game);
    groups.set(game.studio, list);
  }
  return [...groups];
}
