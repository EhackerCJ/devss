import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { identifier, password } = result.data;

    // Find by email or username
    const user = identifier.includes("@")
      ? await db.getUserByEmail(identifier)
      : await db.getUserByUsername(identifier);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.account_state === "banned") {
      return NextResponse.json(
        { error: "Your account has been permanently banned from DevSphere for policy violations." },
        { status: 403 }
      );
    }

    if (user.account_state === "suspended") {
      return NextResponse.json(
        { error: "Your account is temporarily suspended by Platform Administration." },
        { status: 403 }
      );
    }

    // Verify password
    const hash = db.getPasswordHash(user.id);
    if (!hash) {
      return NextResponse.json(
        { error: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    // Update presence
    await db.setPresence(user.id, "online");

    const isSupreme = user.platform_role === "SUPREME_OWNER";

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      platformRole: user.platform_role,
      isSupreme,
      recentAuthTime: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      user,
      isSupreme,
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
