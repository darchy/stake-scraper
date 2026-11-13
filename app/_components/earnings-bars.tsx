"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";
import {
  formatDateTime,
  formatInteger,
  formatMoney,
  formatMoneyCompact,
  formatRtp,
  formatSignedMoney,
} from "@/lib/format";
import type { EarningsItem } from "@/lib/stats-types";
import { niceScale } from "./scale";
import { useNarrowScreen } from "./use-client-env";

const ROW_HEIGHT = 36;
const BAR_SIZE = 18;
const X_AXIS_HEIGHT = 32;
/** Name column, value column and name truncation, by screen width. */
const COLUMNS = {
  wide: { name: 176, value: 92, maxName: 24 },
  narrow: { name: 104, value: 76, maxName: 12 },
} as const;

type Props = {
  items: EarningsItem[];
  /** "studio" rows aggregate several games; "game" rows are one game each. */
  kind: "studio" | "game";
  animate: boolean;
  /** Called when a row is clicked; rows aren't clickable without it. */
  onSelect?: (item: EarningsItem) => void;
};

/**
 * Ranked horizontal bars, one per studio or game, on one shared money axis.
 * Names sit on the left, each row's figure on the right, and bars extend left
 * of the zero line when players won.
 */
export function EarningsBars({ items, kind, animate, onSelect }: Props) {
  const values = items.map((item) => item.earnings);
  const { domain, ticks } = niceScale(Math.min(0, ...values), Math.max(0, ...values));
  const height = items.length * ROW_HEIGHT + X_AXIS_HEIGHT + 8;
  const columns = COLUMNS[useNarrowScreen() ? "narrow" : "wide"];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={items}
        layout="vertical"
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        barSize={BAR_SIZE}
        style={onSelect ? { cursor: "pointer" } : undefined}
        onClick={(state) => {
          const index = Number(state?.activeTooltipIndex);
          const item = Number.isInteger(index) ? items[index] : undefined;
          if (item && onSelect) onSelect(item);
        }}
      >
        <CartesianGrid horizontal={false} stroke="var(--grid)" />
        <XAxis
          type="number"
          domain={domain}
          ticks={ticks}
          interval={0}
          tickFormatter={formatMoneyCompact}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--axis)" }}
          tickMargin={8}
          height={X_AXIS_HEIGHT}
        />
        {/* Both category axes key on the unique id; the formatters look up the row. */}
        <YAxis
          yAxisId="name"
          type="category"
          dataKey="id"
          width={columns.name}
          interval={0}
          tick={({ x, y, index }) => (
            <AxisLabel x={x} y={y} anchor="end" className="fill-ink-2" title={items[index]?.name}>
              {truncate(items[index]?.name ?? "", columns.maxName)}
            </AxisLabel>
          )}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="value"
          orientation="right"
          type="category"
          dataKey="id"
          width={columns.value}
          interval={0}
          tick={({ x, y, index }) => (
            <AxisLabel x={x} y={y} anchor="start" className="fill-ink font-medium tabular-nums">
              {items[index] ? formatMoney(items[index].earnings) : ""}
            </AxisLabel>
          )}
          tickLine={false}
          axisLine={false}
        />
        <ReferenceLine x={0} yAxisId="name" stroke="var(--axis)" strokeWidth={1} />
        <Tooltip
          cursor={{ fill: "var(--plate-sunk)" }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as EarningsItem | undefined;
            if (!active || !item) return null;
            return <EarningsTooltip item={item} kind={kind} clickable={Boolean(onSelect)} />;
          }}
        />
        <Bar
          yAxisId="name"
          dataKey="earnings"
          fill="var(--data)"
          shape={RoundedEnd}
          isAnimationActive={animate}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Rounds only the end away from zero, whichever side of zero the bar is on. */
function RoundedEnd(props: BarShapeProps) {
  const { x, y, width, height, fill } = props;
  const left = Math.min(x, x + width);
  const earnings = (props.payload as EarningsItem | undefined)?.earnings ?? 0;
  const radius: [number, number, number, number] = earnings < 0 ? [4, 0, 0, 4] : [0, 4, 4, 0];
  return (
    <Rectangle x={left} y={y} width={Math.abs(width)} height={height} fill={fill} radius={radius} />
  );
}

function EarningsTooltip({
  item,
  kind,
  clickable,
}: {
  item: EarningsItem;
  kind: "studio" | "game";
  clickable: boolean;
}) {
  const rows: [string, string][] = [
    ["Player profit", formatSignedMoney(item.profitValue)],
    ["Wagered", formatMoney(item.wageredValue)],
    ["Bets", formatInteger(item.betCount)],
    ["RTP", item.rtp === null ? "—" : formatRtp(item.rtp)],
  ];
  return (
    <div className="max-w-64 rounded-lg border border-hairline bg-plate px-3 py-2 text-sm shadow-lg shadow-black/5">
      <div className="font-medium text-ink">{item.name}</div>
      <div className="mt-0.5 text-lg font-semibold text-ink tabular-nums">{formatMoney(item.earnings)}</div>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-ink-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-1 text-muted">
        {kind === "studio"
          ? `${item.games} ${item.games === 1 ? "game" : "games"}${clickable ? " · click to see them" : ""}`
          : `Snapshot ${formatDateTime(item.takenAt)}`}
      </div>
    </div>
  );
}

/** One-line tick label; Recharts' own tick text wraps long names onto two lines. */
function AxisLabel({
  x,
  y,
  anchor,
  className,
  title,
  children,
}: {
  x: number | string | undefined;
  y: number | string | undefined;
  anchor: "start" | "end";
  className: string;
  title?: string;
  children: string;
}) {
  return (
    <text
      x={Number(x) + (anchor === "end" ? -8 : 8)}
      y={Number(y)}
      dy="0.35em"
      textAnchor={anchor}
      fontSize={13}
      className={className}
    >
      {title && title !== children && <title>{title}</title>}
      {children}
    </text>
  );
}

function truncate(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name;
}
