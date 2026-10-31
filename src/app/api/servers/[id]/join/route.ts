import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: serverId } = await params;

    const server = await db.getServerById(serverId);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const success = await db.addServerMember(serverId, session.userId);
    return NextResponse.json({ success, message: "Successfully joined server" });
  } catch (error) {
    console.error("Join server error:", error);
    return NextResponse.json({ error: "Failed to join server" }, { status: 500 });
  }
}
