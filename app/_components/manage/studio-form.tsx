"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/manage-types";
import { BUTTON, describedBy, Field, FormMessage, INPUT } from "./ui";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial?: { name: string; followers: number | null };
  submitLabel: string;
};

export function StudioForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // After a failed save, show what was submitted rather than the original values.
  const value = (field: "name" | "followers") =>
    state.values?.[field] ?? (initial?.[field] != null ? String(initial[field]) : "");
  const followersHint = "Shown on the studio’s stake.com page.";

  return (
    <form action={formAction} className="grid max-w-xl gap-5 p-6 sm:p-8">
      <Field id="name" label="Name" error={state.errors?.name}>
        <input
          {...describedBy("name", state.errors?.name)}
          defaultValue={value("name")}
          required
          maxLength={255}
          autoComplete="off"
          className={INPUT}
        />
      </Field>

      <Field id="followers" label="Followers" optional hint={followersHint} error={state.errors?.followers}>
        <input
          {...describedBy("followers", state.errors?.followers, followersHint)}
          defaultValue={value("followers")}
          inputMode="numeric"
          autoComplete="off"
          className={`${INPUT} tabular-nums sm:max-w-48`}
        />
      </Field>

      <FormMessage message={state.message} />

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className={BUTTON.primary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/studios" className={BUTTON.secondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
