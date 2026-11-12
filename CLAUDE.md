# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project purpose

A dashboard that reads game statistics scraped from stake.com out of a PostgreSQL database and shows them as charts. The scraping itself happens outside this app, which only reads from the database.

The database runs on the owner's Linux desktop server and is reachable only over their local network. Connection details live in `.env.local`, which is gitignored by the `.env*` rule. Never hard-code them or print them.

## Project state

Still the unmodified `create-next-app` scaffold (App Router, TypeScript, Tailwind v4): `app/page.tsx` and `app/layout.tsx` are template defaults. There's no database client, data layer, charting library or test setup yet.

## Database schema

```
studios          id PK, name, created_at, followers      -- followers on stake.com
games            id PK, studio_id → studios.id, name, created_at,
                 game_id   -- stake.com's own id; optional, likely unused
                 game_slug -- the slug used in stake.com GraphQL queries
                 saves     -- number of saves on stake.com
game_statistics  id PK, game_id → games.id (NOT games.game_id), created_at,
                 statistics_json
```

`statistics_json` holds a snapshot of four rolling windows, `day`, `week`, `month` and `all`, each with the same metrics:

```json
{ "day": { "betCount": 19095, "wageredValue": 25745.33, "profitValue": -1864.74, "rtp": 0.9276 },
  "week": { ... }, "month": { ... }, "all": { ... } }
```

How to read it:

- Each `game_statistics` row is one point-in-time snapshot, and `created_at` is when it was scraped. Trends over time come from comparing snapshots, not from one row.
- `profitValue` is from the player's side: `profitValue ≈ wageredValue × (rtp − 1)`. A negative value means players lost money, so the house or studio won.
- `rtp` is a ratio (0.93 = 93%) and is very noisy when `betCount` is small. When combining several games, weight by wagered amount (`Σ(wagered + profit) / Σ wagered`) rather than averaging the per-game RTPs.
- The windows can disagree slightly. In the sample above, `all` has *fewer* bets than `week`/`month`, so don't assume `all ≥ month ≥ week ≥ day`.
- The currency of `wageredValue`/`profitValue` hasn't been confirmed.

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
