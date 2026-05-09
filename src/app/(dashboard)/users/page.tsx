"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";

interface UserData {
  id: string; name: string; email: string; role: string;
  phone: string | null; createdAt: string; _count: { borrows: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    if (data.success) { setUsers(data.data); setTotalPages(data.totalPages); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [debouncedSearch, page]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (data.success) { setMessage({ type: "success", text: "User diperbarui" }); setEditingUser(null); fetchUsers(); }
    else setMessage({ type: "error", text: data.error });
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus user "${name}"?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMessage({ type: "success", text: "User dihapus" }); fetchUsers(); }
    else setMessage({ type: "error", text: data.error });
  };

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>

      <div className="card-glass p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="input pl-10" />
        </div>
      </div>

      {message.text && <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>}

      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nama</label><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input" /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="input"><option value="MEMBER">Anggota</option><option value="ADMIN">Admin</option></select></div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">{saving ? "Menyimpan..." : "Simpan"}</button>
                <button onClick={() => setEditingUser(null)} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Telepon</th><th>Peminjaman</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div><div><p className="font-medium">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></td>
                  <td><span className={`badge ${u.role === "ADMIN" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{ROLE_LABELS[u.role]}</span></td>
                  <td>{u.phone || "-"}</td>
                  <td>{u._count.borrows}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td><div className="flex gap-1.5">
                    <button onClick={() => { setEditingUser(u); setEditForm({ name: u.name, email: u.email, role: u.role }); }} className="btn btn-secondary btn-sm"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(u.id, u.name)} className="btn btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between">
          <p className="text-sm text-slate-500">Hal {page}/{totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn btn-secondary btn-sm"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="btn btn-secondary btn-sm"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
