import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password is required for re-authentication" }, { status: 400 });
    }

    const hash = await db.getPasswordHash(session.userId);
    if (!hash) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, hash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password. Re-authentication rejected." }, { status: 401 });
    }

    // Refresh token with new recentAuthTime
    const updatedToken = await createSessionToken({
      ...session,
      recentAuthTime: Date.now(),
    });

    const res = NextResponse.json({
      success: true,
      message: "Re-authentication verified. Access granted to high-security controls.",
      recentAuthTime: Date.now(),
    });

    setSessionCookie(res, updatedToken);
    return res;
  } catch (error) {
    console.error("Re-auth Error:", error);
    return NextResponse.json({ error: "Re-authentication failed" }, { status: 500 });
  }
}
