import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.log("ℹ️  No DATABASE_URL provided. Skipping remote PostgreSQL migrations.");
  console.log("👉 Set DATABASE_URL to your Supabase/PostgreSQL connection string to run migrations.");
  process.exit(0);
}

console.log("🚀 DevSphere PostgreSQL Auto-Migrator: Connecting to database...");

const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("db:5432");

const client = new Client({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

async function runMigrations() {
  try {
    await client.connect();
    console.log("✅ Database connection established.");

    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const migrationFiles = [
      "00001_initial_schema.sql",
      "00002_rls_policies.sql",
      "00003_seed_data.sql",
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Migration file not found: ${filePath}`);
        continue;
      }

      console.log(`⏳ Applying migration: ${file}...`);
      const sql = fs.readFileSync(filePath, "utf-8");
      await client.query(sql);
      console.log(`✅ Completed: ${file}`);
    }

    // Verify table count
    const res = await client.query(`
      SELECT count(*) AS total_tables 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log(`🎉 Migrations complete! Total public tables in database: ${res.rows[0].total_tables}`);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
