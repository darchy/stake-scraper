import type { Metadata } from "next";
import { Suspense } from "react";
import { getStudioOptions } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { getEarningsBreakdown } from "@/lib/stats";
import { EarningsView } from "../_components/earnings-view";

export const metadata: Metadata = { title: "Earnings" };

export default function EarningsPage({ searchParams }: PageProps<"/earnings">) {
  return (
    <main>
      <Suspense fallback={<EarningsSkeleton />}>
        <Earnings searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Earnings({ searchParams }: Pick<PageProps<"/earnings">, "searchParams">) {
  const requested = parseId((await searchParams).studio);
  const studios = await getStudioOptions();
  // An unknown ?studio= falls back to all studios rather than an empty page.
  const studioId = studios.some((studio) => studio.id === requested) ? requested : null;
  const breakdown = await getEarningsBreakdown(studioId);

  return <EarningsView studios={studios} studioId={studioId} breakdown={breakdown} />;
}

function EarningsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="space-y-3 pt-8 pb-7 sm:pt-12">
        <div className="h-12 w-72 rounded-xl bg-hairline" />
        <div className="h-5 w-full max-w-xl rounded-lg bg-hairline" />
      </div>
      <div className="mb-5 h-16 w-72 rounded-2xl bg-hairline" />
      <div className="h-[32rem] rounded-3xl border border-hairline bg-plate" />
    </div>
  );
}
