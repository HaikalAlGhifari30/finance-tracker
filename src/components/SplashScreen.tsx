"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Start exit animation at 1.3s, call onComplete after fade at 1.7s
    const exitTimer = setTimeout(() => setExiting(true), 1300);
    const completeTimer = setTimeout(() => onComplete(), 1700);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #13111C 0%, #1E1E2D 60%, #13111C 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.4s ease-in" : "none",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute"
        style={{
          width: "260px",
          height: "260px",
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(24px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div
          className="splash-logo w-24 h-24 rounded-[28px] overflow-hidden"
          style={{
            boxShadow: "0 0 40px rgba(16,185,129,0.20), 0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <img src="/logo.png" alt="FinTrack" className="w-full h-full object-cover" />
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="splash-title text-white font-black text-3xl tracking-tight leading-none">
            FinTrack
          </h1>
          <p
            className="splash-subtitle text-[10px] font-bold tracking-[0.32em] uppercase"
            style={{ color: "rgba(52,211,153,0.75)" }}
          >
            Finance Tracking
          </p>
        </div>
      </div>

      {/* Bottom dots */}
      <div
        className="splash-subtitle absolute flex gap-1.5"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-90" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-40" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-20" />
      </div>
    </div>
  );
}
