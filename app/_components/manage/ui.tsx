// Building blocks shared by the studio and game pages. No hooks, so both
// server and client components can use them.

import Link from "next/link";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4.5 py-2 text-sm font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-45";

export const BUTTON = {
  primary: `${BUTTON_BASE} bg-ink text-plate hover:opacity-85`,
  secondary: `${BUTTON_BASE} border border-hairline bg-plate text-ink hover:border-axis`,
  danger: `${BUTTON_BASE} bg-danger text-plate hover:opacity-85`,
} as const;

/** Small text link used in table rows. */
export const ROW_LINK = "rounded-md px-1.5 py-1 font-medium text-ink-2 transition-colors hover:text-ink";
export const ROW_LINK_DANGER = "rounded-md px-1.5 py-1 font-medium text-danger transition-opacity hover:opacity-75";

export function PageHeading({
  title,
  children,
  actions,
  back,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-8 pb-7 sm:pt-12">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> {back.label}
          </Link>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">{title}</h1>
        {children && <div className="mt-3 max-w-[60ch] text-ink-2">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}

/** Rounded surface that holds a table or a form. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-hairline bg-plate ${className}`}>{children}</div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-16 text-center text-ink-2">{children}</div>;
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that tie an input to its Field's error or hint text. */
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export const INPUT =
  "w-full rounded-xl border border-hairline bg-plate-sunk px-3.5 py-2.5 text-ink transition-colors placeholder:text-muted hover:border-axis aria-invalid:border-danger";

export function SelectChevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}

/** Message not tied to one field, such as a database error. */
export function FormMessage({ message }: { message?: string }) {
  return (
    <p aria-live="polite" className="text-sm text-danger empty:hidden">
      {message}
    </p>
  );
}

export const TH = "px-5 py-3 font-medium";
export const TD = "px-5 py-3";

export function PanelSkeleton({ height = "h-80" }: { height?: string }) {
  return <div aria-hidden className={`${height} animate-pulse rounded-3xl border border-hairline bg-plate`} />;
}
