"use client";

import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ToastProvider } from "@/components/ui/Toast";
import Chatbot from "@/components/chatbot/Chatbot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:pl-[260px]">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</main>
          </div>
          <Chatbot />
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
