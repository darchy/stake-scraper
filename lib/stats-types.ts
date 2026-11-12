// Shared between server queries and client components — keep free of server-only imports.

export const STATS_WINDOWS = ["day", "week", "month", "all"] as const;
export type StatsWindow = (typeof STATS_WINDOWS)[number];

export const WINDOW_LABELS: Record<StatsWindow, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  all: "All time",
};

/** Phrase used in the headline sentence, e.g. "…on 5 games over the past day". */
export const WINDOW_PHRASES: Record<StatsWindow, string> = {
  day: "over the past day",
  week: "over the past week",
  month: "over the past month",
  all: "in total",
};

export type GameOption = {
  id: number;
  name: string;
  studio: string;
};

/** One scrape run, summed over the selected games for one statistics window. */
export type StatsPoint = {
  /** Unix ms of the scrape run. */
  takenAt: number;
  /** How many games contributed to this point. */
  games: number;
  betCount: number;
  wageredValue: number;
  /** Player-side: negative means players lost (the house won). */
  profitValue: number;
  /** Wager-weighted return to player; null when nothing was wagered. */
  rtp: number | null;
  /**
   * The studio's cut: STUDIO_GGR_SHARE of GGR, where GGR = stakes − winnings
   * paid = −profitValue. Not stored in the database; negative when players won.
   */
  studioEarnings: number;
};

/** Share of a game's gross gaming revenue (GGR) that goes to its studio. */
export const STUDIO_GGR_SHARE = 0.1;

export function parseWindow(value: unknown): StatsWindow {
  return STATS_WINDOWS.includes(value as StatsWindow)
    ? (value as StatsWindow)
    : "day";
}

export function parseGameId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
