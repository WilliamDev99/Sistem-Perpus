"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function CreateBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

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
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      });
  }, []);

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
      } else {
        setError(data.error || "Gagal upload cover");
      }
    } catch {
      setError("Gagal upload cover");
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories([...categories, data.data]);
        setFormData({ ...formData, categoryId: data.data.id });
        setNewCategory("");
        setShowNewCategory(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Gagal menambah kategori");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        router.push(`/books/${data.data.id}`);
      } else {
        setError(data.error || "Gagal menambah buku");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="card-glass p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Tambah Buku Baru</h1>
        <p className="text-sm text-slate-500 mb-6">Lengkapi informasi buku berikut</p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cover Buku</label>
            <div className="flex items-start gap-4">
              {formData.coverImage && (
                <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-slate-200">
                  <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: "" })}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Judul Buku <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Masukkan judul buku"
              required
              className="input"
            />
          </div>

          {/* Author + Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Penulis <span className="text-red-500">*</span>
              </label>
              <input
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Nama penulis"
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Penerbit <span className="text-red-500">*</span>
              </label>
              <input
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                placeholder="Nama penerbit"
                required
                className="input"
              />
            </div>
          </div>

          {/* Year + ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tahun Terbit <span className="text-red-500">*</span>
              </label>
              <input
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ISBN <span className="text-red-500">*</span>
              </label>
              <input
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="978-xxx-xxx-xxx-x"
                required
                className="input"
              />
            </div>
          </div>

          {/* Category + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nama kategori baru"
                    className="input flex-1"
                  />
                  <button type="button" onClick={handleAddCategory} className="btn btn-primary btn-sm">
                    Tambah
                  </button>
                  <button type="button" onClick={() => setShowNewCategory(false)} className="btn btn-secondary btn-sm">
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    className="input flex-1"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowNewCategory(true)} className="btn btn-secondary btn-sm whitespace-nowrap">
                    + Baru
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Stok <span className="text-red-500">*</span>
              </label>
              <input
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                min={0}
                required
                className="input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi singkat tentang buku (opsional)"
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Buku"
              )}
            </button>
            <Link href="/books" className="btn btn-secondary">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
