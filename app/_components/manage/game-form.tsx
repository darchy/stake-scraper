"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState, StudioOption } from "@/lib/manage-types";
import { BUTTON, describedBy, Field, FormMessage, INPUT, SelectChevron } from "./ui";

type GameValues = {
  name: string;
  studioId: number | null;
  gameSlug: string;
  stakeId: string | null;
  saves: number | null;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  studios: StudioOption[];
  initial: GameValues;
  submitLabel: string;
  cancelHref: string;
};

const HINTS = {
  gameSlug: "The slug stake.com uses for this game; the scraper queries by it.",
  stakeId: "stake.com’s internal id. Not used by the dashboard.",
  saves: "Number of saves on stake.com.",
};

export function GameForm({ action, studios, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // After a failed save, show what was submitted rather than the original values.
  const value = (field: keyof GameValues) =>
    state.values?.[field] ?? (initial[field] != null ? String(initial[field]) : "");
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid max-w-xl gap-5 p-6 sm:p-8">
      <Field id="name" label="Name" error={errors.name}>
        <input
          {...describedBy("name", errors.name)}
          defaultValue={value("name")}
          required
          maxLength={255}
          autoComplete="off"
          className={INPUT}
        />
      </Field>

      <Field id="studioId" label="Studio" error={errors.studioId}>
        <span className="relative">
          <select
            {...describedBy("studioId", errors.studioId)}
            defaultValue={value("studioId")}
            required
            className={`${INPUT} appearance-none pr-10`}
          >
            <option value="" disabled>
              Choose a studio…
            </option>
            {studios.map((studio) => (
              <option key={studio.id} value={studio.id}>
                {studio.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </span>
      </Field>

      <Field id="gameSlug" label="Slug" hint={HINTS.gameSlug} error={errors.gameSlug}>
        <input
          {...describedBy("gameSlug", errors.gameSlug, HINTS.gameSlug)}
          defaultValue={value("gameSlug")}
          required
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          className={`${INPUT} font-mono text-[0.9rem]`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="stakeId" label="stake.com id" optional hint={HINTS.stakeId} error={errors.stakeId}>
          <input
            {...describedBy("stakeId", errors.stakeId, HINTS.stakeId)}
            defaultValue={value("stakeId")}
            maxLength={255}
            autoComplete="off"
            spellCheck={false}
            className={`${INPUT} font-mono text-[0.9rem]`}
          />
        </Field>

        <Field id="saves" label="Saves" optional hint={HINTS.saves} error={errors.saves}>
          <input
            {...describedBy("saves", errors.saves, HINTS.saves)}
            defaultValue={value("saves")}
            inputMode="numeric"
            autoComplete="off"
            className={`${INPUT} tabular-nums`}
          />
        </Field>
      </div>

      <FormMessage message={state.message} />

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className={BUTTON.primary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className={BUTTON.secondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
