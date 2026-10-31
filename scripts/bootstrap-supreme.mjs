import fs from "fs";
import path from "path";

const targetEmail = process.argv[2] || process.env.SUPREME_OWNER_EMAIL;

if (!targetEmail) {
  console.error("❌ Usage: node scripts/bootstrap-supreme.mjs <user-email>");
  process.exit(1);
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "devsphere-store.json");

if (!fs.existsSync(STORE_PATH)) {
  console.error("❌ Database store not found at:", STORE_PATH);
  console.log("Run the app or npm run seed first.");
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  const user = data.profiles.find((p) => p.email.toLowerCase() === targetEmail.toLowerCase());

  if (!user) {
    console.error(`❌ User with email "${targetEmail}" was not found in the database.`);
    process.exit(1);
  }

  // Demote previous Supreme Owner if any
  for (const p of data.profiles) {
    if (p.platform_role === "SUPREME_OWNER" && p.id !== user.id) {
      p.platform_role = "PLATFORM_ADMIN";
    }
  }

  user.platform_role = "SUPREME_OWNER";
  user.is_verified = true;
  user.premium_tier = "supreme_dev";

  // Log in audit trail
  data.audit_logs.push({
    id: "bootstrap-" + Date.now(),
    actor_id: "SYSTEM_CLI",
    actor_name: "CLI Bootstrap",
    action: "SUPREME_OWNER_BOOTSTRAP",
    target_id: user.id,
    target_name: user.username,
    reason: "Assigned via scripts/bootstrap-supreme.mjs",
    created_at: new Date().toISOString(),
  });

  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");

  console.log(`👑 SUCCESS: User "${user.username}" (${user.email}) is now the platform SUPREME OWNER!`);
} catch (e) {
  console.error("Failed to bootstrap supreme owner:", e);
  process.exit(1);
}
