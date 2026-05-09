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
