"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, Plus, BookOpen, Filter, ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

interface Book {
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
}

interface Category {
  id: string;
  name: string;
  _count: { books: number };
}

export default function BooksPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/books?${params}`);
      const data = await res.json();

      if (data.success) {
        setBooks(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter]);

  const getBookGradient = (index: number) => {
    const gradients = [
      "linear-gradient(135deg, #dc2626, #b91c1c)",
      "linear-gradient(135deg, #ef4444, #f97316)",
      "linear-gradient(135deg, #e11d48, #be123c)",
      "linear-gradient(135deg, #f43f5e, #ec4899)",
      "linear-gradient(135deg, #b91c1c, #7f1d1d)",
      "linear-gradient(135deg, #f87171, #fb923c)",
      "linear-gradient(135deg, #e11d48, #f43f5e)",
      "linear-gradient(135deg, #dc2626, #ea580c)",
    ];
    return gradients[index % gradients.length];
  };

  if (!isAdmin) {
    return (
      <div className="pt-2 pb-12 w-full animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-h1 text-h1 text-on-background mb-2">Browse Books</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Cari buku yang ingin kamu baca</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-3 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none shadow-sm" 
              placeholder="Cari buku, penulis, atau ISBN..." 
              type="text"
            />
          </div>
        </div>

        {/* Categories / Filters */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            <button 
              onClick={() => setCategoryFilter("")}
              className={`px-5 py-2 rounded-full font-label-md text-label-md transition-transform ${categoryFilter === "" ? "bg-primary text-on-primary hover:scale-105 shadow-md" : "bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container shadow-sm"}`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-5 py-2 rounded-full font-label-md text-label-md transition-transform ${categoryFilter === cat.id ? "bg-primary text-on-primary hover:scale-105 shadow-md" : "bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container shadow-sm"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-surface-container">
            <span className="material-symbols-outlined text-outline text-5xl mb-4">menu_book</span>
            <h3 className="font-h3 text-h3 text-on-surface">Tidak ada buku ditemukan</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Coba ubah kata kunci pencarian atau filter kategori</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {books.map((book) => (
              <div key={book.id} className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-slate-100 flex flex-col h-full group">
                <div className="aspect-[3/4] w-full bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="material-symbols-outlined text-outline text-5xl">menu_book</span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-h3 text-h3 text-on-background mb-1 line-clamp-2" title={book.title}>{book.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{book.author}</p>
                  
                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm text-outline-variant">{book.stock > 0 ? `Stok: ${book.stock}` : "Habis Dipinjam"}</span>
                    <Link href={`/books/${book.id}`} className="w-full py-2.5 rounded-lg border border-primary text-primary font-label-md text-label-md text-center hover:bg-surface-container transition-colors inline-block">
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 mb-8">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (totalPages > 7) {
                if (p === 1 || p === totalPages || p === page || p === page - 1 || p === page + 1) {
                  return (
                    <button 
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-lg font-label-md text-label-md flex items-center justify-center transition-colors ${page === p ? "bg-primary text-on-primary shadow-md" : "border border-outline-variant text-on-surface hover:bg-surface-container"}`}
                    >
                      {p}
                    </button>
                  );
                } else if (p === page - 2 || p === page + 2) {
                  return <span key={p} className="px-2 text-outline">...</span>;
                }
                return null;
              }
              
              return (
                <button 
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg font-label-md text-label-md flex items-center justify-center transition-colors ${page === p ? "bg-primary text-on-primary shadow-md" : "border border-outline-variant text-on-surface hover:bg-surface-container"}`}
                >
                  {p}
                </button>
              );
            })}

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Admin Dashboard (Existing Layout)
  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Buku</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} buku tersedia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <a href="/api/export?type=books" className="btn btn-secondary text-sm">
                Export CSV
              </a>
              <Link href="/books/create" className="btn btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Tambah Buku
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, penulis, atau ISBN..."
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input pl-10 pr-8 min-w-[180px] appearance-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat._count.books})
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-red-50 text-red-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-red-50 text-red-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Books */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">Tidak ada buku ditemukan</h3>
          <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book, index) => (
            <Link key={book.id} href={`/books/${book.id}`} className="book-card group">
              <div
                className="cover"
                style={{
                  background: book.coverImage
                    ? undefined
                    : getBookGradient(index),
                }}
              >
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} />
                ) : (
                  <BookOpen className="w-12 h-12 text-white/60" />
                )}
              </div>
              <div className="p-4">
                <span className="text-[0.65rem] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {book.category.name}
                </span>
                <h3 className="font-semibold text-slate-800 mt-2 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{book.author}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{book.year}</span>
                  <span
                    className={`text-xs font-semibold ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {book.stock > 0 ? `Stok: ${book.stock}` : "Habis"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Buku</th>
                <th>Penulis</th>
                <th>Kategori</th>
                <th>Tahun</th>
                <th>ISBN</th>
                <th>Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td className="font-medium text-slate-800">{book.title}</td>
                  <td>{book.author}</td>
                  <td>
                    <span className="badge bg-red-50 text-red-700">{book.category.name}</span>
                  </td>
                  <td>{book.year}</td>
                  <td className="text-xs font-mono">{book.isbn}</td>
                  <td>
                    <span className={`font-semibold ${book.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {book.stock}
                    </span>
                  </td>
                  <td>
                    <Link href={`/books/${book.id}`} className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Halaman {page} dari {totalPages} ({total} buku)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
