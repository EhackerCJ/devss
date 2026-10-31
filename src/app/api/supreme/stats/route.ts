import { NextRequest, NextResponse } from "next/server";
import { requireSupreme } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireSupreme(req);
    const stats = await db.getPlatformStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN_SUPREME_ONLY") {
      return NextResponse.json({ error: "Access Denied: Supreme Owner Authority Required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
