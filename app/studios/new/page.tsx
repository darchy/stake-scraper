import type { Metadata } from "next";
import { createStudio } from "@/lib/actions";
import { StudioForm } from "../../_components/manage/studio-form";
import { PageHeading, Panel } from "../../_components/manage/ui";

export const metadata: Metadata = { title: "Add studio" };

export default function NewStudioPage() {
  return (
    <main>
      <PageHeading title="Add studio" back={{ href: "/studios", label: "Studios" }} />
      <Panel className="max-w-xl">
        <StudioForm action={createStudio} submitLabel="Add studio" />
      </Panel>
    </main>
  );
}
