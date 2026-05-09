"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { useNotificationStore } from "@/store/notification-store";
import NotificationPanel from "@/components/notifications/NotificationPanel";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { unreadCount, isOpen, togglePanel } = useNotificationStore();
  const isAdmin = session?.user?.role === "ADMIN";
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.profileImage) {
            setProfileImage(data.data.profileImage);
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  if (!isAdmin) {
    return (
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 h-16 w-full font-['Inter'] text-base">
        <div className="flex items-center lg:hidden">
          <button onClick={onMenuClick} className="mr-3 text-slate-500 hover:text-red-600">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <img src="/logo-dispusip.jpg" alt="DISPUSIP" className="w-8 h-8 rounded-full object-contain mr-2" />
          <span className="text-lg font-semibold text-slate-900 font-h3">DISPUSIP Tana Toraja</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 flex-1">
          <img src="/logo-dispusip.jpg" alt="DISPUSIP" className="w-9 h-9 rounded-full object-contain flex-shrink-0" />
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-full font-body-sm text-on-surface outline-none transition-all" 
              placeholder="Cari buku, penulis..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="relative">
            <button 
              onClick={togglePanel}
              className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer duration-200 relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {isOpen && <NotificationPanel />}
          </div>
          
          <button className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer duration-200">
            <span className="material-symbols-outlined">settings</span>
          </button>
          
          <div className="relative group">
            <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center overflow-hidden border border-primary-fixed cursor-pointer">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm">{session?.user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            
            {/* Simple Dropdown for Logout */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{session?.user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Admin Header
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Menu button + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Selamat datang, {session?.user?.name?.split(" ")[0] || "User"} 👋
            </h2>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={togglePanel}
              className="relative p-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {isOpen && <NotificationPanel />}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700">
                {session?.user?.name}
              </p>
              <p className="text-[0.7rem] text-slate-400">
                {session?.user?.role === "ADMIN" ? "Admin" : "Anggota"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
