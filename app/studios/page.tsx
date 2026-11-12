import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listStudios } from "@/lib/manage";
import { StudiosTable } from "../_components/manage/studios-table";
import { BUTTON, EmptyState, PageHeading, Panel, PanelSkeleton } from "../_components/manage/ui";

export const metadata: Metadata = { title: "Studios" };

export default function StudiosPage() {
  return (
    <main>
      <PageHeading
        title="Studios"
        actions={
          <Link href="/studios/new" className={BUTTON.primary}>
            Add studio
          </Link>
        }
      >
        Studios publish the games the scraper follows. Deleting a studio also deletes its games and
        their statistics.
      </PageHeading>
      <Suspense fallback={<PanelSkeleton />}>
        <Studios />
      </Suspense>
    </main>
  );
}

async function Studios() {
  // Render per request, so the build never needs the database (it's only on the LAN).
  await connection();
  const studios = await listStudios();
  return (
    <Panel>
      {studios.length === 0 ? (
        <EmptyState>
          No studios yet.{" "}
          <Link href="/studios/new" className="font-medium text-data hover:underline">
            Add the first one
          </Link>
          .
        </EmptyState>
      ) : (
        <StudiosTable studios={studios} />
      )}
    </Panel>
  );
}
