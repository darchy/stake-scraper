import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPool } from "./db";
import type { GameRow, StudioOption, StudioRow } from "./manage-types";

// Read queries for the studio and game management pages.
// Tags: "studios" and "games" expire when the management actions write;
// "stats" covers snapshot counts, which otherwise refresh with cacheLife.

const STUDIO_SELECT = `
  select
    s.id::int as id,
    s.name,
    s.followers,
    s.created_at as "createdAt",
    (select count(*) from games g where g.studio_id = s.id)::int as "gameCount",
    (select count(*) from game_statistics gs join games g on g.id = gs.game_id
      where g.studio_id = s.id)::int as "snapshotCount"
  from studios s
`;

const GAME_SELECT = `
  select
    g.id::int as id,
    g.name,
    g.studio_id::int as "studioId",
    s.name as studio,
    g.game_slug as "gameSlug",
    g.game_id as "stakeId",
    g.saves,
    g.created_at as "createdAt",
    coalesce(st.count, 0)::int as "snapshotCount",
    st.last as "lastSnapshotAt"
  from games g
  join studios s on s.id = g.studio_id
  left join lateral (
    select count(*) as count, max(created_at) as last
    from game_statistics gs where gs.game_id = g.id
  ) st on true
`;

// pg returns timestamptz as Date; the client gets Unix ms.
type StudioDbRow = Omit<StudioRow, "createdAt"> & { createdAt: Date };
type GameDbRow = Omit<GameRow, "createdAt" | "lastSnapshotAt"> & {
  createdAt: Date;
  lastSnapshotAt: Date | null;
};

function toStudio(row: StudioDbRow): StudioRow {
  return { ...row, createdAt: row.createdAt.getTime() };
}

function toGame(row: GameDbRow): GameRow {
  return {
    ...row,
    createdAt: row.createdAt.getTime(),
    lastSnapshotAt: row.lastSnapshotAt?.getTime() ?? null,
  };
}

export async function listStudios(): Promise<StudioRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("studios", "games", "stats");

  const { rows } = await getPool().query<StudioDbRow>(`${STUDIO_SELECT} order by s.name, s.id`);
  return rows.map(toStudio);
}

export async function getStudio(id: number): Promise<StudioRow | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("studios", "games", "stats");

  const { rows } = await getPool().query<StudioDbRow>(`${STUDIO_SELECT} where s.id = $1`, [id]);
  return rows[0] ? toStudio(rows[0]) : null;
}

export async function listGames(studioId: number | null): Promise<GameRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("studios", "games", "stats");

  const { rows } = await getPool().query<GameDbRow>(
    `${GAME_SELECT} where $1::bigint is null or g.studio_id = $1::bigint order by s.name, g.name, g.id`,
    [studioId],
  );
  return rows.map(toGame);
}

export async function getGame(id: number): Promise<GameRow | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("studios", "games", "stats");

  const { rows } = await getPool().query<GameDbRow>(`${GAME_SELECT} where g.id = $1`, [id]);
  return rows[0] ? toGame(rows[0]) : null;
}

export async function getStudioOptions(): Promise<StudioOption[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("studios");

  const { rows } = await getPool().query<StudioOption>(
    `select id::int as id, name from studios order by name, id`,
  );
  return rows;
}
