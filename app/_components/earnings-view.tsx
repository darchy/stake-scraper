"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { formatDateTime, formatInteger, formatMoney, formatRtp, formatSignedMoney } from "@/lib/format";
import type { StudioOption } from "@/lib/manage-types";
import { STUDIO_GGR_SHARE, type EarningsBreakdown, type EarningsItem } from "@/lib/stats-types";
import { EarningsBars } from "./earnings-bars";
import { StudioSelect } from "./manage/studio-filter";
import { PageHeading } from "./manage/ui";
import { Segmented } from "./segmented";
import { useHydrated, usePrefersReducedMotion } from "./use-client-env";

type Props = {
  studios: StudioOption[];
  /** Selected studio, or null for all studios. */
  studioId: number | null;
  breakdown: EarningsBreakdown;
};

const VIEW_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
] as const;

export function EarningsView({ studios, studioId, breakdown }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Show the new selection immediately while the server fetches its data.
  const [selected, setSelected] = useOptimistic(studioId);
  const [view, setView] = useState<"chart" | "table">("chart");
  const hydrated = useHydrated();
  const reducedMotion = usePrefersReducedMotion();

  function selectStudio(next: number | null) {
    startTransition(() => {
      setSelected(next);
      router.replace(earningsHref(next), { scroll: false });
    });
  }

  const studio = studios.find((option) => option.id === studioId) ?? null;
  const kind = studio ? "game" : "studio";
  const { items, total, latestAt, missingGames } = breakdown;

  return (
    <>
      <PageHeading
        title={studio ? studio.name : "Studio earnings"}
        back={studio ? { href: "/earnings", label: "All studios" } : undefined}
      >
        {studio
          ? `All-time earnings of ${studio.name}, split by game.`
          : "All-time earnings of each studio. Pick a studio to split it by game."}
      </PageHeading>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-5">
        <StudioSelect studios={studios} value={selected} onChange={selectStudio} />
        <div className="flex flex-col gap-1.5 text-sm text-ink-2">
          <span>View</span>
          <Segmented label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
      </div>

      <section
        aria-busy={isPending}
        aria-label="Earnings"
        className={`overflow-hidden rounded-3xl border border-hairline bg-plate transition-opacity duration-200 ${
          isPending ? "opacity-55" : ""
        }`}
      >
        {items.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-lg font-medium text-ink">No earnings to show yet</p>
            <p className="mt-2 text-ink-2">
              {studio
                ? `The scraper hasn't stored any statistics for ${studio.name}'s games.`
                : "The scraper hasn't stored any statistics. They'll appear here after its next run."}
            </p>
          </div>
        ) : (
          <>
            <TotalTile
              title={studio ? `${studio.name} earnings` : "Total studio earnings"}
              total={total}
              rowCount={items.length}
              kind={kind}
              latestAt={hydrated ? latestAt : null}
            />
            {view === "table" ? (
              <EarningsTable items={items} total={total} kind={kind} onSelectStudio={selectStudio} />
            ) : (
              <div className="px-3 py-5 sm:p-6">
                {hydrated && (
                  <EarningsBars
                    items={items}
                    kind={kind}
                    animate={!reducedMotion}
                    onSelect={studio ? undefined : (item) => selectStudio(item.id)}
                  />
                )}
              </div>
            )}
            {missingGames > 0 && (
              <p className="border-t border-hairline px-5 py-3 text-sm text-muted sm:px-6">
                {missingGames} {missingGames === 1 ? "game has" : "games have"} no statistics yet and{" "}
                {missingGames === 1 ? "isn't" : "aren't"} included.
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}

function TotalTile({
  title,
  total,
  rowCount,
  kind,
  latestAt,
}: {
  title: string;
  total: EarningsBreakdown["total"];
  rowCount: number;
  kind: "studio" | "game";
  /** Null until hydrated, so the date uses the viewer's locale. */
  latestAt: number | null;
}) {
  const figures: [string, string][] = [
    ["GGR", formatMoney(-total.profitValue)],
    ["Wagered", formatMoney(total.wageredValue)],
    ["Bets", formatInteger(total.betCount)],
    kind === "studio"
      ? ["Studios", `${formatInteger(rowCount)} · ${formatInteger(total.games)} games`]
      : ["Games", formatInteger(total.games)],
  ];

  return (
    <div className="border-b border-hairline p-5 sm:p-6">
      <h2 className="font-medium text-ink-2">{title}, all time</h2>
      <p className="mt-1 text-5xl font-semibold tracking-tight text-ink tabular-nums">
        {formatMoney(total.earnings)}
      </p>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-medium text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">
        {STUDIO_GGR_SHARE * 100}% of GGR (stakes minus winnings paid), from the all-time figures in each
        game’s latest snapshot{latestAt !== null ? `, newest taken ${formatDateTime(latestAt)}` : ""}.
        Negative when players won.
      </p>
    </div>
  );
}

function EarningsTable({
  items,
  total,
  kind,
  onSelectStudio,
}: {
  items: EarningsItem[];
  total: EarningsBreakdown["total"];
  kind: "studio" | "game";
  onSelectStudio: (studioId: number) => void;
}) {
  const th = "px-5 py-3 font-medium";
  const num = "px-5 py-3 text-right";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-ink-2">
            <th scope="col" className={th}>
              {kind === "studio" ? "Studio" : "Game"}
            </th>
            {kind === "studio" && (
              <th scope="col" className={`${th} text-right`}>
                Games
              </th>
            )}
            <th scope="col" className={`${th} text-right`}>
              Bets
            </th>
            <th scope="col" className={`${th} text-right`}>
              Wagered
            </th>
            <th scope="col" className={`${th} text-right`}>
              Player profit
            </th>
            <th scope="col" className={`${th} text-right`}>
              RTP
            </th>
            <th scope="col" className={`${th} text-right`}>
              Studio earnings
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {items.map((item) => (
            <tr key={item.id} className="border-b border-hairline hover:bg-plate-sunk">
              <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                {kind === "studio" ? (
                  <Link
                    href={earningsHref(item.id)}
                    onClick={(event) => {
                      // Plain clicks go through the transition; modified clicks open a tab as usual.
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onSelectStudio(item.id);
                    }}
                    className="hover:text-data hover:underline"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <Link
                    href={`/?game=${item.id}&window=all`}
                    title="Show this game on the dashboard"
                    className="hover:text-data hover:underline"
                  >
                    {item.name}
                  </Link>
                )}
              </th>
              {kind === "studio" && <td className={num}>{formatInteger(item.games)}</td>}
              <td className={num}>{formatInteger(item.betCount)}</td>
              <td className={num}>{formatMoney(item.wageredValue)}</td>
              <td className={num}>{formatSignedMoney(item.profitValue)}</td>
              <td className={num}>{item.rtp === null ? "—" : formatRtp(item.rtp)}</td>
              <td className={`${num} font-medium text-ink`}>{formatMoney(item.earnings)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="tabular-nums">
          <tr className="bg-plate-sunk font-semibold text-ink">
            <th scope="row" className="px-5 py-3 text-left">
              Total
            </th>
            {kind === "studio" && <td className={num}>{formatInteger(total.games)}</td>}
            <td className={num}>{formatInteger(total.betCount)}</td>
            <td className={num}>{formatMoney(total.wageredValue)}</td>
            <td className={num}>{formatSignedMoney(total.profitValue)}</td>
            <td className={num}>{total.rtp === null ? "—" : formatRtp(total.rtp)}</td>
            <td className={num}>{formatMoney(total.earnings)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function earningsHref(studioId: number | null): string {
  return studioId === null ? "/earnings" : `/earnings?studio=${studioId}`;
}
