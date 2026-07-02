import { NextRequest, NextResponse } from "next/server";
import { mkdir, copyFile, readdir } from "fs/promises";
import path from "path";
import fs from "fs";

// GET /api/sync-covers - Copy all git-committed cover images to the persistent volume
export async function GET(request: NextRequest) {
  try {
    const gitUploadsDir = path.join(process.cwd(), "public", "uploads");
    const persistentDir = "/app/storage/uploads";

    // Ensure persistent storage directory exists
    await mkdir(persistentDir, { recursive: true });

    console.log(`Syncing files from ${gitUploadsDir} to ${persistentDir}...`);

    if (!fs.existsSync(gitUploadsDir)) {
      return NextResponse.json({ success: false, error: "Folder public/uploads bawaan tidak ditemukan" }, { status: 404 });
    }

    const files = await readdir(gitUploadsDir);
    let copiedCount = 0;

    for (const file of files) {
      if (file === ".gitkeep") continue;
      
      const srcPath = path.join(gitUploadsDir, file);
      const destPath = path.join(persistentDir, file);
      
      // Copy each file to persistent volume if not already exists
      if (!fs.existsSync(destPath)) {
        await copyFile(srcPath, destPath);
        copiedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyalin ${copiedCount} gambar sampul asli dari Git ke Volume Permanen.`,
      totalFiles: files.length - 1
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyalin file: " + error.message },
      { status: 500 }
    );
  }
}
