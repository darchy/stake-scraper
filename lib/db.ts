import "server-only";
import { Pool } from "pg";

// Reuse one pool across hot reloads in dev, so each edit doesn't open new connections.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env.local (see README.md).",
      );
    }
    globalForPg.pgPool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPg.pgPool;
}
