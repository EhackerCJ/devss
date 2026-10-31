import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AuthSession, PlatformRole } from "@/types";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "devsphere-supreme-super-secret-key-32-chars-long!";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
export const COOKIE_NAME = "devsphere_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<AuthSession | null> {
  // Check cookie first
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) return session;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7);
    return await verifySessionToken(bearerToken);
  }

  return null;
}

export async function requireAuth(req: NextRequest): Promise<AuthSession> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  // Verify account is not suspended or banned
  const user = await db.getUserById(session.userId);
  if (!user || user.account_state === "banned" || user.account_state === "suspended") {
    throw new Error("FORBIDDEN_ACCOUNT_RESTRICTED");
  }

  return session;
}

export async function requireSupreme(req: NextRequest, requireRecentAuth = false): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (session.platformRole !== "SUPREME_OWNER") {
    throw new Error("FORBIDDEN_SUPREME_ONLY");
  }

  if (requireRecentAuth) {
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - session.recentAuthTime > fifteenMinutes) {
      throw new Error("REAUTH_REQUIRED");
    }
  }

  return session;
}

export async function requireAdmin(req: NextRequest): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (session.platformRole !== "SUPREME_OWNER" && session.platformRole !== "PLATFORM_ADMIN") {
    throw new Error("FORBIDDEN_ADMIN_ONLY");
  }
  return session;
}

export async function requireModerator(req: NextRequest): Promise<AuthSession> {
  const session = await requireAuth(req);
  const allowed: PlatformRole[] = ["SUPREME_OWNER", "PLATFORM_ADMIN", "PLATFORM_MODERATOR"];
  if (!allowed.includes(session.platformRole)) {
    throw new Error("FORBIDDEN_MOD_ONLY");
  }
  return session;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
