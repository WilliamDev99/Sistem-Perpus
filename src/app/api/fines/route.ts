import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

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

    const where: Record<string, unknown> = {};

    // Members see only their own fines
    if (session.user.role !== "ADMIN") {
      where.borrow = { userId: session.user.id };
    }

    const fines = await prisma.fine.findMany({
      where,
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

    return NextResponse.json({ success: true, data: fines });
  } catch (error) {
    console.error("Error fetching fines:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data denda" },
      { status: 500 }
    );
  }
}
