import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const requestSchema = z.object({
  tierId: z.enum(["pro", "supreme_dev"]),
  contactMessage: z.string().min(5, "Message must be at least 5 characters").max(1000),
  paymentReference: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const all = await db.getPremiumRequests();
    const userRequests = all.filter((r) => r.user_id === session.userId);
    return NextResponse.json({ requests: userRequests });
  } catch (error) {
    console.error("Fetch user premium requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tierId, contactMessage, paymentReference } = result.data;

    const newRequest = await db.createPremiumRequest({
      userId: session.userId,
      tierId,
      contactMessage,
      paymentReference,
    });

    // Notify Supreme Owner
    await db.createNotification({
      user_id: "00000000-0000-0000-0000-000000000001", // Supreme
      actor_id: session.userId,
      type: "premium_update",
      title: "New Premium Request",
      content: `@${session.username} requested ${tierId.toUpperCase()} tier.`,
      link_url: "/supreme",
    });

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error("Submit premium request error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
