"use client";

import { useEffect, useState, useCallback } from "react";
import { History, BookCopy, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

interface Borrow {
  id: string;
  book: { id: string; title: string; author: string; coverImage: string | null };
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: { id: string; amount: number; paid: boolean } | null;
}

export default function MyBorrowsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/borrows?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setBorrows(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBorrows();
  }, [fetchBorrows]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "badge-pending",
      BORROWED: "badge-borrowed",
      RETURNED: "badge-returned",
      OVERDUE: "badge-overdue",
    };
    return <span className={`badge ${styles[status] || ""}`}>{STATUS_LABELS[status] || status}</span>;
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Peminjaman</h1>
        <p className="text-sm text-slate-500 mt-1">Lihat semua riwayat peminjaman buku Anda</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : borrows.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">Belum ada peminjaman</h3>
          <p className="text-sm text-slate-400 mt-1">Mulai pinjam buku dari katalog</p>
        </div>
      ) : (
        <div className="space-y-3">
          {borrows.map((borrow) => (
            <div key={borrow.id} className="card-glass p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: borrow.book.coverImage ? undefined : "linear-gradient(135deg, #667eea, #764ba2)" }}>
                  {borrow.book.coverImage ? (
                    <img src={borrow.book.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookCopy className="w-6 h-6 text-white/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">{borrow.book.title}</h3>
                      <p className="text-sm text-slate-500">{borrow.book.author}</p>
                    </div>
                    {getStatusBadge(borrow.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-slate-500">
                    <span>Pinjam: {formatDate(borrow.borrowDate)}</span>
                    <span>Batas: {formatDate(borrow.dueDate)}</span>
                    {borrow.returnDate && <span>Kembali: {formatDate(borrow.returnDate)}</span>}
                  </div>
                  {borrow.fine && (
                    <div className="mt-2 text-sm">
                      <span className="text-red-600 font-semibold">Denda: {formatCurrency(borrow.fine.amount)}</span>
                      <span className={`ml-2 badge ${borrow.fine.paid ? "badge-returned" : "badge-overdue"}`}>
                        {borrow.fine.paid ? "Lunas" : "Belum dibayar"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm disabled:opacity-50">
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
