"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Couldn&apos;t reach the database</h1>
      <p className="mt-3 text-ink-2">
        The database didn&apos;t answer. Check that the server is on and reachable from this machine,
        and that <code className="rounded bg-plate-sunk px-1.5 py-0.5 text-[0.9em]">DATABASE_URL</code>{" "}
        in <code className="rounded bg-plate-sunk px-1.5 py-0.5 text-[0.9em]">.env.local</code> is correct.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 self-start rounded-full bg-ink px-5 py-2.5 font-medium text-plate transition-opacity hover:opacity-85"
      >
        Try again
      </button>
    </main>
  );
}
