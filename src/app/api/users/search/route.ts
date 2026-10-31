import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const users = await db.searchUsers(q);
    // Filter out current user from search
    const filtered = session ? users.filter((u) => u.id !== session.userId) : users;

    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
