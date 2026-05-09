import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/export?type=books|borrows
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "books";

    let csvContent = "";

    if (type === "books") {
      const books = await prisma.book.findMany({
        include: { category: true },
        orderBy: { title: "asc" },
      });

      csvContent = "Judul,Penulis,Penerbit,Tahun,ISBN,Kategori,Stok\n";
      books.forEach((book) => {
        csvContent += `"${book.title}","${book.author}","${book.publisher}",${book.year},"${book.isbn}","${book.category.name}",${book.stock}\n`;
      });
    } else if (type === "borrows") {
      const borrows = await prisma.borrow.findMany({
        include: {
          user: { select: { name: true, email: true } },
          book: { select: { title: true } },
          fine: true,
        },
        orderBy: { createdAt: "desc" },
      });

      csvContent = "Peminjam,Email,Buku,Tanggal Pinjam,Batas Pengembalian,Tanggal Kembali,Status,Denda\n";
      borrows.forEach((borrow) => {
        csvContent += `"${borrow.user.name}","${borrow.user.email}","${borrow.book.title}","${borrow.borrowDate.toISOString().split("T")[0]}","${borrow.dueDate.toISOString().split("T")[0]}","${borrow.returnDate?.toISOString().split("T")[0] || "-"}","${borrow.status}",${borrow.fine?.amount || 0}\n`;
      });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengexport data" },
      { status: 500 }
    );
  }
}
