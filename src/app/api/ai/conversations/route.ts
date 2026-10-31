import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const conversations = await db.getAIConversations(session.userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("AI conversations list error:", error);
    return NextResponse.json({ error: "Failed to fetch AI sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { title } = await req.json().catch(() => ({ title: "New Coding Session" }));

    const conv = await db.createAIConversation(session.userId, title || "New Coding Session");
    return NextResponse.json(conv);
  } catch (error) {
    console.error("AI conversation create error:", error);
    return NextResponse.json({ error: "Failed to create AI session" }, { status: 500 });
  }
}
