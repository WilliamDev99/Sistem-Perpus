"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Users,
  BookCopy,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useNotificationStore } from "@/store/notification-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeBorrows: number;
  pendingBorrows: number;
  overdueBorrowCount: number;
  pendingFines: number;
  totalFineAmount: number;
  monthlyBorrows: Array<{ month: string; count: number | bigint }>;
}

interface RecentBorrow {
  id: string;
  user: { name: string };
  book: { title: string };
  status: string;
  borrowDate: string;
  dueDate: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<RecentBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const { setNotifications } = useNotificationStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, borrowsRes, notifRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/borrows?limit=5"),
          fetch("/api/notifications"),
        ]);

        const statsData = await statsRes.json();
        const borrowsData = await borrowsRes.json();
        const notifData = await notifRes.json();

        if (statsData.success) setStats(statsData.data);
        if (borrowsData.success) setRecentBorrows(borrowsData.data);
        if (notifData.success) setNotifications(notifData.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setNotifications]);

  const monthNames: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu",
    "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
  };

  const chartRef = useRef<ChartJS<"bar">>(null);

  const chartData = {
    labels: stats?.monthlyBorrows?.map((m) => {
      const [, month] = m.month.split("-");
      return monthNames[month] || month;
    }) || [],
    datasets: [
      {
        label: "Peminjaman",
        data: stats?.monthlyBorrows?.map((m) => Number(m.count)) || [],
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(220, 38, 38, 0.8)";
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(220, 38, 38, 0.5)");
          gradient.addColorStop(1, "rgba(185, 28, 28, 0.95)");
          return gradient;
        },
        hoverBackgroundColor: "rgba(185, 28, 28, 1)",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.4,
        categoryPercentage: 0.6,
        maxBarThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeOutQuart" as const,
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#e2e8f0",
        titleFont: { size: 13, weight: "bold" as const },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items: any) => items[0]?.label || "",
          label: (item: any) => `${item.raw} peminjaman`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#94a3b8",
          font: { size: 12, weight: 500 },
          padding: 12,
          callback: (value: any) => {
            if (value >= 1000) return `${value / 1000}k`;
            return value;
          },
        },
        grid: {
          color: "rgba(226, 232, 240, 0.5)",
          drawTicks: false,
        },
        border: { display: false },
      },
      x: {
        ticks: {
          color: "#94a3b8",
          font: { size: 12, weight: 600 },
          padding: 12,
        },
        grid: { display: false },
        border: { display: false },
      },
    },
    layout: {
      padding: { top: 10, right: 10, bottom: 0, left: 0 },
    },
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "badge-pending",
      BORROWED: "badge-borrowed",
      RETURNED: "badge-returned",
      OVERDUE: "badge-overdue",
    };
    const labels: Record<string, string> = {
      PENDING: "Menunggu",
      BORROWED: "Dipinjam",
      RETURNED: "Dikembalikan",
      OVERDUE: "Terlambat",
    };
    return <span className={`badge ${styles[status] || ""}`}>{labels[status] || status}</span>;
  };

  const getMemberStatusBadge = (status: string, dueDate: string) => {
    if (status === "RETURNED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Dikembalikan
        </span>
      );
    }

    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (status === "OVERDUE" || diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Terlambat {overdueDays} hari
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          Hari ini
        </span>
      );
    }
    if (diffDays <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {diffDays} hari lagi
        </span>
      );
    }
    if (status === "PENDING") {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-variant text-on-surface-variant font-label-sm text-label-sm">Menunggu</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary/10 text-secondary font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[14px]">check_circle</span>
        {diffDays} hari lagi
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pt-2 pb-12 flex-1 w-full animate-in fade-in duration-500">
        {/* Greeting Section */}
        <section className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-1">Halo, {session?.user?.name?.split(" ")[0] || "Member"}!</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Selamat datang kembali di Perpustakaan Daerah Tana Toraja. Hari ini adalah hari yang baik untuk membaca.</p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 lg:grid-cols-3">
          {/* Stat Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Buku Dipinjam</p>
                <h3 className="font-h1 text-h1 text-on-surface">{stats?.activeBorrows || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">menu_book</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm flex items-center gap-1">
              {(stats?.overdueBorrowCount || 0) > 0 ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                  <span className="text-error">{stats?.overdueBorrowCount} buku terlambat</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                  <span className="text-secondary">Semua dalam batas waktu</span>
                </>
              )}
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Buku Terlambat</p>
                <h3 className="font-h1 text-h1 text-error">{stats?.overdueBorrowCount || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[24px]">assignment_late</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-outline flex items-center gap-1">
              {(stats?.overdueBorrowCount || 0) > 0 ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                  <span className="text-error">Denda {formatCurrency(stats?.totalFineAmount || 0)}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                  Tidak ada denda
                </>
              )}
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-transparent">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Pinjaman</p>
                <h3 className="font-h1 text-h1 text-on-surface">
                  {stats?.monthlyBorrows?.reduce((acc, curr) => acc + Number(curr.count), 0) || stats?.activeBorrows || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">history</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-outline flex items-center gap-1">
              Sejak bergabung {new Date().getFullYear()}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Sedang Dipinjam Section */}
          <section className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-h2 text-h2 text-on-surface">Sedang Dipinjam</h2>
              <Link href="/my-borrows" className="font-label-md text-label-md text-primary hover:text-primary-fixed-variant transition-colors flex items-center gap-1">
                Lihat Semua
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
            
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-surface-container">
                      <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Buku</th>
                      <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Tanggal Pinjam</th>
                      <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Batas Waktu</th>
                      <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Status</th>
                      <th className="p-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBorrows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-outline font-body-sm">Belum ada buku yang sedang dipinjam.</td>
                      </tr>
                    ) : (
                      recentBorrows.map((borrow) => (
                        <tr key={borrow.id} className="border-b border-surface-container hover:bg-surface-bright transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-14 bg-surface-container rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {(borrow.book as any).coverImage ? (
                                  <img src={(borrow.book as any).coverImage} alt={borrow.book.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-outline">menu_book</span>
                                )}
                              </div>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface line-clamp-1">{borrow.book.title}</p>
                                <p className="font-body-sm text-body-sm text-outline">{(borrow.book as any).author || "Penulis"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-body-sm text-body-sm text-on-surface-variant">{formatDate(borrow.borrowDate)}</td>
                          <td className="p-4 font-body-sm text-body-sm text-on-surface-variant">{formatDate(borrow.dueDate)}</td>
                          <td className="p-4">
                            {getMemberStatusBadge(borrow.status, borrow.dueDate)}
                          </td>
                          <td className="p-4 text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded font-label-sm text-label-sm">
                              <span className="material-symbols-outlined text-[14px]">menu_book</span>
                              Dipinjam
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Rekomendasi / Denda Section */}
          <section className="xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-h2 text-h2 text-on-surface">Denda & Pembayaran</h2>
              <Link href="/fines" className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline transition-colors">
                <span className="material-symbols-outlined text-[20px]">history</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Total Balance Card */}
              <div className="bg-primary text-on-primary rounded-xl p-5 shadow-sm">
                <p className="font-label-sm text-label-sm opacity-80 uppercase tracking-wider mb-1">Total Tagihan</p>
                <h3 className="font-h1 text-h1">{formatCurrency(stats?.totalFineAmount || 0)}</h3>
                <p className="font-body-sm text-body-sm mt-2 opacity-90">{stats?.pendingFines || 0} denda belum dibayar</p>
              </div>

              {/* Fine Items List - Currently Empty or Dynamic */}
              <div className="flex flex-col gap-3">
                {stats?.pendingFines === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container text-center">
                    <span className="material-symbols-outlined text-secondary text-3xl mb-2">check_circle</span>
                    <p className="font-label-md text-on-surface">Bagus!</p>
                    <p className="font-body-sm text-outline">Anda tidak memiliki tagihan denda.</p>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container flex flex-col gap-2">
                     <p className="font-body-sm text-on-surface-variant text-center">Anda memiliki {stats?.pendingFines} denda tertunda.</p>
                  </div>
                )}
              </div>

              {/* Pay Now Button */}
              {stats?.totalFineAmount && stats.totalFineAmount > 0 ? (
                <Link href="/fines" className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  Bayar Sekarang
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Admin Dashboard (Existing Layout)
  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan Sistem Perpustakaan Daerah Tana Toraja
          </p>
        </div>
        <a
          href="/api/export?type=borrows"
          className="btn btn-secondary text-sm"
        >
          <Download className="w-4 h-4" />
          Export Data
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100 font-medium">Total Buku</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalBooks || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card sky">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sky-100 font-medium">Total Anggota</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card emerald">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100 font-medium">Peminjaman Aktif</p>
              <p className="text-3xl font-bold mt-1">{stats?.activeBorrows || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BookCopy className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100 font-medium">Denda Pending</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(stats?.totalFineAmount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Borrowing Trends</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              6 Bulan Terakhir
            </span>
          </div>
          <div className="h-[300px]">
            {stats?.monthlyBorrows && stats.monthlyBorrows.length > 0 ? (
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <BookCopy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada data peminjaman</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {stats?.pendingBorrows && stats.pendingBorrows > 0 ? (
            <div className="card-glass p-4 border-l-4 border-l-amber-400">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">
                    {stats.pendingBorrows} Permintaan Baru
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menunggu persetujuan Anda
                  </p>
                  <Link
                    href="/borrows?status=PENDING"
                    className="text-xs text-red-600 font-medium mt-2 inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Lihat detail <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {stats?.pendingFines && stats.pendingFines > 0 ? (
            <div className="card-glass p-4 border-l-4 border-l-red-400">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">
                    {stats.pendingFines} Denda Belum Bayar
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total {formatCurrency(stats.totalFineAmount)}
                  </p>
                  <Link
                    href="/fines"
                    className="text-xs text-red-600 font-medium mt-2 inline-flex items-center gap-1 hover:text-red-700"
                  >
                    Kelola denda <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick links */}
          <div className="card-glass p-4">
            <h4 className="font-semibold text-sm text-slate-800 mb-3">Aksi Cepat</h4>
            <div className="space-y-2">
              <Link
                href="/books/create"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <BookOpen className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm text-slate-700 font-medium">Tambah Buku Baru</span>
              </Link>
              <Link
                href="/books"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <BookCopy className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-700 font-medium">Lihat Semua Buku</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Borrows Table */}
      <div className="card-glass overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Peminjaman Terbaru</h3>
          <Link
            href="/borrows"
            className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
          >
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Peminjam</th>
                <th>Buku</th>
                <th>Tanggal Pinjam</th>
                <th>Batas Kembali</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBorrows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Belum ada peminjaman
                  </td>
                </tr>
              ) : (
                recentBorrows.map((borrow) => (
                  <tr key={borrow.id}>
                    <td className="font-medium">{borrow.user.name}</td>
                    <td>{borrow.book.title}</td>
                    <td>{formatDate(borrow.borrowDate)}</td>
                    <td>{formatDate(borrow.dueDate)}</td>
                    <td>{getStatusBadge(borrow.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
