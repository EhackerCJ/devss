import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { callGeminiAssistant } from "@/lib/ai/gemini";
import { z } from "zod";

const promptSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id: conversationId } = await params;
    const messages = await db.getAIMessages(conversationId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("AI messages fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch AI messages" }, { status: 500 });
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

    const result = promptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid prompt format" }, { status: 400 });
    }

    const { prompt } = result.data;

    // Check feature flag
    const flags = await db.getFeatureFlags();
    const aiFlag = flags.find((f) => f.key === "ai_coding_assistant");
    if (aiFlag && !aiFlag.enabled) {
      return NextResponse.json({ error: "AI Coding Assistant is temporarily disabled by Platform Administration." }, { status: 403 });
    }

    // 1. Record user message
    const userMsg = await db.addAIMessage(conversationId, "user", prompt);

    // 2. Fetch history context
    const history = await db.getAIMessages(conversationId);

    // 3. Generate assistant response
    const { text: responseText, tokensUsed } = await callGeminiAssistant(prompt, history);

    // 4. Save assistant response
    const assistantMsg = await db.addAIMessage(conversationId, "assistant", responseText);

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      tokensUsed,
    });
  } catch (error) {
    console.error("AI prompt execution error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
