// Types and validation for managing studios and games.
// Shared between server actions and client forms — keep free of server-only imports.

export type StudioRow = {
  id: number;
  name: string;
  followers: number | null;
  /** Unix ms. */
  createdAt: number;
  gameCount: number;
  snapshotCount: number;
};

export type GameRow = {
  id: number;
  name: string;
  studioId: number;
  studio: string;
  gameSlug: string;
  /** stake.com's own id; optional. */
  stakeId: string | null;
  saves: number | null;
  /** Unix ms. */
  createdAt: number;
  snapshotCount: number;
  /** Unix ms of the newest snapshot, or null when there is none. */
  lastSnapshotAt: number | null;
};

export type StudioOption = { id: number; name: string };

/** What the form inputs held when submitted, so they survive a failed save. */
export type FormValues = Record<string, string>;

export type FormState = {
  /** Field name → message. */
  errors?: Record<string, string>;
  /** Message not tied to one field. */
  message?: string;
  values?: FormValues;
};

export const MAX_TEXT_LENGTH = 255;

export function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export type StudioInput = { name: string; followers: number | null };
export type GameInput = {
  name: string;
  studioId: number;
  gameSlug: string;
  stakeId: string | null;
  saves: number | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

export function readValues(formData: FormData, fields: readonly string[]): FormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  );
}

export const STUDIO_FIELDS = ["name", "followers"] as const;
export const GAME_FIELDS = ["name", "studioId", "gameSlug", "stakeId", "saves"] as const;

export function validateStudio(values: FormValues): Result<StudioInput> {
  const errors: Record<string, string> = {};
  const name = requiredText(values.name, "Name", errors, "name");
  const followers = optionalCount(values.followers, "Followers", errors, "followers");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name: name!, followers } };
}

export function validateGame(values: FormValues): Result<GameInput> {
  const errors: Record<string, string> = {};
  const name = requiredText(values.name, "Name", errors, "name");
  const gameSlug = requiredText(values.gameSlug, "Slug", errors, "gameSlug");
  if (gameSlug && /\s/.test(gameSlug)) errors.gameSlug = "Slug can’t contain spaces.";
  const studioId = parseId(values.studioId);
  if (studioId === null) errors.studioId = "Choose a studio.";
  const stakeId = values.stakeId?.trim() || null;
  if (stakeId && stakeId.length > MAX_TEXT_LENGTH) {
    errors.stakeId = `Keep it under ${MAX_TEXT_LENGTH} characters.`;
  }
  const saves = optionalCount(values.saves, "Saves", errors, "saves");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name: name!, studioId: studioId!, gameSlug: gameSlug!, stakeId, saves } };
}

function requiredText(
  raw: string | undefined,
  label: string,
  errors: Record<string, string>,
  field: string,
): string | null {
  const value = raw?.trim() ?? "";
  if (!value) {
    errors[field] = `${label} is required.`;
    return null;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    errors[field] = `Keep it under ${MAX_TEXT_LENGTH} characters.`;
    return null;
  }
  return value;
}

/** Empty means unknown (NULL); otherwise a whole number ≥ 0 that fits Postgres `integer`. */
function optionalCount(
  raw: string | undefined,
  label: string,
  errors: Record<string, string>,
  field: string,
): number | null {
  const value = raw?.trim().replace(/[,_\s]/g, "") ?? "";
  if (!value) return null;
  if (!/^\d+$/.test(value) || Number(value) > 2_147_483_647) {
    errors[field] = `${label} must be a whole number, 0 or more.`;
    return null;
  }
  return Number(value);
}
