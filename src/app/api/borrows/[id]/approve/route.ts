import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/borrows/[id]/approve - Admin approve borrow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const borrow = await prisma.borrow.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!borrow) {
      return NextResponse.json(
        { success: false, error: "Peminjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    if (borrow.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Peminjaman sudah diproses" },
        { status: 400 }
      );
    }

    if (borrow.book.stock <= 0) {
      return NextResponse.json(
        { success: false, error: "Stok buku habis" },
        { status: 400 }
      );
    }

    // Update borrow status and decrease stock in transaction
    const updatedBorrow = await prisma.$transaction(async (tx) => {
      const updated = await tx.borrow.update({
        where: { id },
        data: {
          status: "BORROWED",
          borrowDate: new Date(),
        },
        include: {
          book: { select: { id: true, title: true, author: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.book.update({
        where: { id: borrow.bookId },
        data: { stock: { decrement: 1 } },
      });

      return updated;
    });

    return NextResponse.json({ success: true, data: updatedBorrow });
  } catch (error) {
    console.error("Error approving borrow:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyetujui peminjaman" },
      { status: 500 }
    );
  }
}
