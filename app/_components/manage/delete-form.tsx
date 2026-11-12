"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/lib/manage-types";
import { BUTTON, describedBy, Field, FormMessage, INPUT } from "./ui";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** What must be typed to enable the button. */
  name: string;
  submitLabel: string;
  cancelHref: string;
};

/** Delete only after the exact name is typed. The server checks it again. */
export function DeleteForm({ action, name, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name.trim();
  const label = `Type “${name}” to confirm`;

  return (
    <form action={formAction} className="grid max-w-xl gap-5 p-6 sm:p-8">
      <Field id="confirm" label={label} error={state.errors?.confirm}>
        <input
          {...describedBy("confirm", state.errors?.confirm)}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={INPUT}
        />
      </Field>

      <FormMessage message={state.message} />

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={!matches || pending} className={BUTTON.danger}>
          {pending ? "Deleting…" : submitLabel}
        </button>
        <Link href={cancelHref} className={BUTTON.secondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
