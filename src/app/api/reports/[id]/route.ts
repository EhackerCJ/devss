import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "investigating", "resolved", "dismissed"]),
  resolutionNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireModerator(req);
    const { id } = await params;
    const body = await req.json();

    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid status format" }, { status: 400 });
    }

    const { status, resolutionNote } = result.data;
    const success = await db.updateReport(id, status, session.userId, resolutionNote);

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
