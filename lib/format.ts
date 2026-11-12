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

/** Amount with a true minus sign when negative: "1,234" / "−1,234". */
export function formatAmount(value: number): string {
  const rounded = Math.round(value);
  return rounded < 0 ? `−${integer.format(-rounded)}` : integer.format(rounded);
}

/** Signed amount: "+1,234" / "−1,234" (true minus sign). */
export function formatSigned(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : "−"}${integer.format(Math.abs(rounded))}`;
}

export function formatSignedCompact(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "" : "−"}${compact.format(Math.abs(value))}`;
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
