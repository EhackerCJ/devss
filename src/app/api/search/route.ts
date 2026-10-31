import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    if (!q) {
      return NextResponse.json({ users: [], servers: [] });
    }

    // 1. Search Users
    const allUsers = await db.getAllUsers();
    const matchedUsers = allUsers
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.display_name.toLowerCase().includes(q)
      )
      .slice(0, 10);

    // 2. Search Public Servers
    const allServers = await db.getServers();
    const matchedServers = allServers
      .filter(
        (s) =>
          s.is_public &&
          (s.name.toLowerCase().includes(q) ||
            (s.description && s.description.toLowerCase().includes(q)))
      )
      .slice(0, 10);

    return NextResponse.json({
      users: matchedUsers,
      servers: matchedServers,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
