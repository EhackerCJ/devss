import { NextRequest, NextResponse } from "next/server";
import { requireSupreme } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const flagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSupreme(req);
    const flags = await db.getFeatureFlags();
    return NextResponse.json({ flags });
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

    const result = flagSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid flag payload" }, { status: 400 });
    }

    const { key, enabled } = result.data;
    await db.setFeatureFlag(key, enabled, session.userId);

    // Audit log
    await db.createAuditLog({
      actor_id: session.userId,
      actor_name: session.username,
      action: "FEATURE_FLAG_TOGGLE",
      target_name: key,
      reason: `Flag set to ${enabled}`,
      metadata: { key, enabled },
    });

    return NextResponse.json({ success: true, key, enabled });
  } catch (error: any) {
    console.error("Feature flag error:", error);
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Flag update failed" }, { status: 500 });
  }
}
