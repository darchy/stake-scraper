import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteStudio } from "@/lib/actions";
import { formatInteger } from "@/lib/format";
import { getStudio } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { DeleteForm } from "../../../_components/manage/delete-form";
import { PageHeading, Panel, PanelSkeleton } from "../../../_components/manage/ui";

export const metadata: Metadata = { title: "Delete studio" };

export default function DeleteStudioPage({ params }: PageProps<"/studios/[id]/delete">) {
  return (
    <main>
      <PageHeading title="Delete studio" back={{ href: "/studios", label: "Studios" }} />
      <Suspense fallback={<PanelSkeleton height="h-72 max-w-xl" />}>
        <DeleteStudio params={params} />
      </Suspense>
    </main>
  );
}

async function DeleteStudio({ params }: Pick<PageProps<"/studios/[id]/delete">, "params">) {
  const id = parseId((await params).id);
  const studio = id === null ? null : await getStudio(id);
  if (!studio) notFound();

  return (
    <Panel className="max-w-xl">
      <div className="border-b border-hairline px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
        <p className="text-ink">
          This permanently deletes <strong className="font-semibold">{studio.name}</strong>
          {studio.gameCount === 0 ? ". It has no games." : " and everything under it:"}
        </p>
        {studio.gameCount > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-2 tabular-nums">
            <li>
              {formatInteger(studio.gameCount)} {studio.gameCount === 1 ? "game" : "games"}
            </li>
            <li>
              {formatInteger(studio.snapshotCount)} statistics{" "}
              {studio.snapshotCount === 1 ? "snapshot" : "snapshots"}
            </li>
          </ul>
        )}
        <p className="mt-3 text-sm text-muted">This can’t be undone.</p>
      </div>
      <DeleteForm
        action={deleteStudio.bind(null, studio.id)}
        name={studio.name}
        submitLabel="Delete studio"
        cancelHref="/studios"
      />
    </Panel>
  );
}
