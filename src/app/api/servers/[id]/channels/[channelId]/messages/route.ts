import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { realtimeHub } from "@/lib/realtime/events";
import { callGeminiAssistant } from "@/lib/ai/gemini";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000),
  replyToId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    await requireAuth(req);
    const { channelId } = await params;

    const messages = await db.getMessages({ channelId, limit: 100 });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch channel messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: serverId, channelId } = await params;
    const body = await req.json();

    const result = messageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    const { content, replyToId } = result.data;

    // Verify membership
    const members = await db.getServerMembers(serverId);
    const isMember = members.some((m: any) => m.user_id === session.userId);
    if (!isMember) {
      return NextResponse.json({ error: "You must be a member of this server to post messages." }, { status: 403 });
    }

    const message = await db.createMessage({
      channelId,
      senderId: session.userId,
      content,
      replyToId,
    });

    // Realtime broadcast to channel
    realtimeHub.broadcast("new_message", channelId, message);

    // If @AI is mentioned in the channel, trigger live Gemini AI assistant response
    if (content.toLowerCase().includes("@ai")) {
      setTimeout(async () => {
        try {
          const aiPrompt = content.replace(/@ai/gi, "").trim();
          const { text: responseText } = await callGeminiAssistant(aiPrompt);

          // Post as system/AI bot message
          const aiMessage = await db.createMessage({
            channelId,
            senderId: "00000000-0000-0000-0000-000000000001", // Bot/Supreme fixture
            content: `@${session.username}\n\n${responseText}`,
            replyToId: message.id,
          });

          realtimeHub.broadcast("new_message", channelId, aiMessage);
        } catch (e) {
          console.error("AI automated reply error", e);
        }
      }, 300);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Send channel message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
