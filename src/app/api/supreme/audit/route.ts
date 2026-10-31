import { NextRequest, NextResponse } from "next/server";
import { requireSupreme } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireSupreme(req);
    const logs = await db.getAuditLogs();
    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
