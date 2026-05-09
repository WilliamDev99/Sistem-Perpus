import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { FINE_PER_DAY } from "@/lib/constants";

// GET /api/notifications
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const where: Record<string, unknown> = {
      status: { in: ["BORROWED", "OVERDUE"] },
      dueDate: { lt: new Date() },
    };

    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    }

    // Find overdue borrows
    const overdueBorrows = await prisma.borrow.findMany({
      where,
      include: {
        user: { select: { name: true } },
        book: { select: { title: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    // Update status to OVERDUE if needed
    const overdueIds = overdueBorrows
      .filter((b) => b.status === "BORROWED")
      .map((b) => b.id);

    if (overdueIds.length > 0) {
      await prisma.borrow.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: "OVERDUE" },
      });
    }

    const notifications = overdueBorrows.map((borrow) => {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(borrow.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const fineEstimate = daysOverdue * FINE_PER_DAY;

      return {
        id: borrow.id,
        type: "overdue" as const,
        message:
          session.user.role === "ADMIN"
            ? `${borrow.user.name} terlambat mengembalikan "${borrow.book.title}" (${daysOverdue} hari, denda ~Rp ${fineEstimate.toLocaleString("id-ID")})`
            : `Anda terlambat mengembalikan "${borrow.book.title}" (${daysOverdue} hari, denda ~Rp ${fineEstimate.toLocaleString("id-ID")})`,
        borrowId: borrow.id,
        createdAt: new Date().toISOString(),
        read: false,
      };
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil notifikasi" },
      { status: 500 }
    );
  }
}
