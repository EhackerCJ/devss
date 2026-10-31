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
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
    }

    const conversation = await db.getOrCreateDirectConversation(session.userId, targetUserId);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Direct conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
