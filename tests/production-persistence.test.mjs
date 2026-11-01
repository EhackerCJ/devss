import { test } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Temporary test store path
const TEST_DIR = path.join(process.cwd(), "data");
const TEST_STORE = path.join(TEST_DIR, "test-store.json");
process.env.DATA_DIR = TEST_DIR;

test("Production Persistence: New user signup, password hash persistence across restarts", async () => {
  // Clean up any test store before start
  if (fs.existsSync(TEST_STORE)) {
    fs.unlinkSync(TEST_STORE);
  }

  // Dynamically import DatabaseAdapter
  const { DatabaseAdapter } = await import("../src/lib/db/adapter.ts");
  const dbInstance1 = new DatabaseAdapter();

  // 1. Create a new user
  const email = "production_test_user@example.com";
  const username = "prod_tester_2026";
  const plainPassword = "SuperSecurePassword#2026!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const newUser = await dbInstance1.createUser({
    email,
    username,
    display_name: "Production Tester",
    password_hash: passwordHash,
    platform_role: "USER",
  });

  assert.ok(newUser.id, "User must have an ID");
  assert.strictEqual(newUser.email, email);

  // 2. Verify password hash is stored in memory
  const storedHash1 = await dbInstance1.getPasswordHash(newUser.id);
  assert.strictEqual(storedHash1, passwordHash, "Password hash must match immediately after creation");

  // 3. Simulate Server Restart / Cold Start by creating a brand-new DatabaseAdapter instance
  const dbInstance2 = new DatabaseAdapter();

  // 4. Verify user survives restart
  const reloadedUser = await dbInstance2.getUserById(newUser.id);
  assert.ok(reloadedUser, "User must still exist after server restart / reload");
  assert.strictEqual(reloadedUser.id, newUser.id);
  assert.strictEqual(reloadedUser.email, email);
  assert.strictEqual(reloadedUser.username, username);

  // 5. Verify user password hash survives restart and is NOT replaced by default seed password
  const storedHash2 = await dbInstance2.getPasswordHash(newUser.id);
  assert.ok(storedHash2, "Password hash must exist after restart");
  assert.strictEqual(storedHash2, passwordHash, "Password hash must NOT be replaced on restart");

  // 6. Verify authentication with correct password succeeds
  const isMatch = await bcrypt.compare(plainPassword, storedHash2);
  assert.strictEqual(isMatch, true, "Login with correct password must succeed after restart");

  // 7. Verify authentication with wrong password fails
  const isWrong = await bcrypt.compare("WrongPassword123!", storedHash2);
  assert.strictEqual(isWrong, false, "Login with wrong password must fail");

  // 8. Verify lookup by email and username
  const byEmail = await dbInstance2.getUserByEmail(email);
  assert.ok(byEmail, "getUserByEmail must find user after restart");
  const byUsername = await dbInstance2.getUserByUsername(username);
  assert.ok(byUsername, "getUserByUsername must find user after restart");

  // 9. Verify JWT Session generation and verification
  const JWT_SECRET = new TextEncoder().encode("devsphere-test-secret-key-32-chars-long!");
  const sessionToken = await new SignJWT({
    userId: newUser.id,
    email: newUser.email,
    username: newUser.username,
    platformRole: newUser.platform_role,
    isSupreme: false,
    recentAuthTime: Date.now(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
  assert.strictEqual(payload.userId, newUser.id);

  // 10. Verify /api/auth/me session check behavior
  const authMeUser = await dbInstance2.getUserById(payload.userId);
  assert.ok(authMeUser, "Session check (/api/auth/me) must find user after restart");
  assert.strictEqual(authMeUser.account_state, "active");
});
