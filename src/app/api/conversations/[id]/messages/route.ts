import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { realtimeHub } from "@/lib/realtime/events";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000),
  replyToId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: conversationId } = await params;

    const messages = await db.getMessages({ conversationId, limit: 100 });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: conversationId } = await params;
    const body = await req.json();

    const result = messageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }

    const { content, replyToId } = result.data;

    const message = await db.createMessage({
      conversationId,
      senderId: session.userId,
      content,
      replyToId,
    });

    // Broadcast realtime event
    realtimeHub.broadcast("new_message", conversationId, message);

    return NextResponse.json(message);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
