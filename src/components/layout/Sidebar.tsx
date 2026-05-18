"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookCopy,
  DollarSign,
  Tag,
  Library,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/books", label: "Manajemen Buku", icon: BookOpen },
  { href: "/categories", label: "Kategori", icon: Tag },
  { href: "/users", label: "Manajemen User", icon: Users },
  { href: "/borrows", label: "Peminjaman", icon: BookCopy },
  { href: "/fines", label: "Denda", icon: DollarSign },
];

const memberLinks = [
  { href: "/dashboard", label: "My Dashboard", icon: "dashboard" },
  { href: "/books", label: "Browse Books", icon: "library_books" },
  { href: "/my-borrows", label: "My Borrows", icon: "auto_stories" },
  { href: "/fines", label: "Denda & Pembayaran", icon: "history" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        <aside
          className={`fixed top-0 left-0 z-50 h-screen w-[260px] flex flex-col gap-1 py-8 transition-transform duration-300 lg:translate-x-0 border-r border-slate-200 bg-background ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo & Close Button */}
          <div className="px-6 mb-8 flex justify-between items-start">
            <div className="flex flex-col items-start gap-1">
              <div className="bg-white rounded p-1 mb-2">
                <img src="/logo-dispusip.jpg" alt="DISPUSIP Tana Toraja" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-xl font-bold text-red-600 font-h2">DISPUSIP</h2>
              <span className="font-label-sm text-slate-500 uppercase tracking-wider">Member Portal</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto">
            {memberLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              
              if (isActive) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="border-l-4 border-red-600 bg-red-50/50 text-red-600 font-semibold flex items-center gap-3 px-6 py-3 ease-in-out scale-[0.98] active:scale-95 transition-all duration-150"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{link.icon}</span>
                    <span className="font-body-base text-body-base">{link.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="border-l-4 border-transparent text-slate-600 hover:bg-slate-100 flex items-center gap-3 px-6 py-3 transition-all duration-150 ease-in-out scale-[0.98] active:scale-95"
                >
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span className="font-body-base text-body-base">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-6 mt-auto">
            <a 
              href="mailto:support@dispusip.tanatorajakab.go.id?subject=Bantuan%20Sistem%20Perpustakaan"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent border border-outline text-on-surface-variant rounded font-label-md hover:bg-surface-variant transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
              Get Support
            </a>
          </div>
        </aside>
      </>
    );
  }

  // Admin Sidebar (Existing)
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[260px] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar-bg)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-white rounded p-1 w-12 h-12 flex items-center justify-center shadow-lg shadow-red-500/30">
              <img src="/logo-dispusip.jpg" alt="DISPUSIP Tana Toraja" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                DISPUSIP
              </h1>
              <p className="text-slate-400 text-[0.65rem] font-medium">
                Tana Toraja
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-600">
            Menu Utama
          </p>
          {adminLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[0.65rem] text-slate-500 truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
