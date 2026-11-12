import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "./_components/nav-links";
import { ThemeSwitch } from "./_components/theme-switch";
import { ThemeScript } from "./theme-script";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Game stats", template: "%s · Game stats" },
  description: "Bets, wagers, player profit and RTP over time for games on stake.com.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full">
        <div className="halo min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
            <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
              <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
                <svg viewBox="0 0 24 24" className="size-6 text-data" aria-hidden fill="currentColor">
                  <rect x="3" y="12" width="4" height="9" rx="1.5" />
                  <rect x="10" y="7" width="4" height="14" rx="1.5" />
                  <rect x="17" y="3" width="4" height="18" rx="1.5" />
                </svg>
                <span className="text-lg font-semibold tracking-tight">Game stats</span>
                <span className="hidden text-muted lg:inline">from stake.com</span>
              </Link>
              {/* On phones the sections take their own full-width row. */}
              <div className="order-last w-full sm:order-none sm:mr-auto sm:w-auto">
                <NavLinks />
              </div>
              <ThemeSwitch />
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
