import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const notifications = await db.getNotifications(session.userId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { notificationId, markAll } = await req.json();

    if (markAll) {
      const all = await db.getNotifications(session.userId);
      for (const n of all) {
        await db.markNotificationRead(n.id);
      }
      return NextResponse.json({ success: true, message: "All notifications marked read" });
    }

    if (notificationId) {
      await db.markNotificationRead(notificationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
