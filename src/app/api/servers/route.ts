import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createServerSchema = z.object({
  name: z.string().min(2, "Server name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  icon_url: z.string().url().or(z.literal("")).optional(),
  is_public: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const servers = await db.getUserServers(session.userId);
    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Get user servers error:", error);
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const result = createServerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newServer = await db.createServer({
      name: result.data.name,
      description: result.data.description,
      icon_url: result.data.icon_url,
      owner_id: session.userId,
      is_public: result.data.is_public ?? true,
    });

    return NextResponse.json(newServer);
  } catch (error) {
    console.error("Create server error:", error);
    return NextResponse.json({ error: "Failed to create server" }, { status: 500 });
  }
}
