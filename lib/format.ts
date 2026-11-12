const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const percent2 = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatInteger = (value: number) => integer.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatPercent = (value: number) => percent.format(value);
export const formatRtp = (value: number) => percent2.format(value);

// Money: the sign goes before the dollar sign ("−$1,234"), with a true minus.

/** "$1,234" / "−$1,234" */
export function formatMoney(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "−" : ""}$${integer.format(Math.abs(rounded))}`;
}

/** "+$1,234" / "−$1,234" / "$0" */
export function formatSignedMoney(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "$0";
  return `${rounded > 0 ? "+" : "−"}$${integer.format(Math.abs(rounded))}`;
}

/** Axis ticks: "$12.3K" / "−$12.3K" / "$0" */
export function formatMoneyCompact(value: number): string {
  return `${value < 0 ? "−" : ""}$${compact.format(Math.abs(value))}`;
}

// Dates are only formatted in the browser (after hydration), so the viewer's
// own locale and time zone are used without server/client mismatches.
export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
