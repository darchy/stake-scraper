import { STUDIO_GGR_SHARE } from "@/lib/stats-types";
import {
  formatCompact,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatRtp,
  formatSignedMoney,
} from "@/lib/format";

export type MetricKey = "studioEarnings" | "betCount" | "wageredValue" | "profitValue" | "rtp";

export type Metric = {
  key: MetricKey;
  title: string;
  note: string;
  /** Full value, used in panel headers, tooltips and the table. */
  format: (value: number) => string;
  /** Short value for axis ticks. */
  formatAxis: (value: number) => string;
  /** How the change between the last two snapshots is shown. */
  delta: "relative" | "absolute" | "points";
  /** Horizontal reference line, e.g. break-even. */
  reference?: { value: number; label: string };
  /** Area fill down to zero (magnitudes) or line only (ratios). */
  shape: "area" | "line";
  /** Spans the full width of the grid, above the others. */
  featured?: boolean;
  /**
   * Show the sum of all points below the chart. Only meaningful for the day
   * window: longer rolling windows overlap and would be counted several times.
   */
  showTotal?: boolean;
};

export const METRICS: Metric[] = [
  {
    key: "studioEarnings",
    title: "Studio earnings",
    note: `${STUDIO_GGR_SHARE * 100}% of GGR (stakes minus winnings paid). Negative when players won`,
    format: formatMoney,
    formatAxis: formatMoneyCompact,
    delta: "absolute",
    reference: { value: 0, label: "Zero" },
    shape: "area",
    featured: true,
    showTotal: true,
  },
  {
    key: "betCount",
    title: "Bets",
    note: "Number of bets placed",
    format: formatInteger,
    formatAxis: formatCompact,
    delta: "relative",
    shape: "area",
  },
  {
    key: "wageredValue",
    title: "Wagered",
    note: "Total amount staked",
    format: formatMoney,
    formatAxis: formatMoneyCompact,
    delta: "relative",
    shape: "area",
  },
  {
    key: "profitValue",
    title: "Player profit",
    note: "Winnings minus stakes. Below zero, the house is ahead",
    format: formatSignedMoney,
    formatAxis: formatMoneyCompact,
    delta: "absolute",
    reference: { value: 0, label: "Break-even" },
    shape: "area",
  },
  {
    key: "rtp",
    title: "Return to player",
    note: "Share of stakes paid back. Above 100%, players are ahead",
    format: formatRtp,
    formatAxis: formatPercent,
    delta: "points",
    reference: { value: 1, label: "Break-even" },
    shape: "line",
  },
];

/** "▲ 12.4%", "▼ 1,234", "▲ 0.42 pp" — or null when there's nothing to compare. */
export function describeDelta(
  metric: Metric,
  current: number | null,
  previous: number | null,
): { direction: "up" | "down" | "flat"; text: string } | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";

  switch (metric.delta) {
    case "relative": {
      if (previous === 0) return null;
      const change = Math.abs(diff / previous);
      return { direction, text: formatPercent(change) };
    }
    // Only money metrics use "absolute".
    case "absolute":
      return { direction, text: formatMoney(Math.abs(diff)) };
    case "points":
      return { direction, text: `${(Math.abs(diff) * 100).toFixed(2)} pp` };
  }
}
