"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, Loader2, AlertTriangle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  _count: { books: number };
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Redirect non-admin
  useEffect(() => {
    if (session && !isAdmin) {
      router.push("/dashboard");
    }
  }, [session, isAdmin, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setNewName("");
        setMessage({ type: "success", text: `Kategori "${newName.trim()}" berhasil ditambahkan!` });
        fetchCategories();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menambahkan kategori" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category._count.books > 0) {
      setMessage({
        type: "error",
        text: `Kategori "${category.name}" tidak bisa dihapus karena masih memiliki ${category._count.books} buku.`,
      });
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) return;

    setDeletingId(category.id);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: `Kategori "${category.name}" berhasil dihapus.` });
        fetchCategories();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menghapus kategori" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Kategori</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tambah atau hapus kategori buku perpustakaan.
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "error" && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Add Category Form */}
      <div className="card-glass p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Tambah Kategori Baru</h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama kategori baru..."
              className="input pl-10"
              required
              minLength={2}
            />
          </div>
          <button type="submit" disabled={adding || !newName.trim()} className="btn btn-primary">
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Tambah
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="card-glass overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">
            Daftar Kategori ({categories.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Belum ada kategori</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{category.name}</p>
                    <p className="text-xs text-slate-400">{category._count.books} buku</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(category)}
                  disabled={deletingId === category.id}
                  className={`p-2 rounded-lg transition-colors ${
                    category._count.books > 0
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                  }`}
                  title={
                    category._count.books > 0
                      ? "Tidak bisa dihapus, masih ada buku"
                      : "Hapus kategori"
                  }
                >
                  {deletingId === category.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
