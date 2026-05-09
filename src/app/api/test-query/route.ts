import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "cmomq84vz0000y0sbm3oz67fk";
    const res = await prisma.$queryRaw`
              SELECT DATE_FORMAT(borrowDate, '%Y-%m') as month, COUNT(*) as count
              FROM borrows 
              WHERE userId = ${userId} AND borrowDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
              GROUP BY DATE_FORMAT(borrowDate, '%Y-%m')
              ORDER BY month ASC
            `;
    return NextResponse.json({ success: true, data: res });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
