import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  requestId: z.string(),
  status: z.enum(["approved", "rejected", "contacted", "awaiting_verification"]),
  internalNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const requests = await db.getPremiumRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch all premium requests error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const body = await req.json();

    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { requestId, status, internalNote } = result.data;

    const success = await db.updatePremiumRequest(
      requestId,
      status,
      session.userId,
      internalNote
    );

    // Audit log
    await db.createAuditLog({
      actor_id: session.userId,
      actor_name: session.username,
      action: `PREMIUM_REQUEST_${status.toUpperCase()}`,
      target_id: requestId,
      reason: internalNote || "Reviewed by platform staff",
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Update premium request error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
