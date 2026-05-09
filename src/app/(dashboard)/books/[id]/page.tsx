"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  User,
  Building,
  Calendar,
  Hash,
  Tag,
  Package,
  Edit,
  Trash2,
  BookCopy,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface BookDetail {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  category: { id: string; name: string };
  stock: number;
  coverImage: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`);
        const data = await res.json();
        if (data.success) {
          setBook(data.data);
        } else {
          showToast("error", "Buku tidak ditemukan");
        }
      } catch {
        showToast("error", "Gagal memuat data buku");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      const res = await fetch("/api/borrows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Permintaan peminjaman berhasil dikirim! Tunggu persetujuan admin.");
        // Refresh book data
        const bookRes = await fetch(`/api/books/${id}`);
        const bookData = await bookRes.json();
        if (bookData.success) setBook(bookData.data);
      } else {
        showToast("error", data.error || "Gagal meminjam buku");
      }
    } catch {
      showToast("error", "Terjadi kesalahan");
    } finally {
      setBorrowing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/books");
      } else {
        showToast("error", data.error || "Gagal menghapus buku");
      }
    } catch {
      showToast("error", "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600">Buku tidak ditemukan</h3>
        <Link href="/books" className="btn btn-primary mt-4">
          Kembali ke Daftar Buku
        </Link>
      </div>
    );
  }

  const getBookGradient = () => "linear-gradient(135deg, #dc2626, #b91c1c)";

  return (
    <div className="space-y-6 fade-in">
      {/* Back Button */}
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Buku
      </Link>

      {/* Back Button */}
      <div className="card-glass overflow-hidden">
        <div className="md:flex">
          {/* Cover */}
          <div
            className="md:w-80 h-64 md:h-auto flex items-center justify-center flex-shrink-0"
            style={{
              background: book.coverImage ? undefined : getBookGradient(),
              minHeight: "320px",
            }}
          >
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-20 h-20 text-white/40" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                  {book.category.name}
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-3">
                  {book.title}
                </h1>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/books/${book.id}/edit`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "..." : "Hapus"}
                  </button>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Penulis</p>
                  <p className="text-sm font-medium text-slate-700">{book.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Penerbit</p>
                  <p className="text-sm font-medium text-slate-700">{book.publisher}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tahun Terbit</p>
                  <p className="text-sm font-medium text-slate-700">{book.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ISBN</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{book.isbn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Stok Tersedia</p>
                  <p className={`text-sm font-bold ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {book.stock} eksemplar
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Borrow Button */}
            {!isAdmin && book.stock > 0 && (
              <button
                onClick={handleBorrow}
                disabled={borrowing}
                className="btn btn-primary mt-6"
              >
                {borrowing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <BookCopy className="w-4 h-4" />
                    Pinjam Buku Ini
                  </>
                )}
              </button>
            )}

            {!isAdmin && book.stock <= 0 && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                Stok buku sedang habis. Silakan coba lagi nanti.
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Ditambahkan pada {formatDate(book.createdAt)} • Terakhir diperbarui {formatDate(book.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
