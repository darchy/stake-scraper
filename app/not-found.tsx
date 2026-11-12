import Link from "next/link";
import { BUTTON } from "./_components/manage/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Not found</h1>
      <p className="mt-3 text-ink-2">
        This page doesn’t exist, or the studio or game it pointed to has been deleted.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/studios" className={BUTTON.primary}>
          Studios
        </Link>
        <Link href="/games" className={BUTTON.secondary}>
          Games
        </Link>
      </div>
    </main>
  );
}
