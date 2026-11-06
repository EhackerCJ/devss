import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

const demoAccounts = [
  {
    email: "supreme@devsphere.io",
    username: "supreme",
    role: "SUPREME_OWNER",
    passwordVariable: "SUPREME_DEMO_PASSWORD",
  },
  {
    email: "admin@devsphere.io",
    username: "alex_admin",
    role: "PLATFORM_ADMIN",
    passwordVariable: "ADMIN_DEMO_PASSWORD",
  },
  {
    email: "mod@devsphere.io",
    username: "mira_mod",
    role: "PLATFORM_MODERATOR",
    passwordVariable: "MODERATOR_DEMO_PASSWORD",
  },
  {
    email: "support@devsphere.io",
    username: "sam_support",
    role: "SUPPORT",
    passwordVariable: "SUPPORT_DEMO_PASSWORD",
  },
  {
    email: "pro@devsphere.io",
    username: "dev_pro",
    role: "PREMIUM_USER",
    passwordVariable: "PRO_DEMO_PASSWORD",
  },
  {
    email: "member@devsphere.io",
    username: "sarah_coder",
    role: "USER",
    passwordVariable: "MEMBER_DEMO_PASSWORD",
  },
  {
    email: "jordan@devsphere.io",
    username: "jordan_dev",
    role: "USER",
    passwordVariable: "JORDAN_DEMO_PASSWORD",
  },
];

function getRequiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

if (!connectionString) {
  throw new Error(
    "Missing PostgreSQL connection string. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL."
  );
}

const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("db:5432");

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

async function resetDemoPasswords() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const account of demoAccounts) {
      const password = getRequiredEnvironment(account.passwordVariable);
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await client.query(
        `UPDATE profiles
         SET password_hash = $1, updated_at = NOW()
         WHERE LOWER(email) = LOWER($2)
           AND LOWER(username) = LOWER($3)
           AND platform_role = $4`,
        [passwordHash, account.email, account.username, account.role]
      );

      if (result.rowCount !== 1) {
        throw new Error(
          `Expected exactly one matching account for ${account.email}; found ${result.rowCount ?? 0}.`
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Reset passwords for ${demoAccounts.length} demo accounts.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

try {
  await resetDemoPasswords();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Demo password reset failed.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
