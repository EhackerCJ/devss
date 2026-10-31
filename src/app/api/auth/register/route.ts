import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  display_name: z.string().min(2, "Display name must be at least 2 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, username, display_name, password } = result.data;

    // Check feature flag for registration
    const flags = await db.getFeatureFlags();
    const regFlag = flags.find((f) => f.key === "registrations_open");
    if (regFlag && !regFlag.enabled) {
      return NextResponse.json(
        { error: "Registrations are currently closed by Platform Administration." },
        { status: 403 }
      );
    }

    // Check unique email and username
    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const existingUsername = await db.getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Prevent reserved names
    const reserved = ["supreme", "admin", "moderator", "system", "devsphere", "support", "root"];
    if (reserved.includes(username.toLowerCase())) {
      return NextResponse.json(
        { error: "This username is reserved and cannot be registered." },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    const newUser = await db.createUser({
      email,
      username,
      display_name,
      password_hash,
      platform_role: "USER",
    });

    // Create session token
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      platformRole: newUser.platform_role,
      isSupreme: false,
      recentAuthTime: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      user: newUser,
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
