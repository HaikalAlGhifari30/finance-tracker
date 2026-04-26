"use client";

import { useEffect } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  // Force light mode on login page
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }
    // We don't necessarily want to overwrite localStorage here 
    // in case they just navigated to login without logging out,
    // but the request says "halaman login selalu menggunakan light mode".
    // So we just ensure the class is removed for this view.
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-4 py-10 sm:py-0">
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* Glow kiri atas */}
      <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] bg-emerald-400 opacity-20 blur-3xl rounded-full" />

      {/* Glow kanan bawah */}
      <div className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-teal-400 opacity-20 blur-3xl rounded-full" />

      <div className="relative z-10 w-full max-w-sm rounded-[3rem] border border-gray-200/50 bg-white backdrop-blur-md p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 overflow-hidden">
             <img src="/logo.png" alt="FinTrack Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Keuangan</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Lacak dan kelola pengeluaran Anda</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
