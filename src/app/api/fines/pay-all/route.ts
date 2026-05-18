import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/fines/pay-all - Mark all unpaid fines as paid
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const now = new Date();

    // 1. Mark existing unpaid fine records as paid
    const result = await prisma.fine.updateMany({
      where: { paid: false },
      data: {
        paid: true,
        paidAt: now,
      },
    });

    let runningCount = 0;

    // 2. Handle running fines (books still borrowed but overdue)
    const overdueBorrows = await prisma.borrow.findMany({
      where: {
        status: { in: ["OVERDUE", "BORROWED"] },
        dueDate: { lt: now },
        fine: null,
      },
      include: { book: true }
    });

    if (overdueBorrows.length > 0) {
      const constants = await import("@/lib/constants");
      
      await prisma.$transaction(async (tx) => {
        for (const borrow of overdueBorrows) {
          const dueDate = new Date(borrow.dueDate);
          const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const fineAmount = diffDays * constants.FINE_PER_DAY;

          // Return book
          await tx.borrow.update({
            where: { id: borrow.id },
            data: { status: "RETURNED", returnDate: now },
          });

          // Increment stock
          await tx.book.update({
            where: { id: borrow.bookId },
            data: { stock: { increment: 1 } },
          });

          // Create paid fine
          if (fineAmount > 0) {
            await tx.fine.create({
              data: {
                borrowId: borrow.id,
                amount: fineAmount,
                paid: true,
                paidAt: now,
              }
            });
            runningCount++;
          }
        }
      });
    }

    const totalCount = result.count + runningCount;

    return NextResponse.json({
      success: true,
      count: totalCount,
      message: `${totalCount} denda berhasil ditandai lunas dan buku dikembalikan`,
    });
  } catch (error) {
    console.error("Error paying all fines:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pembayaran denda" },
      { status: 500 }
    );
  }
}
