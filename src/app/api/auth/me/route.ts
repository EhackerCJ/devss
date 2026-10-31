import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const presence = await db.getPresence(user.id);
    const notifications = await db.getNotifications(user.id);
    const unreadNotifications = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      authenticated: true,
      user,
      presence,
      unreadNotifications,
      isSupreme: user.platform_role === "SUPREME_OWNER",
      isAdmin: user.platform_role === "PLATFORM_ADMIN" || user.platform_role === "SUPREME_OWNER",
      isModerator: ["PLATFORM_MODERATOR", "PLATFORM_ADMIN", "SUPREME_OWNER"].includes(user.platform_role),
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
