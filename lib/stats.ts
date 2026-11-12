import "server-only";
import { cacheLife } from "next/cache";
import { getPool } from "./db";
import {
  STUDIO_GGR_SHARE,
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
