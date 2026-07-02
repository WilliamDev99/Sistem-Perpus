import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";

// List of covers to download
const COVERS_TO_SYNC = [
  { filename: "1778274321468-oc8ruow.jpg", url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778274103323-f8kmpa4.jpg", url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778273869769-x2m940k.jpg", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778273703422-bq65zuv.jpg", url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778273479722-znv6i3o.jpg", url: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778273381761-e7em7dl.jpg", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778249278115-vp81ju3.jpg", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778248981675-8llyoim.jpg", url: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778248659400-23f6c5d.jpg", url: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400" },
  { filename: "1778248557553-7husnga.png", url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400" },
];

export async function GET(request: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    console.log("Starting automatic cover restoration in uploads volume...");
    let successCount = 0;

    for (const cover of COVERS_TO_SYNC) {
      const filepath = path.join(uploadDir, cover.filename);
      
      try {
        const response = await axios.get(cover.url, { responseType: "arraybuffer" });
        await writeFile(filepath, Buffer.from(response.data));
        successCount++;
        console.log(`Successfully restored cover: ${cover.filename}`);
      } catch (err: any) {
        console.error(`Failed to download ${cover.filename}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memulihkan ${successCount} dari ${COVERS_TO_SYNC.length} gambar sampul ke Volume.`,
    });
  } catch (error: any) {
    console.error("Restoration error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menjalankan sinkronisasi" },
      { status: 500 }
    );
  }
}
