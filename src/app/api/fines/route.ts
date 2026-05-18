import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { FINE_PER_DAY } from "@/lib/constants";

// GET /api/fines
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const userId = session.user.id;

    // 1. Get actual fines (from returned overdue books)
    const fineWhere: Record<string, unknown> = {};
    if (!isAdmin) {
      fineWhere.borrow = { userId };
    }

    const actualFines = await prisma.fine.findMany({
      where: fineWhere,
      include: {
        borrow: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            book: { select: { id: true, title: true, author: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Get overdue borrows that DON'T have a fine yet (still borrowed)
    const overdueBorrowWhere: Record<string, unknown> = {
      status: { in: ["OVERDUE", "BORROWED"] },
      dueDate: { lt: new Date() },
      fine: null, // No fine record yet
    };
    if (!isAdmin) {
      overdueBorrowWhere.userId = userId;
    }

    const overdueBorrows = await prisma.borrow.findMany({
      where: overdueBorrowWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    // 3. Calculate running fines for overdue borrows
    const now = new Date();
    const runningFines = overdueBorrows.map((borrow) => {
      const dueDate = new Date(borrow.dueDate);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const amount = diffDays * FINE_PER_DAY;

      return {
        id: `running-${borrow.id}`,
        borrowId: borrow.id,
        amount,
        paid: false,
        paidAt: null,
        createdAt: borrow.dueDate,
        isRunning: true, // Flag to indicate this is a running fine
        daysOverdue: diffDays,
        borrow: {
          id: borrow.id,
          borrowDate: borrow.borrowDate,
          dueDate: borrow.dueDate,
          returnDate: borrow.returnDate,
          status: borrow.status,
          user: borrow.user,
          book: borrow.book,
        },
      };
    });

    // 4. Format actual fines to match structure
    const formattedActualFines = actualFines.map((fine) => ({
      ...fine,
      isRunning: false,
      daysOverdue: fine.borrow.returnDate
        ? Math.ceil(
            (new Date(fine.borrow.returnDate).getTime() -
              new Date(fine.borrow.dueDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    }));

    // 5. Combine: running fines first, then actual fines
    const allFines = [...runningFines, ...formattedActualFines];

    return NextResponse.json({ success: true, data: allFines });
  } catch (error) {
    console.error("Error fetching fines:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data denda" },
      { status: 500 }
    );
  }
}
