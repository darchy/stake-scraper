# stake-scraper

A dashboard for stake.com game statistics. It reads studios, games, and periodic statistics snapshots from a PostgreSQL database on the local network and shows them as charts.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, and Tailwind CSS v4.

## Getting started

Put the database connection details in `.env.local`. This file is gitignored and must stay out of git.

Then install and run:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The machine running the app has to be able to reach the database server over the local network.

## Data model

- **studios**: studio name and stake.com follower count
- **games**: each game belongs to a studio and stores its stake.com slug and save count
- **game_statistics**: snapshots in time of a game's `day` / `week` / `month` / `all` metrics (`betCount`, `wageredValue`, `profitValue`, `rtp`), stored as JSON

See `CLAUDE.md` for field-level details and how to read the metrics.
