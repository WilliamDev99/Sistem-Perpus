import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { BORROW_DURATION_DAYS, FINE_PER_DAY } from "@/lib/constants";

// GET /api/borrows
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = {};

    // Members can only see their own borrows
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [borrows, total] = await Promise.all([
      prisma.borrow.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true, coverImage: true } },
          fine: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.borrow.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: borrows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching borrows:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data peminjaman" },
      { status: 500 }
    );
  }
}

// POST /api/borrows - Create borrow request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Buku wajib dipilih" },
        { status: 400 }
      );
    }

    // Check book exists and has stock
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    if (book.stock <= 0) {
      return NextResponse.json(
        { success: false, error: "Stok buku habis" },
        { status: 400 }
      );
    }

    // Check if user already has active borrow for this book
    const existingBorrow = await prisma.borrow.findFirst({
      where: {
        userId: session.user.id,
        bookId,
        status: { in: ["PENDING", "BORROWED"] },
      },
    });

    if (existingBorrow) {
      return NextResponse.json(
        { success: false, error: "Anda sudah meminjam buku ini" },
        { status: 400 }
      );
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    const borrow = await prisma.borrow.create({
      data: {
        userId: session.user.id,
        bookId,
        dueDate,
        status: "PENDING",
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: borrow }, { status: 201 });
  } catch (error) {
    console.error("Error creating borrow:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat peminjaman" },
      { status: 500 }
    );
  }
}
