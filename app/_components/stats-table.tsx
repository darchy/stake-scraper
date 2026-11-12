"use client";

import { formatDateTime } from "@/lib/format";
import type { StatsPoint } from "@/lib/stats-types";
import { METRICS } from "./metrics";

/** The same numbers as the charts, newest snapshot first. */
export function StatsTable({ data, showGameCount }: { data: StatsPoint[]; showGameCount: boolean }) {
  const rows = [...data].reverse();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-ink-2">
            <th scope="col" className="px-5 py-3 font-medium">
              Snapshot
            </th>
            {showGameCount && (
              <th scope="col" className="px-5 py-3 text-right font-medium">
                Games
              </th>
            )}
            {METRICS.map((metric) => (
              <th key={metric.key} scope="col" className="px-5 py-3 text-right font-medium">
                {metric.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((point) => (
            <tr key={point.takenAt} className="border-b border-hairline last:border-0 hover:bg-plate-sunk">
              <th scope="row" className="px-5 py-3 text-left font-normal whitespace-nowrap text-ink-2">
                {formatDateTime(point.takenAt)}
              </th>
              {showGameCount && <td className="px-5 py-3 text-right">{point.games}</td>}
              {METRICS.map((metric) => {
                const value = point[metric.key];
                return (
                  <td key={metric.key} className="px-5 py-3 text-right">
                    {value === null ? "—" : metric.format(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
