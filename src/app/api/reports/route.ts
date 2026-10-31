import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createReportSchema = z.object({
  targetType: z.enum(["user", "message", "server", "group"]),
  targetId: z.string(),
  reasonCategory: z.enum(["harassment", "spam", "inappropriate", "impersonation", "hate_speech", "other"]),
  explanation: z.string().min(5, "Please provide at least 5 characters of explanation"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    // Allow staff (Moderator, Admin, Supreme) to view reports
    const allowed = ["SUPREME_OWNER", "PLATFORM_ADMIN", "PLATFORM_MODERATOR", "SUPPORT"];
    if (!allowed.includes(session.platformRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await db.getReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const result = createReportSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const report = await db.createReport({
      reporter_id: session.userId,
      target_type: result.data.targetType,
      target_id: result.data.targetId,
      reason_category: result.data.reasonCategory,
      explanation: result.data.explanation,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
