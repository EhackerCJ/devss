import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const server = await db.getServerById(id);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const members = await db.getServerMembers(id);

    // Check if current user is a member
    const session = await getSessionFromRequest(req);
    const isMember = session ? members.some((m: any) => m.user_id === session.userId) : false;
    const currentMember = session ? members.find((m: any) => m.user_id === session.userId) : null;

    return NextResponse.json({
      server,
      members,
      isMember,
      userRole: currentMember?.server_role || null,
    });
  } catch (error) {
    console.error("Get server error:", error);
    return NextResponse.json({ error: "Failed to fetch server" }, { status: 500 });
  }
}
