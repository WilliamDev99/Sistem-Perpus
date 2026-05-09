"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function EditBookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    year: new Date().getFullYear(),
    isbn: "",
    categoryId: "",
    stock: 1,
    coverImage: "",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, catRes] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch("/api/categories"),
        ]);
        const bookData = await bookRes.json();
        const catData = await catRes.json();

        if (bookData.success) {
          const book = bookData.data;
          setFormData({
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            year: book.year,
            isbn: book.isbn,
            categoryId: book.categoryId,
            stock: book.stock,
            coverImage: book.coverImage || "",
            description: book.description || "",
          });
        }
        if (catData.success) setCategories(catData.data);
      } catch {
        setError("Gagal memuat data buku");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "year" || name === "stock" ? parseInt(value) || 0 : value,
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, coverImage: data.data.url });
      }
    } catch {
      setError("Gagal upload cover");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/books/${id}`);
      } else {
        setError(data.error || "Gagal mengupdate buku");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <Link href={`/books/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="card-glass p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Edit Buku</h1>
        <p className="text-sm text-slate-500 mb-6">Perbarui informasi buku</p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cover Buku</label>
            <div className="flex items-start gap-4">
              {formData.coverImage && (
                <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-slate-200">
                  <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData({ ...formData, coverImage: "" })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                {uploading ? <Loader2 className="w-6 h-6 text-red-600 animate-spin" /> : (
                  <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-500">Upload</span></>
                )}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul Buku *</label>
            <input name="title" value={formData.title} onChange={handleChange} required className="input" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Penulis *</label>
              <input name="author" value={formData.author} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Penerbit *</label>
              <input name="publisher" value={formData.publisher} onChange={handleChange} required className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahun Terbit *</label>
              <input name="year" type="number" value={formData.year} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ISBN *</label>
              <input name="isbn" value={formData.isbn} onChange={handleChange} required className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori *</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className="input">
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stok *</label>
              <input name="stock" type="number" value={formData.stock} onChange={handleChange} min={0} required className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="input resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : "Simpan Perubahan"}
            </button>
            <Link href={`/books/${id}`} className="btn btn-secondary">Batal</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
