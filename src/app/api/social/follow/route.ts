import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await db.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const success = await db.follow(session.userId, targetUserId);

    if (success) {
      const currentUser = await db.getUserById(session.userId);
      await db.createNotification({
        user_id: targetUserId,
        actor_id: session.userId,
        type: "follow",
        title: "New Follower",
        content: `${currentUser?.display_name || currentUser?.username} started following you.`,
        link_url: `/profile/${currentUser?.username}`,
      });
    }

    return NextResponse.json({ success, isFollowing: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Follow action failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    const success = await db.unfollow(session.userId, targetUserId);
    return NextResponse.json({ success, isFollowing: false });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Unfollow action failed" }, { status: 500 });
  }
}
