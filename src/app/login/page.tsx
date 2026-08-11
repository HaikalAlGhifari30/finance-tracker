"use client";

import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const isRegisterMode = searchParams.get("mode") === "register";

  return (
    <div className="dark min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#13111C] px-4 py-10 sm:py-0">
      
      {/* Premium organic background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_75%)] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-8 sm:p-10 rounded-[32px] shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-[12px] overflow-hidden border border-emerald-500/10"
              style={{
                boxShadow: "0 0 15px rgba(16,185,129,0.12), 0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              <img src="/logo.png" alt="FinTrack Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">FinTrack</h1>
          </div>
          <p className="text-[9px] font-bold tracking-[0.25em] text-emerald-400/80 uppercase mt-2.5">
            Sistem Keuangan
          </p>
        </div>
        <LoginForm initialMode={isRegisterMode} />
      </div>
    </div>
  );
}

