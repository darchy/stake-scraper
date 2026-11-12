# stake-scraper

A dashboard for stake.com game statistics. It reads studios, games, and periodic statistics snapshots from a PostgreSQL database on the local network and shows them as charts.

The landing page charts bets, amount wagered, player profit and return to player (RTP) over time, for all games together or for one game. You can switch between the day, week, month and all-time windows, flip to a table view, and choose a light, dark or system theme.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, Recharts and node-postgres.

## Getting started

Put the database connection details in `.env.local`. This file is gitignored and must stay out of git.

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
```

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
