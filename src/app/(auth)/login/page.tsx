"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0" 
          style={{ 
            backgroundImage: "url('/library-bg.jpg')", 
            backgroundSize: "cover", 
            backgroundPosition: "center" 
          }}
        />
        <div className="absolute inset-0 z-0 bg-red-900/70 mix-blend-multiply" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-red-950/90 via-red-900/40 to-transparent" />
        
        <div className="absolute inset-0 z-0">
          {/* Decorative circles */}
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white rounded-xl p-2 w-20 h-20 shadow-xl flex items-center justify-center overflow-hidden">
               <img src="/logo-dispusip.jpg" alt="DISPUSIP Tana Toraja" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">DISPUSIP</h1>
              <p className="text-xl text-white/90 drop-shadow-md">Tana Toraja</p>
            </div>
          </div>
          <p className="text-xl text-red-200 leading-relaxed max-w-md mb-8">
            Kelola koleksi buku, peminjaman, dan anggota perpustakaan Anda dengan sistem manajemen modern dan efisien.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { label: "Manajemen Buku", desc: "CRUD lengkap" },
              { label: "Peminjaman", desc: "Tracking otomatis" },
              { label: "Denda Otomatis", desc: "Kalkulasi real-time" },
              { label: "Laporan", desc: "Export CSV" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <p className="text-white text-sm font-semibold">{feature.label}</p>
                <p className="text-red-300 text-xs mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-3 mb-8">
            <div className="bg-white rounded-2xl p-2 w-24 h-24 shadow-md flex items-center justify-center overflow-hidden">
               <img src="/logo-dispusip.jpg" alt="DISPUSIP Tana Toraja" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 text-center leading-tight">DISPUSIP<br/><span className="text-lg text-slate-500">Tana Toraja</span></h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Masuk</h2>
              <p className="text-slate-500 text-sm mt-1">
                Masukkan kredensial untuk mengakses akun Anda
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Belum punya akun?{" "}
                <Link href="/register" className="text-red-600 font-semibold hover:text-red-700">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 DISPUSIP Tana Toraja. Sistem Manajemen Perpustakaan.
          </p>
        </div>
      </div>
    </div>
  );
}
