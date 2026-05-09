import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { bookSchema } from "@/lib/validations/book";

// GET /api/books/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data buku" },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id]
export async function PUT(
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
    const body = await request.json();
    const parsed = bookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if book exists
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check ISBN uniqueness (excluding current book)
    if (parsed.data.isbn !== existing.isbn) {
      const isbnExists = await prisma.book.findUnique({
        where: { isbn: parsed.data.isbn },
      });
      if (isbnExists) {
        return NextResponse.json(
          { success: false, error: "ISBN sudah digunakan buku lain" },
          { status: 400 }
        );
      }
    }

    const book = await prisma.book.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate buku" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]
export async function DELETE(
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

    // Check if book has active borrows
    const activeBorrows = await prisma.borrow.count({
      where: { bookId: id, status: { in: ["PENDING", "BORROWED"] } },
    });

    if (activeBorrows > 0) {
      return NextResponse.json(
        { success: false, error: "Buku masih memiliki peminjaman aktif" },
        { status: 400 }
      );
    }

    await prisma.book.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Buku berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus buku" },
      { status: 500 }
    );
  }
}
