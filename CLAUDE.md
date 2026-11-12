# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

`stake-scraper` is currently an unmodified `create-next-app` scaffold (App Router, TypeScript, Tailwind v4). No scraping logic, data layer, or tests exist yet — `app/page.tsx` and `app/layout.tsx` are the template defaults.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@12`; `pnpm-workspace.yaml` disables build scripts for `sharp` and `unrs-resolver`).

- `pnpm dev` — dev server on http://localhost:3000 (Turbopack). Also rewrites the Next.js block in `AGENTS.md`.
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- `pnpm exec tsc --noEmit` — type check (no script defined)

No test runner is configured.

## Next.js version: 16.4 — check bundled docs first

Next 16.4 + React 19.3 postdate most training data. Version-matched docs live in `node_modules/next/dist/docs/` (`01-app/` for App Router: `01-getting-started`, `02-guides`, `03-api-reference`). Read the relevant page before using any Next API.

Non-default behavior enabled in `next.config.ts`:

- **`cacheComponents: true`** — the Cache Components caching model (`"use cache"` directive). Data is dynamic unless explicitly cached; the older `fetch`-cache / `revalidate` segment-config model does not apply. See `01-app/01-getting-started/08-caching.md`. Dynamic/URL-dependent data should sit behind `<Suspense>`.
- **`partialPrefetching: true`** — `<Link>` prefetches only the route's App Shell. See `01-app/02-guides/adopting-partial-prefetching.md`.
- **`experimental.agentFeedback: true`** — `next dev` maintains the feedback block in `AGENTS.md`; commit that file rather than stripping the block.
- **Tailwind via Turbopack loader** — Tailwind v4 is wired through a `turbopack.rules` entry using `@tailwindcss/turbopack`, not PostCSS (there is no `postcss.config`). Theme tokens are defined with `@theme inline` in `app/globals.css`.

## Conventions

- Path alias `@/*` maps to the repo root (no `src/` dir).
- Route component props use the globally generated helper types (e.g. `LayoutProps<"/">`, `PageProps<"/...">`) rather than hand-written prop interfaces.
