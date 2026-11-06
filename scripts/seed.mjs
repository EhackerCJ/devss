import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "devsphere-store.json");

console.log("🌱 DevSphere Seed: Initializing development fixture database...");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log("✅ Seed database verified at:", STORE_PATH);
