import { test } from "node:test";
import assert from "node:assert";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("devsphere-supreme-super-secret-key-32-chars-long!");

test("Authentication: Distinct password hashing & multi-tier role verification", async () => {
  const credentials = {
    supreme: "Supreme#Sovereign$2026!Key",
    admin: "Admin#Vault&9821*Shield",
    mod: "Mod#SafeGuard%4172!Trust",
    member: "Member#Sarah@2026!Code",
  };

  const hashes = {};
  for (const [role, pass] of Object.entries(credentials)) {
    hashes[role] = await bcrypt.hash(pass, 10);
  }

  // Verify that each role verifies against its own password
  for (const [role, pass] of Object.entries(credentials)) {
    const isValid = await bcrypt.compare(pass, hashes[role]);
    assert.strictEqual(isValid, true, `${role} password must verify successfully`);
  }

  // Cross-role verification must strictly fail (isolation test)
  assert.strictEqual(
    await bcrypt.compare(credentials.member, hashes.supreme),
    false,
    "Member password cannot authenticate as Supreme"
  );
  assert.strictEqual(
    await bcrypt.compare(credentials.admin, hashes.supreme),
    false,
    "Admin password cannot authenticate as Supreme"
  );
  assert.strictEqual(
    await bcrypt.compare(credentials.member, hashes.admin),
    false,
    "Member password cannot authenticate as Admin"
  );
});

test("Authentication: JWT session issuance and payload integrity", async () => {
  const session = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "supreme@devsphere.io",
    username: "supreme",
    platformRole: "SUPREME_OWNER",
    isSupreme: true,
    recentAuthTime: Date.now(),
  };

  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  assert.ok(typeof token === "string" && token.length > 20, "Token should be a non-empty string");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  assert.strictEqual(payload.username, "supreme");
  assert.strictEqual(payload.platformRole, "SUPREME_OWNER");
  assert.strictEqual(payload.isSupreme, true);
});

test("Authentication: Rejects tampered or signature-mismatched tokens", async () => {
  const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.tampered_signature";

  await assert.rejects(
    async () => {
      await jwtVerify(fakeToken, JWT_SECRET);
    },
    /signature/i,
    "Tampered token must be rejected"
  );
});
