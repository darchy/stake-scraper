"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/studios", label: "Studios" },
  { href: "/games", label: "Games" },
] as const;

/**
 * Site sections. usePathname suspends on routes with a dynamic [id] under
 * Cache Components, so the links render without a highlight until it resolves.
 */
export function NavLinks() {
  return (
    <Suspense fallback={<Links current={null} />}>
      <CurrentLinks />
    </Suspense>
  );
}

function CurrentLinks() {
  const pathname = usePathname();
  const current =
    LINKS.findLast((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
      ?.href ?? null;
  return <Links current={current} />;
}

function Links({ current }: { current: string | null }) {
  return (
    <nav aria-label="Sections" className="flex rounded-full border border-hairline bg-plate p-1">
      {LINKS.map((link) => {
        const active = link.href === current;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-full px-3.5 py-1.5 text-center text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "bg-ink text-plate" : "text-ink-2 hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
