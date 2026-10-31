import { NextRequest, NextResponse } from "next/server";
import { requireSupreme } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const staffSchema = z.object({
  targetUserId: z.string(),
  newRole: z.enum(["PLATFORM_ADMIN", "PLATFORM_MODERATOR", "SUPPORT", "USER"]),
  reason: z.string().min(5, "A documented rationale of at least 5 characters is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSupreme(req);
    const body = await req.json();

    const result = staffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid role delegation format" }, { status: 400 });
    }

    const { targetUserId, newRole, reason } = result.data;
    const targetUser = await db.getUserById(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Sovereign rules:
    // 1. Cannot alter the Supreme Owner
    if (targetUser.platform_role === "SUPREME_OWNER") {
      return NextResponse.json({ error: "Forbidden: The Supreme Owner role cannot be modified or revoked." }, { status: 403 });
    }

    // 2. Cannot promote anyone to Supreme Owner
    if ((newRole as string) === "SUPREME_OWNER") {
      return NextResponse.json({ error: "Forbidden: Supreme Owner is singular and cannot be created via delegation." }, { status: 403 });
    }

    const previousRole = targetUser.platform_role;
    const updated = await db.updateUser(targetUserId, {
      platform_role: newRole,
    });

    // Write immutable audit record
    await db.createAuditLog({
      actor_id: session.userId,
      actor_name: session.username,
      action: "PLATFORM_ROLE_DELEGATION",
      target_id: targetUserId,
      target_name: targetUser.username,
      reason,
      metadata: { previousRole, newRole },
    });

    // Notify user of role update
    await db.createNotification({
      user_id: targetUserId,
      actor_id: session.userId,
      type: "role_change",
      title: "Platform Staff Role Updated",
      content: `Your platform role has been updated to ${newRole} by the Supreme Owner. Rationale: ${reason}`,
      link_url: newRole === "PLATFORM_ADMIN" ? "/admin" : newRole === "PLATFORM_MODERATOR" ? "/moderator" : "/home",
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Staff delegation error:", error);
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Role delegation failed" }, { status: 500 });
  }
}
