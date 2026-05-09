import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { FINE_PER_DAY } from "@/lib/constants";

// POST /api/borrows/[id]/return - Mark as returned
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

    if (borrow.status === "RETURNED") {
      return NextResponse.json(
        { success: false, error: "Buku sudah dikembalikan" },
        { status: 400 }
      );
    }

    if (borrow.status === "PENDING") {
      return NextResponse.json(
        { success: false, error: "Peminjaman belum disetujui" },
        { status: 400 }
      );
    }

    const now = new Date();
    const dueDate = new Date(borrow.dueDate);
    const isOverdue = now > dueDate;

    // Calculate fine if overdue
    let fineAmount = 0;
    if (isOverdue) {
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * FINE_PER_DAY;
    }

    const updatedBorrow = await prisma.$transaction(async (tx) => {
      // Update borrow status
      const updated = await tx.borrow.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnDate: now,
        },
        include: {
          book: { select: { id: true, title: true, author: true } },
          user: { select: { id: true, name: true, email: true } },
          fine: true,
        },
      });

      // Increase stock
      await tx.book.update({
        where: { id: borrow.bookId },
        data: { stock: { increment: 1 } },
      });

      // Create fine if overdue
      if (isOverdue && fineAmount > 0) {
        await tx.fine.create({
          data: {
            borrowId: id,
            amount: fineAmount,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedBorrow,
      fine: isOverdue ? { amount: fineAmount, days: Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) } : null,
      message: isOverdue
        ? `Buku dikembalikan dengan denda Rp ${fineAmount.toLocaleString("id-ID")}`
        : "Buku berhasil dikembalikan",
    });
  } catch (error) {
    console.error("Error returning borrow:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengembalikan buku" },
      { status: 500 }
    );
  }
}
