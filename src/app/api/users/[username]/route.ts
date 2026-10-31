import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await db.getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followers = await db.getFollowers(user.id);
    const following = await db.getFollowing(user.id);
    const friends = await db.getFriends(user.id);
    const presence = await db.getPresence(user.id);

    // Context from current viewer session
    const session = await getSessionFromRequest(req);
    let isFollowing = false;
    let areFriends = false;
    let mutualFriends: typeof friends = [];

    if (session) {
      isFollowing = await db.isFollowing(session.userId, user.id);
      areFriends = await db.areFriends(session.userId, user.id);
      if (session.userId !== user.id) {
        const viewerFriends = await db.getFriends(session.userId);
        const viewerFriendIds = new Set(viewerFriends.map((f) => f.id));
        mutualFriends = friends.filter((f) => viewerFriendIds.has(f.id));
      }
    }

    return NextResponse.json({
      user,
      presence,
      stats: {
        followersCount: followers.length,
        followingCount: following.length,
        friendsCount: friends.length,
        mutualFriendsCount: mutualFriends.length,
      },
      relationship: {
        isSelf: session?.userId === user.id,
        isFollowing,
        areFriends,
      },
      followers,
      following,
      mutualFriends,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
