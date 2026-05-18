import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { FINE_PER_DAY } from "@/lib/constants";

// GET /api/stats - Dashboard statistics
export async function GET() {
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

    // Base where clauses for borrows and fines based on role
    const borrowWhere = isAdmin ? {} : { userId };
    const fineWhere = isAdmin ? { paid: false } : { borrow: { userId }, paid: false };

    const [totalBooks, totalUsers, activeBorrows, pendingBorrows, fines, monthlyBorrows, overdueBorrows] =
      await Promise.all([
        prisma.book.count(), // Total books is always global
        isAdmin ? prisma.user.count({ where: { role: "MEMBER" } }) : Promise.resolve(0),
        prisma.borrow.count({
          where: { ...borrowWhere, status: { in: ["BORROWED", "OVERDUE"] } },
        }),
        prisma.borrow.count({ where: { ...borrowWhere, status: "PENDING" } }),
        prisma.fine.aggregate({
          where: fineWhere,
          _sum: { amount: true },
          _count: true,
        }),
        // Monthly borrow data for chart (global for admin, personal for member)
        isAdmin 
          ? prisma.$queryRaw`
              SELECT DATE_FORMAT(borrowDate, '%Y-%m') as month, COUNT(*) as count
              FROM borrows 
              WHERE borrowDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
              GROUP BY DATE_FORMAT(borrowDate, '%Y-%m')
              ORDER BY month ASC
            `
          : prisma.$queryRaw`
              SELECT DATE_FORMAT(borrowDate, '%Y-%m') as month, COUNT(*) as count
              FROM borrows 
              WHERE userId = ${userId} AND borrowDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
              GROUP BY DATE_FORMAT(borrowDate, '%Y-%m')
              ORDER BY month ASC
            `,
        // Get overdue borrows without fines for running fine calculation
        prisma.borrow.findMany({
          where: {
            ...borrowWhere,
            status: "OVERDUE",
            dueDate: { lt: new Date() },
            fine: null,
          },
          select: { dueDate: true },
        }),
      ]);

    // Calculate running fines from overdue borrows
    const now = new Date();
    let runningFineAmount = 0;
    for (const borrow of overdueBorrows) {
      const dueDate = new Date(borrow.dueDate);
      const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      runningFineAmount += diffDays * FINE_PER_DAY;
    }

    const totalFineAmount = (fines._sum.amount || 0) + runningFineAmount;
    const totalFineCount = fines._count + overdueBorrows.length;

    return NextResponse.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        activeBorrows,
        pendingBorrows,
        overdueBorrowCount: overdueBorrows.length,
        pendingFines: totalFineCount,
        totalFineAmount,
        monthlyBorrows: (monthlyBorrows as any[]).map(m => ({
          ...m,
          count: Number(m.count)
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
