"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Fine {
  id: string; amount: number; paid: boolean; paidAt: string | null; createdAt: string;
  borrow: {
    id: string; borrowDate: string; dueDate: string; returnDate: string | null;
    user: { name: string; email: string };
    book: { title: string; author: string };
  };
}

export default function FinesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchFines = useCallback(async () => {
    try {
      const r = await fetch("/api/fines");
      const d = await r.json();
      if (d.success) setFines(d.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handlePay = async (id: string) => {
    if (!confirm("Tandai denda ini sebagai sudah lunas?")) return;
    setPayingId(id);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/fines/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Denda berhasil ditandai lunas" });
        fetchFines();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal memproses denda" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{isAdmin ? "Manajemen Denda" : "Denda Saya"}</h1>
        <p className="text-sm text-slate-500 mt-1">Total denda belum dibayar: {formatCurrency(fines.filter(f => !f.paid).reduce((sum, f) => sum + f.amount, 0))}</p>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {fines.length === 0 ? (
        <div className="text-center py-20"><DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-600">Tidak ada denda</h3></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {isAdmin && <th>Peminjam</th>}
                <th>Buku</th>
                <th>Tgl Pinjam</th>
                <th>Batas Kembali</th>
                <th>Tgl Kembali</th>
                <th>Denda</th>
                <th>Status</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {fines.map(f => (
                <tr key={f.id}>
                  {isAdmin && <td><p className="font-medium">{f.borrow.user.name}</p><p className="text-xs text-slate-400">{f.borrow.user.email}</p></td>}
                  <td><p className="font-medium">{f.borrow.book.title}</p></td>
                  <td>{formatDate(f.borrow.borrowDate)}</td>
                  <td>{formatDate(f.borrow.dueDate)}</td>
                  <td>{f.borrow.returnDate ? formatDate(f.borrow.returnDate) : "-"}</td>
                  <td className="font-semibold text-red-600">{formatCurrency(f.amount)}</td>
                  <td><span className={`badge ${f.paid ? "badge-returned" : "badge-overdue"}`}>{f.paid ? "Lunas" : "Belum Bayar"}</span></td>
                  {isAdmin && (
                    <td>
                      {!f.paid && (
                        <button
                          onClick={() => handlePay(f.id)}
                          disabled={payingId === f.id}
                          className="btn btn-primary btn-sm whitespace-nowrap"
                        >
                          {payingId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Tandai Lunas
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
