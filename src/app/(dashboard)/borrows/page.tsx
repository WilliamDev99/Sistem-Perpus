"use client";

import { useEffect, useState, useCallback } from "react";
import { BookCopy, Check, RotateCcw, Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

interface Borrow {
  id: string;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string; coverImage: string | null };
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: { id: string; amount: number; paid: boolean } | null;
}

export default function BorrowsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "10");

      const res = await fetch(`/api/borrows?${params}`);
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
  }, [statusFilter, page]);

  useEffect(() => {
    fetchBorrows();
  }, [fetchBorrows]);

  const handleApprove = async (borrowId: string) => {
    setActionLoading(borrowId);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/borrows/${borrowId}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Peminjaman berhasil disetujui" });
        fetchBorrows();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal menyetujui" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (borrowId: string) => {
    setActionLoading(borrowId);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/borrows/${borrowId}/return`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message || "Buku berhasil dikembalikan" });
        fetchBorrows();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengembalikan" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "badge-pending",
      BORROWED: "badge-borrowed",
      RETURNED: "badge-returned",
      OVERDUE: "badge-overdue",
    };
    return (
      <span className={`badge ${styles[status] || ""}`}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Peminjaman</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola semua peminjaman buku</p>
        </div>
        <a href="/api/export?type=borrows" className="btn btn-secondary text-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      {/* Filter */}
      <div className="card-glass p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input pl-10 min-w-[200px] appearance-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="BORROWED">Sedang Dipinjam</option>
              <option value="OVERDUE">Terlambat</option>
              <option value="RETURNED">Dikembalikan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Peminjam</th>
                <th>Buku</th>
                <th>Tgl Pinjam</th>
                <th>Batas Kembali</th>
                <th>Tgl Kembali</th>
                <th>Status</th>
                <th>Denda</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {borrows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <BookCopy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    Tidak ada peminjaman
                  </td>
                </tr>
              ) : (
                borrows.map((borrow) => (
                  <tr key={borrow.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{borrow.user.name}</p>
                        <p className="text-xs text-slate-400">{borrow.user.email}</p>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{borrow.book.title}</p>
                      <p className="text-xs text-slate-400">{borrow.book.author}</p>
                    </td>
                    <td className="text-sm">{formatDate(borrow.borrowDate)}</td>
                    <td className="text-sm">{formatDate(borrow.dueDate)}</td>
                    <td className="text-sm">
                      {borrow.returnDate ? formatDate(borrow.returnDate) : "-"}
                    </td>
                    <td>{getStatusBadge(borrow.status)}</td>
                    <td>
                      {borrow.fine ? (
                        <span className="text-sm font-semibold text-red-600">
                          {formatCurrency(borrow.fine.amount)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {borrow.status === "PENDING" && (
                          <button
                            onClick={() => handleApprove(borrow.id)}
                            disabled={actionLoading === borrow.id}
                            className="btn btn-success btn-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                        )}
                        {(borrow.status === "BORROWED" || borrow.status === "OVERDUE") && (
                          <button
                            onClick={() => handleReturn(borrow.id)}
                            disabled={actionLoading === borrow.id}
                            className="btn btn-primary btn-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Kembalikan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
