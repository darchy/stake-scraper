import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPool } from "./db";
import {
  STUDIO_GGR_SHARE,
  type EarningsBreakdown,
  type EarningsItem,
  type EarningsTotals,
  type GameOption,
  type StatsPoint,
  type StatsWindow,
} from "./stats-types";

/**
 * A game that is missing from a scrape run keeps contributing its most recent
 * snapshot, as long as that snapshot is at most this old. This keeps the
 * "all games" total from dipping when a single game fails to scrape.
 */
const CARRY_FORWARD = "36 hours";

/** Upper bound on the number of points sent to the chart. */
const MAX_RUNS = 400;

export async function getGames(): Promise<GameOption[]> {
  "use cache";
  cacheLife("minutes");
  // Game and studio names: expired by the management actions in lib/actions.ts.
  cacheTag("games", "studios");

  const { rows } = await getPool().query<GameOption>(`
    select g.id::int as id, g.name, s.name as studio
    from games g
    join studios s on s.id = g.studio_id
    order by s.name, g.name
  `);
  return rows;
}

/**
 * Time series of one statistics window, one point per scrape run.
 * Snapshots are grouped into runs by created_at truncated to the minute,
 * because the scraper writes every game of a run with the same timestamp.
 */
export async function getStatsSeries(
  gameId: number | null,
  window: StatsWindow,
): Promise<StatsPoint[]> {
  "use cache";
  cacheLife("minutes");
  // Deleting a game or studio removes snapshots, so it expires "stats" too.
  cacheTag("stats");

  const { rows } = await getPool().query<{
    takenAt: Date;
    games: number;
    betCount: number;
    wageredValue: number;
    profitValue: number;
  }>(
    `
    with selected_games as (
      select id from games where $1::bigint is null or id = $1::bigint
    ),
    runs as (
      select distinct date_trunc('minute', gs.created_at) as t
      from game_statistics gs
      join selected_games g on g.id = gs.game_id
      order by t desc
      limit ${MAX_RUNS}
    ),
    points as (
      select r.t, snap.stats
      from runs r
      cross join selected_games g
      cross join lateral (
        select gs.statistics_json -> $2::text as stats
        from game_statistics gs
        where gs.game_id = g.id
          and gs.created_at < r.t + interval '1 minute'
          and gs.created_at >= r.t - interval '${CARRY_FORWARD}'
        order by gs.created_at desc
        limit 1
      ) snap
      where snap.stats is not null
    )
    select
      t as "takenAt",
      count(*)::int as games,
      coalesce(sum((stats ->> 'betCount')::numeric), 0)::float8 as "betCount",
      coalesce(sum((stats ->> 'wageredValue')::numeric), 0)::float8 as "wageredValue",
      coalesce(sum((stats ->> 'profitValue')::numeric), 0)::float8 as "profitValue"
    from points
    group by t
    order by t
    `,
    [gameId, window],
  );

  return rows.map((row) => ({
    takenAt: row.takenAt.getTime(),
    games: row.games,
    betCount: row.betCount,
    wageredValue: row.wageredValue,
    profitValue: row.profitValue,
    // profitValue is player-side, so players got back wagered + profit.
    rtp:
      row.wageredValue > 0
        ? (row.wageredValue + row.profitValue) / row.wageredValue
        : null,
    // GGR is the house side of player profit; summing per game first is fine
    // because the share is linear.
    studioEarnings: -row.profitValue * STUDIO_GGR_SHARE,
  }));
}

/**
 * All-time studio earnings split by studio (studioId null) or by the games of
 * one studio. Uses the "all" window of each game's latest snapshot; games
 * that have never been scraped are only counted in missingGames.
 */
export async function getEarningsBreakdown(studioId: number | null): Promise<EarningsBreakdown> {
  "use cache";
  cacheLife("minutes");
  // Names come from games/studios; deletes remove snapshots too.
  cacheTag("stats", "games", "studios");

  const { rows } = await getPool().query<{
    gameId: number;
    gameName: string;
    studioId: number;
    studioName: string;
    takenAt: Date | null;
    betCount: number | null;
    wageredValue: number | null;
    profitValue: number | null;
  }>(
    `
    select
      g.id::int as "gameId",
      g.name as "gameName",
      s.id::int as "studioId",
      s.name as "studioName",
      snap.created_at as "takenAt",
      (snap.stats ->> 'betCount')::float8 as "betCount",
      (snap.stats ->> 'wageredValue')::float8 as "wageredValue",
      (snap.stats ->> 'profitValue')::float8 as "profitValue"
    from games g
    join studios s on s.id = g.studio_id
    left join lateral (
      select gs.created_at, gs.statistics_json -> 'all' as stats
      from game_statistics gs
      where gs.game_id = g.id
      order by gs.created_at desc
      limit 1
    ) snap on true
    where $1::bigint is null or g.studio_id = $1::bigint
    order by s.name, g.name, g.id
    `,
    [studioId],
  );

  const groups = new Map<number, EarningsItem>();
  let missingGames = 0;
  for (const row of rows) {
    if (row.takenAt === null || row.wageredValue === null || row.profitValue === null) {
      missingGames++;
      continue;
    }
    const id = studioId === null ? row.studioId : row.gameId;
    const name = studioId === null ? row.studioName : row.gameName;
    const item = groups.get(id) ?? emptyItem(id, name);
    item.games++;
    item.betCount += row.betCount ?? 0;
    item.wageredValue += row.wageredValue;
    item.profitValue += row.profitValue;
    item.takenAt = Math.max(item.takenAt, row.takenAt.getTime());
    groups.set(id, item);
  }

  // Summing profit before taking the share is fine because the share is linear.
  const items = [...groups.values()].map(withDerived).sort((a, b) => b.earnings - a.earnings);
  const total = withDerived(
    items.reduce<EarningsTotals>(
      (sum, item) => ({
        games: sum.games + item.games,
        betCount: sum.betCount + item.betCount,
        wageredValue: sum.wageredValue + item.wageredValue,
        profitValue: sum.profitValue + item.profitValue,
        rtp: null,
        earnings: 0,
      }),
      { games: 0, betCount: 0, wageredValue: 0, profitValue: 0, rtp: null, earnings: 0 },
    ),
  );
  const latestAt = items.length > 0 ? Math.max(...items.map((item) => item.takenAt)) : null;

  return { items, total, latestAt, missingGames };
}

function emptyItem(id: number, name: string): EarningsItem {
  return {
    id,
    name,
    games: 0,
    betCount: 0,
    wageredValue: 0,
    profitValue: 0,
    rtp: null,
    earnings: 0,
    takenAt: 0,
  };
}

/** Fills in RTP (recomputed from the sums, never averaged) and the studio's share. */
function withDerived<T extends EarningsTotals>(item: T): T {
  return {
    ...item,
    rtp: item.wageredValue > 0 ? (item.wageredValue + item.profitValue) / item.wageredValue : null,
    earnings: -item.profitValue * STUDIO_GGR_SHARE,
  };
}
