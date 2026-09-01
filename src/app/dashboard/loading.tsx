"use client";

import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-150">
      <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 shadow-sm flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
      <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">
        Memuat Data...
      </p>
    </div>
  );
}
