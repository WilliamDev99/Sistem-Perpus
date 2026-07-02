import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

// POST /api/sync-covers - Receive a zip file and extract it directly into the uploads volume
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "File zip tidak ditemukan" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const zipPath = path.join(uploadDir, "temp_uploads.zip");
    const bytes = await file.arrayBuffer();
    await writeFile(zipPath, Buffer.from(bytes));

    console.log("Extracting uploaded zip into Railway volume...");

    // Extract zip file using adm-zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(uploadDir, true);

    // Delete temp zip file
    fs.unlinkSync(zipPath);

    console.log("Successfully extracted all local cover images to Volume!");

    return NextResponse.json({
      success: true,
      message: "Berhasil mengunggah dan mengekstrak semua gambar sampul asli ke Volume Railway!",
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses file zip: " + error.message },
      { status: 500 }
    );
  }
}
