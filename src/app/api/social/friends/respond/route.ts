import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
    }

    if (action === "accept") {
      const success = await db.acceptFriendRequest(requestId);
      return NextResponse.json({ success, action: "accepted" });
    } else if (action === "reject") {
      const success = await db.rejectFriendRequest(requestId);
      return NextResponse.json({ success, action: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Friend response error:", error);
    return NextResponse.json({ error: "Failed to respond to friend request" }, { status: 500 });
  }
}
