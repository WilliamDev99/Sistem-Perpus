import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

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

    // Handle payment for "running" fines (books still borrowed)
    if (id.startsWith("running-")) {
      const borrowId = id.replace("running-", "");
      
      const borrow = await prisma.borrow.findUnique({
        where: { id: borrowId },
        include: { book: true }
      });

      if (!borrow) {
        return NextResponse.json({ success: false, error: "Peminjaman tidak ditemukan" }, { status: 404 });
      }

      if (borrow.status === "RETURNED") {
        return NextResponse.json({ success: false, error: "Buku sudah dikembalikan" }, { status: 400 });
      }

      const now = new Date();
      const dueDate = new Date(borrow.dueDate);
      const isOverdue = now > dueDate;
      
      let fineAmount = 0;
      if (isOverdue) {
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // We can't easily import FINE_PER_DAY here if it causes a circular dep, but we can import it.
        // Actually, let's just use the logic
      }

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update borrow to RETURNED
        await tx.borrow.update({
          where: { id: borrowId },
          data: { status: "RETURNED", returnDate: now },
        });

        // 2. Increment book stock
        await tx.book.update({
          where: { id: borrow.bookId },
          data: { stock: { increment: 1 } },
        });

        // 3. Create PAID fine record
        // Need to calculate amount again properly
        let finalAmount = 0;
        if (isOverdue) {
          const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          // Import FINE_PER_DAY at top of file
          const constants = await import("@/lib/constants");
          finalAmount = diffDays * constants.FINE_PER_DAY;
        }

        if (finalAmount > 0) {
          return await tx.fine.create({
            data: {
              borrowId,
              amount: finalAmount,
              paid: true,
              paidAt: now,
            }
          });
        }
        return null;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Buku berhasil dikembalikan dan denda lunas",
      });
    }

    // Handle payment for actual fines (books already returned)
    const fine = await prisma.fine.findUnique({
      where: { id },
    });

    if (!fine) {
      return NextResponse.json(
        { success: false, error: "Denda tidak ditemukan" },
        { status: 404 }
      );
    }

    if (fine.paid) {
      return NextResponse.json(
        { success: false, error: "Denda sudah lunas" },
        { status: 400 }
      );
    }

    const updated = await prisma.fine.update({
      where: { id },
      data: {
        paid: true,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Denda berhasil ditandai lunas",
    });
  } catch (error) {
    console.error("Error paying fine:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pembayaran denda" },
      { status: 500 }
    );
  }
}
