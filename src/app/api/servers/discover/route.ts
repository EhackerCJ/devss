import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const allServers = await db.getServers();
    const publicServers = allServers.filter((s) => s.is_public);
    return NextResponse.json({ servers: publicServers });
  } catch (error) {
    console.error("Discover servers error:", error);
    return NextResponse.json({ error: "Failed to fetch discoverable servers" }, { status: 500 });
  }
}
