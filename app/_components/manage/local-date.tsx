"use client";

import { formatDateTime } from "@/lib/format";
import { useHydrated } from "../use-client-env";

/** A date in the viewer's locale and time zone, shown only after hydration. */
export function LocalDate({ ms }: { ms: number | null }) {
  const hydrated = useHydrated();
  if (ms === null) return <span className="text-muted">—</span>;
  return (
    <time dateTime={new Date(ms).toISOString()} className="whitespace-nowrap">
      {hydrated ? formatDateTime(ms) : " "}
    </time>
  );
}
