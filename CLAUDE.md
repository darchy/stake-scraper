# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project purpose

A dashboard that reads game statistics scraped from stake.com out of a PostgreSQL database and shows them as charts. The scraping itself happens outside this app, which only reads from the database.

The database runs on the owner's Linux desktop server and is reachable only over their local network. Connection details live in `.env.local`, which is gitignored by the `.env*` rule. Never hard-code them or print them.

## Architecture

There is one route, `/`, a statistics dashboard driven by the URL: `?game=<games.id>` (left out means all games) and `?window=day|week|month|all` (left out means `day`).

- `app/page.tsx` renders the static header, plus a `<Suspense>` boundary around `Dashboard`. `Dashboard` awaits `searchParams` (runtime data, so it has to be inside Suspense under Cache Components), runs the queries, and passes plain data to the client.
- `lib/stats.ts` is server-only and holds the queries, cached with `"use cache"` + `cacheLife("minutes")`. `lib/db.ts` keeps one `pg` Pool on `globalThis` so hot reloads don't leak connections. `lib/stats-types.ts` holds the types, window constants and URL parsers; client code may import it.
- `app/_components/dashboard-view.tsx` is the client UI. Filter changes call `router.replace` inside `startTransition`, and `useOptimistic` highlights the new selection right away. While a change is loading, the previous charts stay on screen at reduced opacity rather than showing a skeleton.
- `metrics.ts` defines the four metrics (bets, wagered, player profit, RTP): their formatting, how the change since the previous snapshot is expressed, the reference line, and the chart shape. `metric-chart.tsx` draws each metric as its own Recharts chart. All four share `syncId` so the hover crosshair stays in sync across them. Never put two metrics on one chart with two y-axes; that's why they're separate small multiples.
- **All-games aggregation** (in `getStatsSeries`): snapshots are grouped into scrape runs by `date_trunc('minute', created_at)`. For each run, every game contributes its latest snapshot from the previous 36 hours, so a game that failed to scrape once doesn't make the total dip. RTP is recomputed from the sums, never averaged.
- **Dates** are formatted only after hydration (`useHydrated`), so the viewer's locale and time zone apply without hydration mismatches. Numbers use a fixed `en-US` locale and are safe to render on the server.
- **Theme**: CSS tokens in `app/globals.css` cover light, dark when the OS prefers it, and dark via `[data-theme=dark]`. Chart colours use these tokens too (`stroke="var(--data)"`). `app/theme-script.tsx` applies the saved choice from `localStorage` before first paint, and `theme-switch.tsx` offers Light, Match system and Dark.
- `app/error.tsx` catches database failures, such as the server being unreachable on the LAN, and offers a retry.

## Database schema

```
studios          id bigint PK, name varchar, created_at timestamptz, followers int?  -- followers on stake.com
games            id bigint PK, studio_id → studios.id, name varchar, created_at,
                 game_id text?  -- stake.com's own id; optional, unused
                 game_slug text -- the slug used in stake.com GraphQL queries
                 saves int?     -- number of saves on stake.com
game_statistics  id bigint PK, game_id → games.id (NOT games.game_id), created_at,
                 statistics_json jsonb
                 -- index (game_id, created_at desc)
```

`pg` returns `bigint` as a string, so cast in SQL (`::int`, `::float8`). The scraper runs about daily and writes every game of a run with the same `created_at`.

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
- **Studio earnings** aren't stored anywhere; they're calculated. They're `STUDIO_GGR_SHARE` (10%, in `lib/stats-types.ts`) of GGR, where GGR = stakes − winnings paid = `−profitValue`. The value goes negative when players win more than they stake. `getStatsSeries` returns it as `studioEarnings`, and it's the featured, full-width metric in the UI.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@12`; `pnpm-workspace.yaml` disables build scripts for `sharp` and `unrs-resolver`).

- `pnpm dev` — dev server on http://localhost:3000 (Turbopack). Also rewrites the Next.js block in `AGENTS.md`.
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- `pnpm exec tsc --noEmit` — type check (no script defined)

No test runner is configured. Verify UI changes in a browser. `next dev` refuses to start a second instance if one is already running for this directory. A long-running dev server has also been seen serving a stale Tailwind CSS chunk after `globals.css` changed. `pnpm build && pnpm start --port <n>` is the reliable check.

## Next.js version: 16.4 — check bundled docs first

Next 16.4 + React 19.3 postdate most training data. Version-matched docs live in `node_modules/next/dist/docs/` (`01-app/` for App Router: `01-getting-started`, `02-guides`, `03-api-reference`). Read the relevant page before using any Next API.

Non-default behavior enabled in `next.config.ts`:

- **`cacheComponents: true`** — the Cache Components caching model (`"use cache"` directive). Data is dynamic unless explicitly cached; the older `fetch`-cache / `revalidate` segment-config model does not apply. See `01-app/01-getting-started/08-caching.md`. Dynamic/URL-dependent data should sit behind `<Suspense>`.
- **`partialPrefetching: true`** — `<Link>` prefetches only the route's App Shell. See `01-app/02-guides/adopting-partial-prefetching.md`.
- **`experimental.agentFeedback: true`** — `next dev` maintains the feedback block in `AGENTS.md`; commit that file rather than stripping the block.
- **Tailwind via Turbopack loader** — Tailwind v4 is wired through a `turbopack.rules` entry using `@tailwindcss/turbopack`, not PostCSS (there is no `postcss.config`). Theme tokens are defined with `@theme inline` in `app/globals.css`.

## Git workflow

- **Create a new branch before making any change**, including docs-only changes. Never edit or commit directly on `main`.
- Name branches `feature/<relevant-name>`, with a short kebab-case description of the change. Examples: `feature/stats-dashboard`, `feature/studio-earnings`.
- Branch from an up-to-date `main` unless told otherwise.

## Conventions

- Path alias `@/*` maps to the repo root (no `src/` dir).
- Route component props use the globally generated helper types (e.g. `LayoutProps<"/">`, `PageProps<"/...">`) rather than hand-written prop interfaces.
