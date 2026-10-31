import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { realtimeHub } from "@/lib/realtime/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: messageId } = await params;
    const { emoji } = await req.json();

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const success = await db.addReaction(messageId, session.userId, emoji);

    // Broadcast reaction
    realtimeHub.broadcast("reaction_added", messageId, {
      messageId,
      userId: session.userId,
      emoji,
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json({ error: "Failed to process reaction" }, { status: 500 });
  }
}
