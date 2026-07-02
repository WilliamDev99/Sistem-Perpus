import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// GET /api/uploads/[filename] - Serve uploaded files dynamically from the storage volume
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Use Railway persistent volume path in production, fallback to public/uploads in development
    const uploadDir = process.env.NODE_ENV === "production" 
      ? "/app/storage/uploads"
      : path.join(process.cwd(), "public", "uploads");
      
    const filepath = path.join(uploadDir, filename);

    let fileBuffer;
    try {
      fileBuffer = await readFile(filepath);
    } catch (readError) {
      // Fallback: If not found in Railway storage volume, try to read from the static public/uploads folder (deployed from Git)
      const fallbackPath = path.join(process.cwd(), "public", "uploads", filename);
      fileBuffer = await readFile(fallbackPath);
    }
    
    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    } else if (ext === ".svg") {
      contentType = "image/svg+xml";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
