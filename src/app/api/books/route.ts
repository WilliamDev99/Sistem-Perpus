import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { bookSchema } from "@/lib/validations/book";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// GET /api/books - List books with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data buku" },
      { status: 500 }
    );
  }
}

// POST /api/books - Create book (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if ISBN already exists
    const existing = await prisma.book.findUnique({
      where: { isbn: parsed.data.isbn },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "ISBN sudah terdaftar" },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: book }, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat buku" },
      { status: 500 }
    );
  }
}
