import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/borrows/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const borrow = await prisma.borrow.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true, coverImage: true } },
        fine: true,
      },
    });

    if (!borrow) {
      return NextResponse.json(
        { success: false, error: "Peminjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    // Members can only see their own borrows
    if (session.user.role !== "ADMIN" && borrow.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: borrow });
  } catch (error) {
    console.error("Error fetching borrow:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data peminjaman" },
      { status: 500 }
    );
  }
}
