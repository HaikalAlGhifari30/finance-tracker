"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Shield, TrendingUp, PiggyBank } from "lucide-react";

export default function WelcomePage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay for a smooth entry after splash redirect
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const features = [
    { icon: TrendingUp, label: "Lacak pemasukan & pengeluaran" },
    { icon: PiggyBank, label: "Kelola tabungan & alokasi dana" },
    { icon: Shield, label: "Aman & multi-anggota" },
  ];

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #13111C 0%, #1a1827 50%, #13111C 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background glow top */}
      <div
        className="absolute top-[-80px] left-1/2 -translate-x-1/2"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Background glow bottom */}
      <div
        className="absolute bottom-[-60px] right-[-60px]"
        style={{
          width: "280px",
          height: "280px",
          background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col flex-1 items-center justify-between px-6 py-12 max-w-sm mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        {/* Top: Logo + Brand */}
        <div className="flex flex-col items-center gap-6 mt-8">
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 0 30px rgba(16,185,129,0.18), 0 16px 48px rgba(0,0,0,0.5)" }}
          >
            <img src="/logo.png" alt="FinTrack" className="w-full h-full object-cover" />
          </div>

          {/* Brand text */}
          <div className="text-center">
            <h1 className="text-white font-black text-2xl tracking-tight mb-1">
              FinTrack
            </h1>
            <p
              className="text-[10px] font-bold tracking-[0.28em] uppercase"
              style={{ color: "rgba(52,211,153,0.7)" }}
            >
              Finance Tracking
            </p>
          </div>
        </div>

        {/* Middle: Headline + features */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-3">
            <h2
              className="text-2xl font-black leading-tight"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              Kelola Keuangan<br />Lebih Mudah
            </h2>
            <p
              className="text-sm font-medium leading-relaxed max-w-[260px]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Pantau pemasukan, pengeluaran, tabungan, dan aset Anda dalam satu tempat.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.12)" }}
                >
                  <f.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: CTA Buttons */}
        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm tracking-wide active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              boxShadow: "0 8px 32px rgba(16,185,129,0.30), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            Masuk
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login?mode=register"
            className="w-full flex items-center justify-center py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-all"
            style={{
              color: "rgba(52,211,153,0.85)",
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            Belum punya akun?&nbsp;
            <span className="font-black">Daftar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
