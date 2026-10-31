import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { generateId } from "@/lib/utils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const user = await db.getUserById(session.userId);

    // Size quota limits based on tier
    let maxSizeBytes = 10 * 1024 * 1024; // Free: 10MB
    if (user?.premium_tier === "pro") {
      maxSizeBytes = 100 * 1024 * 1024; // Pro: 100MB
    } else if (user?.premium_tier === "supreme_dev" || user?.platform_role === "SUPREME_OWNER") {
      maxSizeBytes = 500 * 1024 * 1024; // Supreme: 500MB
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds your plan limit (${Math.round(maxSizeBytes / (1024 * 1024))}MB)` },
        { status: 413 }
      );
    }

    // Extension and MIME verification
    const allowedExtensions = [
      ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
      ".pdf", ".txt", ".md", ".json", ".zip", ".tar.gz",
      ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".c", ".cpp"
    ];

    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file extension (${ext}). Executables and unsafe formats are blocked.` },
        { status: 400 }
      );
    }

    // Save to disk
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const uniqueName = `${generateId()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
