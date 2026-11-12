import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateStudio } from "@/lib/actions";
import { getStudio } from "@/lib/manage";
import { parseId } from "@/lib/manage-types";
import { StudioForm } from "../../../_components/manage/studio-form";
import { PageHeading, Panel, PanelSkeleton } from "../../../_components/manage/ui";

export const metadata: Metadata = { title: "Edit studio" };

export default function EditStudioPage({ params }: PageProps<"/studios/[id]/edit">) {
  return (
    <main>
      <PageHeading title="Edit studio" back={{ href: "/studios", label: "Studios" }} />
      <Suspense fallback={<PanelSkeleton height="h-72 max-w-xl" />}>
        <EditStudio params={params} />
      </Suspense>
    </main>
  );
}

async function EditStudio({ params }: Pick<PageProps<"/studios/[id]/edit">, "params">) {
  const id = parseId((await params).id);
  const studio = id === null ? null : await getStudio(id);
  if (!studio) notFound();

  return (
    <Panel className="max-w-xl">
      <StudioForm
        action={updateStudio.bind(null, studio.id)}
        initial={{ name: studio.name, followers: studio.followers }}
        submitLabel="Save changes"
      />
    </Panel>
  );
}
