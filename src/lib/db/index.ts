import { db as fileDb, DatabaseAdapter } from "./adapter";
import { PostgresAdapter } from "./postgres-adapter";

const hasPostgres = !!(
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DB_URL
);

// Global singleton instance:
// In production on Vercel or cloud with PostgreSQL, use PostgresAdapter.
// In local development or standalone container without PostgreSQL, use fileDb.
export const db: DatabaseAdapter | PostgresAdapter = hasPostgres
  ? new PostgresAdapter()
  : fileDb;

export * from "./types";
export { DatabaseAdapter, PostgresAdapter };
