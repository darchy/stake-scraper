"use server";

// Mutations for studios and games. There are deliberately no actions for
// game_statistics: snapshots are written only by the scraper. Deleting a
// game or studio still removes its snapshots, through the database's
// ON DELETE CASCADE foreign keys, after the user confirms by typing its name.

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { DatabaseError } from "pg";
import { getPool } from "./db";
import {
  GAME_FIELDS,
  STUDIO_FIELDS,
  parseId,
  readValues,
  validateGame,
  validateStudio,
  type FormState,
  type GameInput,
} from "./manage-types";

// ---------- studios ----------

export async function createStudio(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readValues(formData, STUDIO_FIELDS);
  const result = validateStudio(values);
  if (!result.ok) return { errors: result.errors, values };

  try {
    await getPool().query(`insert into studios (name, followers) values ($1, $2)`, [
      result.data.name,
      result.data.followers,
    ]);
  } catch (error) {
    return { ...describeDbError(error), values };
  }

  updateTag("studios");
  redirect("/studios");
}

export async function updateStudio(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readValues(formData, STUDIO_FIELDS);
  if (parseId(String(id)) === null) return { message: "Unknown studio.", values };
  const result = validateStudio(values);
  if (!result.ok) return { errors: result.errors, values };

  try {
    const { rowCount } = await getPool().query(
      `update studios set name = $2, followers = $3 where id = $1`,
      [id, result.data.name, result.data.followers],
    );
    if (rowCount === 0) return { message: "This studio no longer exists.", values };
  } catch (error) {
    return { ...describeDbError(error), values };
  }

  // Game lists and the dashboard's game picker show the studio name.
  updateTag("studios");
  updateTag("games");
  redirect("/studios");
}

export async function deleteStudio(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return deleteConfirmed("studios", id, formData, "/studios");
}

// ---------- games ----------

export async function createGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readValues(formData, GAME_FIELDS);
  const result = validateGame(values);
  if (!result.ok) return { errors: result.errors, values };

  try {
    const problem = await checkGame(result.data, null);
    if (problem) return { ...problem, values };
    await getPool().query(
      `insert into games (name, studio_id, game_slug, game_id, saves) values ($1, $2, $3, $4, $5)`,
      [result.data.name, result.data.studioId, result.data.gameSlug, result.data.stakeId, result.data.saves],
    );
  } catch (error) {
    return { ...describeDbError(error), values };
  }

  updateTag("games");
  updateTag("studios");
  redirect(`/games?studio=${result.data.studioId}`);
}

export async function updateGame(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readValues(formData, GAME_FIELDS);
  if (parseId(String(id)) === null) return { message: "Unknown game.", values };
  const result = validateGame(values);
  if (!result.ok) return { errors: result.errors, values };

  try {
    const problem = await checkGame(result.data, id);
    if (problem) return { ...problem, values };
    const { rowCount } = await getPool().query(
      `update games set name = $2, studio_id = $3, game_slug = $4, game_id = $5, saves = $6 where id = $1`,
      [id, result.data.name, result.data.studioId, result.data.gameSlug, result.data.stakeId, result.data.saves],
    );
    if (rowCount === 0) return { message: "This game no longer exists.", values };
  } catch (error) {
    return { ...describeDbError(error), values };
  }

  updateTag("games");
  updateTag("studios");
  redirect(`/games?studio=${result.data.studioId}`);
}

export async function deleteGame(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return deleteConfirmed("games", id, formData, "/games");
}

// ---------- helpers ----------

/** Rejects a missing studio and a slug another game already uses. */
async function checkGame(input: GameInput, excludeId: number | null): Promise<FormState | null> {
  const { rows } = await getPool().query<{ studioExists: boolean; slugTaken: string | null }>(
    `select
       exists (select 1 from studios where id = $1) as "studioExists",
       (select name from games
         where lower(game_slug) = lower($2) and ($3::bigint is null or id <> $3::bigint)
         limit 1) as "slugTaken"`,
    [input.studioId, input.gameSlug, excludeId],
  );
  const { studioExists, slugTaken } = rows[0];
  const errors: Record<string, string> = {};
  if (!studioExists) errors.studioId = "That studio no longer exists.";
  if (slugTaken !== null) errors.gameSlug = `“${slugTaken}” already uses this slug.`;
  return Object.keys(errors).length > 0 ? { errors } : null;
}

/**
 * Deletes one studio or game once the typed confirmation matches its current
 * name. The row is locked first, so a rename in between can't slip past the check.
 */
async function deleteConfirmed(
  table: "studios" | "games",
  id: number,
  formData: FormData,
  listPath: string,
): Promise<FormState> {
  const typed = String(formData.get("confirm") ?? "").trim();
  const values = { confirm: typed };
  if (parseId(String(id)) === null) return { message: "Unknown item.", values };

  const client = await getPool().connect();
  try {
    await client.query("begin");
    // `table` is one of two literals above, never user input.
    const { rows } = await client.query<{ name: string }>(
      `select name from ${table} where id = $1 for update`,
      [id],
    );
    if (rows.length === 0) {
      await client.query("rollback");
      return { message: "It has already been deleted.", values };
    }
    if (typed !== rows[0].name.trim()) {
      await client.query("rollback");
      return { errors: { confirm: "Type the name exactly as shown." }, values };
    }
    await client.query(`delete from ${table} where id = $1`, [id]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    return { ...describeDbError(error), values };
  } finally {
    client.release();
  }

  updateTag("studios");
  updateTag("games");
  updateTag("stats");
  redirect(listPath);
}

function describeDbError(error: unknown): FormState {
  const code = (error as Partial<DatabaseError> | null)?.code;
  if (code === "23503") return { message: "A related studio or game no longer exists." };
  if (code === "23514") return { message: "A number is out of range." };
  console.error(error);
  return { message: "The database didn’t accept the change. Check that it’s reachable and try again." };
}
