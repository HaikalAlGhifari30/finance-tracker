"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-center items-center relative overflow-hidden bg-[#13111C]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Premium organic background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_75%)] blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div
        className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-10 w-full max-w-sm md:max-w-4xl gap-10 md:gap-16 transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left Column: Branding and Intro */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 w-full">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-[16px] overflow-hidden border border-emerald-500/10"
              style={{
                boxShadow: "0 0 20px rgba(16,185,129,0.12), 0 8px 24px rgba(0,0,0,0.5)"
              }}
            >
              <img src="/logo.png" alt="FinTrack" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-white font-black text-2xl tracking-tight leading-none">FinTrack</h1>
          </div>
          <p className="text-[9px] font-bold tracking-[0.25em] text-emerald-400/80 uppercase mt-3.5 pl-1 mb-8 md:mb-12">
            Amankan masa depan
          </p>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight mb-4">
            Kelola Keuangan<br/>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Lebih Mudah</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed max-w-[260px] md:max-w-[340px]">
            Pantau pemasukan, pengeluaran, tabungan, alokasi dana, dan aset Anda dalam satu platform keuangan modern yang praktis.
          </p>
        </div>

        {/* Right Column: Actions Glass Card */}
        <div className="w-full md:max-w-sm flex-1">
          <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-8 rounded-[32px] w-full shadow-[0_24px_50px_rgba(0,0,0,0.35)] flex flex-col gap-5">
            <div className="hidden md:block text-center pb-2 border-b border-white/[0.04]">
              <h3 className="text-white font-bold text-base">Selamat Datang</h3>
              <p className="text-gray-400 text-xs mt-1">Silakan masuk atau daftarkan akun baru</p>
            </div>

            <Link
              href="/login"
              className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide text-center active:scale-[0.98] transition-all bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:brightness-110 flex items-center justify-center gap-2"
            >
              Masuk ke Akun
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="text-center pt-2">
              <span className="text-xs text-gray-500 font-semibold">Belum punya akun? </span>
              <Link
                href="/login?mode=register"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
