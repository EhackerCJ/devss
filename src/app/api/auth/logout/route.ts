import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, clearSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (session) {
      await db.setPresence(session.userId, "offline");
    }

    const res = NextResponse.json({ success: true, message: "Logged out successfully" });
    clearSessionCookie(res);
    return res;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
