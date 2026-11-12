"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { StudioOption } from "@/lib/manage-types";
import { SelectChevron } from "./ui";

/** Narrows the games list to one studio via ?studio=. */
export function StudioFilter({ studios, studioId }: { studios: StudioOption[]; studioId: number | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(studioId);

  return (
    <label className="flex min-w-56 flex-col gap-1.5 text-sm text-ink-2">
      Studio
      <span className="relative">
        <select
          value={selected ?? ""}
          onChange={(event) => {
            const next = event.target.value ? Number(event.target.value) : null;
            startTransition(() => {
              setSelected(next);
              router.replace(next === null ? "/games" : `/games?studio=${next}`, { scroll: false });
            });
          }}
          className="w-full appearance-none rounded-full border border-hairline bg-plate py-2 pr-10 pl-4 text-[0.95rem] font-medium text-ink transition-colors hover:border-axis"
        >
          <option value="">All studios</option>
          {studios.map((studio) => (
            <option key={studio.id} value={studio.id}>
              {studio.name}
            </option>
          ))}
        </select>
        <SelectChevron />
      </span>
    </label>
  );
}
