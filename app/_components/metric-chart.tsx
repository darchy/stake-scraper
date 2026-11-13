"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateTime, formatDay } from "@/lib/format";
import type { StatsPoint } from "@/lib/stats-types";
import type { Metric } from "./metrics";
import { niceScale } from "./scale";

const CHART_HEIGHT = 216;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Above this many points, markers would crowd the line; show them on hover only. */
const MAX_POINTS_WITH_MARKERS = 40;

type Props = {
  metric: Metric;
  data: StatsPoint[];
  /** Position in the grid, used to stagger the draw-in animation. */
  index: number;
  animate: boolean;
  showGameCount: boolean;
};

export function MetricChart({ metric, data, index, animate, showGameCount }: Props) {
  const gradientId = `fill-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { domain, ticks, tickFormatter } = timeAxis(data);
  const y = yScale(metric, data);
  const showMarkers = data.length <= MAX_POINTS_WITH_MARKERS;

  const animation = {
    isAnimationActive: animate,
    animationBegin: index * 120,
    animationDuration: 900,
    animationEasing: "ease-out" as const,
  };
  const marker = showMarkers
    ? { r: 3.5, fill: "var(--data)", stroke: "var(--plate)", strokeWidth: 2 }
    : false;
  const activeMarker = { r: 5, fill: "var(--data)", stroke: "var(--plate)", strokeWidth: 2 };

  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--grid)" />
      <XAxis
        dataKey="takenAt"
        type="number"
        scale="time"
        domain={domain}
        ticks={ticks}
        tickFormatter={tickFormatter}
        tick={{ fill: "var(--muted)", fontSize: 12 }}
        tickLine={false}
        axisLine={{ stroke: "var(--axis)" }}
        tickMargin={8}
        minTickGap={24}
      />
      <YAxis
        width={56}
        domain={y.domain}
        ticks={y.ticks}
        interval={0}
        tickFormatter={metric.formatAxis}
        tick={{ fill: "var(--muted)", fontSize: 12 }}
        tickLine={false}
        axisLine={false}
      />
      {metric.reference && (
        <ReferenceLine
          y={metric.reference.value}
          stroke="var(--axis)"
          strokeWidth={1}
          label={{
            value: metric.reference.label,
            // Above the line, unless the line is the top edge and the label would be clipped.
            position: metric.reference.value >= y.domain[1] ? "insideTopLeft" : "insideBottomLeft",
            fill: "var(--muted)",
            fontSize: 11,
          }}
        />
      )}
      <Tooltip
        cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
        isAnimationActive={false}
        content={({ active, payload }) => {
          const point = payload?.[0]?.payload as StatsPoint | undefined;
          if (!active || !point) return null;
          const value = point[metric.key];
          return (
            <div className="rounded-lg border border-hairline bg-plate px-3 py-2 text-sm shadow-lg shadow-black/5">
              <div className="text-muted">{formatDateTime(point.takenAt)}</div>
              <div className="mt-0.5 font-semibold text-ink tabular-nums">
                {value === null ? "No data" : metric.format(value)}
              </div>
              {showGameCount && (
                <div className="text-muted">
                  {point.games} {point.games === 1 ? "game" : "games"}
                </div>
              )}
            </div>
          );
        }}
      />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      {metric.shape === "area" ? (
        <AreaChart data={data} syncId="stats" syncMethod="value" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--data-wash)" />
              <stop offset="100%" stopColor="var(--data-wash)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {common}
          <Area
            type="monotone"
            dataKey={metric.key}
            stroke="var(--data)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            baseValue={0}
            dot={marker}
            activeDot={activeMarker}
            {...animation}
          />
        </AreaChart>
      ) : (
        <LineChart data={data} syncId="stats" syncMethod="value" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {common}
          <Line
            type="monotone"
            dataKey={metric.key}
            stroke="var(--data)"
            strokeWidth={2}
            dot={marker}
            activeDot={activeMarker}
            connectNulls
            {...animation}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

/** Real-time x axis with at most ~6 ticks placed on actual snapshots. */
function timeAxis(data: StatsPoint[]) {
  const first = data[0]?.takenAt ?? 0;
  const last = data[data.length - 1]?.takenAt ?? 0;
  const span = last - first;
  // A single snapshot has no width; give it half a day either side.
  const domain: [number, number] = span === 0 ? [first - DAY_MS / 2, last + DAY_MS / 2] : [first, last];

  const step = Math.max(1, Math.ceil(data.length / 6));
  const ticks = data.filter((_, i) => i % step === 0 || i === data.length - 1).map((p) => p.takenAt);

  // Within a couple of days, dates alone would repeat; include the time.
  const tickFormatter = span < 2 * DAY_MS ? formatDateTime : formatDay;
  return { domain, ticks, tickFormatter };
}

/**
 * Y scale on round numbers. Magnitudes start at zero; metrics with a reference
 * line (zero profit, 100% RTP) always keep that line in view.
 */
function yScale(metric: Metric, data: StatsPoint[]) {
  const values = data.map((p) => p[metric.key]).filter((v): v is number => v !== null);
  const anchor = metric.reference?.value ?? 0;
  let min = Math.min(anchor, ...values);
  let max = Math.max(anchor, ...values);
  if (metric.key === "rtp") {
    // Ratios hover around 1; leave a little air so the line isn't glued to the edge.
    min -= 0.01;
    max += 0.01;
  }
  return niceScale(min, max);
}
