import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json({ error: "You cannot add yourself as a friend" }, { status: 400 });
    }

    const success = await db.sendFriendRequest(session.userId, targetUserId);
    return NextResponse.json({ success, message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
