import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

// Define the system prompt for our library assistant
const SYSTEM_PROMPT = `
Kamu adalah Asisten Virtual resmi dari Sistem Perpustakaan DISPUSIP Tana Toraja.
Tugas utama kamu adalah membantu anggota perpustakaan dengan menjawab pertanyaan seputar layanan perpustakaan.

ATURAN PENTING:
1. Denda keterlambatan buku adalah Rp 2.000 per hari (sesuai aturan yang baru diperbarui).
2. Masa peminjaman standar adalah 7 hari.
3. Jam operasional perpustakaan: Senin - Jumat, pukul 08:00 - 16:00 WITA. Sabtu dan Minggu tutup.
4. Kamu harus bersikap ramah, sopan, dan profesional.
5. Gunakan bahasa Indonesia yang baik dan mudah dipahami.
6. Jika ada yang menanyakan hal di luar konteks perpustakaan (seperti cuaca, matematika, coding), tolak dengan sopan dan ingatkan bahwa kamu hanya asisten perpustakaan.
7. Jawab dengan ringkas (jangan terlalu panjang) kecuali diminta detail.
`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Opsional: Cek autentikasi jika hanya member yang boleh pakai
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak valid." },
        { status: 400 }
      );
    }

    // Ambil pesan terakhir dari user
    const lastMessage = messages[messages.length - 1];

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Menggunakan gemini-flash-latest
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Format riwayat chat untuk API Gemini
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Gemini API requires history to start with 'user'. 
    // If our first message is from the 'model' (like the initial greeting), we should remove it.
    if (history.length > 0 && history[0].role === "model") {
      history = history.slice(1);
    }

    const chat = model.startChat({
      history,
    });

    // Tambahkan info user jika sudah login untuk personalisasi
    let promptText = lastMessage.content;
    if (session?.user?.name && messages.length === 1) {
       promptText = `[User info: Nama saya adalah ${session.user.name}]. ${promptText}`;
    }

    const result = await chat.sendMessage(promptText);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      data: {
        message: responseText,
      },
    });
  } catch (error: any) {
    console.error("Chatbot API Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat menghubungi layanan AI." },
      { status: 500 }
    );
  }
}
