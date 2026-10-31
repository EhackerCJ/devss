import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "devsphere-store.json");

console.log("🌱 DevSphere Seed: Initializing development fixture database...");

export const SEED_PASSWORDS = {
  supreme: "Supreme#Sovereign$2026!Key",
  admin: "Admin#Vault&9821*Shield",
  mod: "Mod#SafeGuard%4172!Trust",
  support: "Support#Desk&6319@Assist",
  pro: "DevPro#Coding$7824!Nova",
  sarah: "Member#Sarah@2026!Code",
  jordan: "Member#Jordan@2026!Dev",
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log("✅ Seed database verified at:", STORE_PATH);
console.log(`👑 Supreme Owner: supreme@devsphere.io (Password: ${SEED_PASSWORDS.supreme})`);
console.log(`🛡️ Platform Admin: admin@devsphere.io (Password: ${SEED_PASSWORDS.admin})`);
console.log(`⚖️ Platform Mod:   mod@devsphere.io (Password: ${SEED_PASSWORDS.mod})`);
console.log(`🎧 Support Desk:  support@devsphere.io (Password: ${SEED_PASSWORDS.support})`);
console.log(`✨ Pro Developer:  pro@devsphere.io (Password: ${SEED_PASSWORDS.pro})`);
console.log(`👤 Member Sarah:   member@devsphere.io (Password: ${SEED_PASSWORDS.sarah})`);
console.log(`👤 Member Jordan:  jordan@devsphere.io (Password: ${SEED_PASSWORDS.jordan})`);
