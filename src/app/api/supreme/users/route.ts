import { NextRequest, NextResponse } from "next/server";
import { requireSupreme } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const userActionSchema = z.object({
  targetUserId: z.string(),
  action: z.enum([
    "ban",
    "unban",
    "suspend",
    "activate",
    "toggle_verified",
    "grant_premium",
    "revoke_premium",
  ]),
  reason: z.string().min(3, "A valid administrative reason is required"),
  tierId: z.enum(["pro", "supreme_dev"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSupreme(req);
    const users = await db.getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSupreme(req);
    const body = await req.json();

    const result = userActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { targetUserId, action, reason, tierId } = result.data;
    const targetUser = await db.getUserById(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Protection rule: Supreme Owner cannot be modified or banned by any action
    if (targetUser.platform_role === "SUPREME_OWNER") {
      return NextResponse.json({ error: "Inviolable: The Supreme Owner cannot be modified or restricted." }, { status: 403 });
    }

    let updates: Partial<typeof targetUser> = {};

    switch (action) {
      case "ban":
        updates = { account_state: "banned" };
        break;
      case "unban":
      case "activate":
        updates = { account_state: "active" };
        break;
      case "suspend":
        updates = { account_state: "suspended" };
        break;
      case "toggle_verified":
        updates = { is_verified: !targetUser.is_verified };
        break;
      case "grant_premium":
        updates = {
          platform_role: "PREMIUM_USER",
          premium_tier: tierId || "pro",
          is_verified: true,
        };
        break;
      case "revoke_premium":
        updates = {
          platform_role: "USER",
          premium_tier: "free",
        };
        break;
    }

    const updated = await db.updateUser(targetUserId, updates);

    // Record Immutable Audit Log
    await db.createAuditLog({
      actor_id: session.userId,
      actor_name: session.username,
      action: `SUPREME_USER_${action.toUpperCase()}`,
      target_id: targetUserId,
      target_name: targetUser.username,
      reason,
      metadata: { previous: targetUser, updated: updates },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Supreme user action error:", error);
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Action execution failed" }, { status: 500 });
  }
}
