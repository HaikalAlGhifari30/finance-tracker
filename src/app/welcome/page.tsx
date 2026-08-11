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
      className="min-h-[100dvh] w-full flex flex-col justify-between items-center relative overflow-hidden bg-[#13111C] py-8 px-4"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Premium organic background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_75%)] blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="w-full max-w-sm md:max-w-5xl flex justify-center items-center relative z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-[12px] overflow-hidden border border-emerald-500/10"
              style={{
                boxShadow: "0 0 15px rgba(16,185,129,0.12), 0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              <img src="/logo.png" alt="FinTrack" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-white font-black text-xl tracking-tight leading-none">FinTrack</h1>
          </div>
          <p className="text-[8px] font-bold tracking-[0.25em] text-emerald-400/80 uppercase mt-2.5 pl-0.5">
            Amankan masa depan
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div
        className="relative z-10 flex flex-col md:flex-row items-stretch justify-center w-full max-w-sm md:max-w-5xl gap-6 md:gap-8 my-auto pt-6 pb-4 transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left Card: Text Card */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-6 md:p-8 rounded-[24px] sm:rounded-[32px] flex flex-col justify-center text-center md:text-left shadow-[0_24px_50px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-white leading-tight mb-4">
            Kelola Keuangan<br/>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Lebih Mudah</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed max-w-[280px] md:max-w-[340px] mx-auto md:mx-0">
            Pantau pemasukan, pengeluaran, tabungan, alokasi dana, dan aset Anda dalam satu platform keuangan modern yang praktis.
          </p>
        </div>

        {/* Middle Card: Features Card */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-6 md:p-8 rounded-[24px] sm:rounded-[32px] flex flex-col justify-center text-center md:text-left shadow-[0_24px_50px_rgba(0,0,0,0.2)] mt-4 md:mt-0">
          <h3 className="text-sm font-bold tracking-wider text-emerald-400 uppercase mb-4 text-center md:text-left">Fitur Unggulan</h3>
          <ul className="space-y-3 text-xs text-gray-400 font-semibold text-left mx-auto md:mx-0 max-w-[260px] md:max-w-none">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 text-sm leading-none">✓</span>
              <span>Pencatatan arus kas masuk & keluar secara real-time.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 text-sm leading-none">✓</span>
              <span>Alokasi dana & target tabungan terencana (goals).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 text-sm leading-none">✓</span>
              <span>Pengelolaan multi-rekening & anggota keluarga.</span>
            </li>
          </ul>
        </div>

        {/* Right Card: Action/Login Card */}
        <div className="w-full md:max-w-xs flex flex-col justify-center mt-8 md:mt-0">
          <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] w-full shadow-[0_24px_50px_rgba(0,0,0,0.35)] flex flex-col gap-4 sm:gap-5">
            <div className="hidden md:block text-center pb-2 border-b border-white/[0.04]">
              <h3 className="text-white font-bold text-base">Selamat Datang</h3>
              <p className="text-gray-400 text-xs mt-1">Silakan masuk atau daftarkan akun baru</p>
            </div>

            <Link
              href="/login"
              className="w-full py-3.5 sm:py-4 rounded-2xl font-black text-white text-sm tracking-wide text-center active:scale-[0.98] transition-all bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:brightness-110 flex items-center justify-center gap-2"
            >
              Masuk
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="text-center pt-1 sm:pt-2">
              <span className="text-xs text-gray-500 font-semibold">Belum punya akun? </span>
              <Link
                href="/login?mode=register"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacer / Subtitle balance */}
      <div className="w-full max-w-sm md:max-w-4xl flex justify-center text-white/10 text-[8px] font-bold uppercase tracking-[0.2em] relative z-10 pt-4">
        Amankan masa depan
      </div>
    </div>
  );
}
