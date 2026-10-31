import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { z } from "zod";

const appealSchema = z.object({
  statement: z.string().min(10, "Please provide an appeal statement of at least 10 characters").max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = appealSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const appeal = {
      id: generateId(),
      user_id: session.userId,
      statement: result.data.statement,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // Log in audit trail
    await db.createAuditLog({
      actor_id: session.userId,
      actor_name: session.username,
      action: "USER_APPEAL_SUBMISSION",
      reason: result.data.statement.slice(0, 100),
    });

    return NextResponse.json({ success: true, appeal });
  } catch (error) {
    console.error("Appeal error:", error);
    return NextResponse.json({ error: "Failed to submit appeal" }, { status: 500 });
  }
}
