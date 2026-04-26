"use client";

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Plus, Target, TrendingUp, History, CreditCard, ChevronRight, Trophy, Star, 
  Wallet, Edit2, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, 
  ChevronLeft, Calendar, Filter 
} from "lucide-react";
import GoalModal from "./GoalModal";
import SavingsActionModal from "./SavingsActionModal";
import { Pagination } from "@/components/ui/Pagination";
import { useMemo, useEffect } from "react";
import { setMainGoal } from "@/app/actions/goals";
import { toast } from "sonner";
import GoalActionMenu from "./GoalActionMenu";
import { isSameMonth, isSameYear, parseISO } from "date-fns";

export default function SavingsClientPage({ totalSavingsPool, unallocatedSavings, goals, history, accounts }: { totalSavingsPool: number, unallocatedSavings: number, goals: any[], history: any[], accounts: any[] }) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalMode, setActionModalMode] = useState<"SAVING" | "WITHDRAWAL" | "ALLOCATE">("SAVING");
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());

  const changePeriod = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() + amount);
    } else {
      newDate.setFullYear(newDate.getFullYear() + amount);
    }
    setCurrentDate(newDate);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemDate = typeof item.date === 'string' ? parseISO(item.date) : new Date(item.date);
      if (viewMode === "monthly") {
        return isSameMonth(itemDate, currentDate) && isSameYear(itemDate, currentDate);
      } else {
        return isSameYear(itemDate, currentDate);
      }
    });
  }, [history, viewMode, currentDate]);

  const periodStats = useMemo(() => {
    let totalActivity = 0;
    let unallocatedActivity = 0;

    filteredHistory.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'SAVING') {
        totalActivity += amount;
        if (!t.goalId) unallocatedActivity += amount;
      } else if (t.type === 'WITHDRAWAL') {
        totalActivity -= amount;
        if (!t.goalId) unallocatedActivity -= amount;
      } else if (t.type === 'EXPENSE' && !t.accountId) {
        totalActivity -= amount;
        if (!t.goalId) unallocatedActivity -= amount;
      }
    });

    return { totalActivity, unallocatedActivity };
  }, [filteredHistory]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in text-left pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Tabungan & Goals</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-1">Satu saldo untuk berbagai tujuan masa depan Anda.</p>
        </div>
        <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-[#1E1E2D] p-1 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto justify-center">
            <div className="flex p-0.5 md:p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:rounded-xl border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("monthly")}
                className={`text-[8px] md:text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`text-[8px] md:text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-1 pr-1 md:pr-2">
              <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
              <div className="px-1 md:px-2 min-w-[80px] md:min-w-[100px] text-center">
                <span className="font-black text-[9px] md:text-[10px] text-gray-900 dark:text-white tracking-tight uppercase">
                  {viewMode === "monthly" ? format(currentDate, "MMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full sm:w-auto">
              <button 
                  onClick={() => { setActionModalMode("SAVING"); setIsActionModalOpen(true); }}
                  className="flex-1 sm:flex-none bg-white dark:bg-[#1E1E2D] text-amber-600 border border-amber-200 dark:border-amber-800 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[24px] text-xs md:text-sm font-black shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
              >
                  <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Menabung</span>
              </button>
              <button 
                  onClick={() => { setActionModalMode("WITHDRAWAL"); setIsActionModalOpen(true); }}
                  className="flex-1 sm:flex-none bg-white dark:bg-[#1E1E2D] text-blue-600 border border-blue-200 dark:border-blue-800 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[24px] text-xs md:text-sm font-black shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
              >
                  <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Tarik</span>
              </button>
              <button 
                  onClick={() => setIsGoalModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 md:py-4 rounded-2xl md:rounded-[24px] text-xs md:text-sm font-black shadow-xl shadow-amber-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
              >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Goal Baru</span>
              </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Gold Summary Card */}
        <GlassCard className="lg:col-span-4 p-8 md:p-10 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 text-white border-none shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex flex-col justify-between relative overflow-hidden group text-center md:text-left">
           <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Trophy className="w-32 md:w-40 h-32 md:h-40 rotate-12" />
           </div>
            <div className="relative z-10">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                     <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-200 fill-yellow-200" />
                 </div>
                 <p className="text-amber-100 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] opacity-90">Total Tabungan</p>
               </div>
               <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Rp {totalSavingsPool.toLocaleString("id-ID")}</h3>
               <div className="mt-3 md:mt-4 flex items-center justify-center md:justify-start gap-2">
                 <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md border border-white/10 ${periodStats.totalActivity >= 0 ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'}`}>
                    {periodStats.totalActivity >= 0 ? '+' : ''} Rp {periodStats.totalActivity.toLocaleString("id-ID")} ({viewMode === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})
                 </span>
               </div>
            </div>
           <div className="mt-8 md:mt-12 relative z-10 flex justify-center md:justify-start">
              <div className="flex items-center gap-2 text-amber-100/80 text-[9px] md:text-[10px] font-black uppercase tracking-wider bg-black/10 w-fit px-4 md:px-5 py-2.5 rounded-full backdrop-blur-md border border-white/5">
                 <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 h-4 text-amber-300" />
                 Dana Terpisah
              </div>
           </div>
        </GlassCard>

        {/* Goals List */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-2">
                <h3 className="font-black text-lg md:text-xl text-gray-900 dark:text-white flex items-center gap-3">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                    Tujuan Tabungan
                </h3>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Set Utama</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{goals.length} Goals Aktif</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {/* Tabungan Umum Card */}
                <GlassCard className="p-6 md:p-8 border-dashed border-2 border-amber-200 dark:border-amber-900/50 hover:border-amber-500/50 transition-all group relative overflow-hidden bg-amber-50/10 dark:bg-amber-900/5">
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                        <div className="space-y-1">
                            <h4 className="font-black text-lg md:text-xl text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">Tabungan Umum</h4>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Dana Belum Dialokasikan</p>
                        </div>
                        <div className="p-2.5 md:p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                            <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest block">Total Tersedia</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl md:text-2xl font-black text-amber-600 tracking-tight">Rp {unallocatedSavings.toLocaleString("id-ID")}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${periodStats.unallocatedActivity >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {periodStats.unallocatedActivity >= 0 ? '+' : ''} {periodStats.unallocatedActivity.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3">
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 italic leading-tight">
                                Alokasikan dana ke goal tertentu kapan saja.
                            </p>
                            <button 
                                onClick={() => {
                                    setActionModalMode("ALLOCATE");
                                    setIsActionModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shrink-0 active:scale-95"
                            >
                                Alokasi
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {goals.map((goal) => {
                    const goalBalance = Number(goal.balance || 0);
                    const targetAmount = Number(goal.targetAmount);
                    const progress = Math.min((goalBalance / targetAmount) * 100, 100);
                    const actualProgress = (goalBalance / targetAmount) * 100;
                    const isMain = goal.isMain;
                    
                    return (
                        <GlassCard key={goal.id} className={`p-6 md:p-8 hover:border-amber-500/50 transition-all group relative overflow-hidden ${isMain ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl shadow-amber-500/10' : ''}`}>
                            {isMain && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-amber-500 text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                                        <Star className="w-2 h-2 fill-white" />
                                        Utama
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-lg md:text-xl text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors truncate max-w-[100px] md:max-w-[150px]">{goal.name}</h4>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startTransition(async () => {
                                                    const res = await setMainGoal(isMain ? null : goal.id);
                                                    if (res.error) toast.error(res.error);
                                                    else toast.success(isMain ? "Berhasil menghapus goals utama" : `"${goal.name}" dipilih sebagai goals utama!`);
                                                });
                                            }}
                                            className={`p-1.5 md:p-2 rounded-xl transition-all ${isMain ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-gray-300 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                            title={isMain ? "Hapus dari Utama" : "Set sebagai Utama"}
                                        >
                                            <Star className={`w-3.5 h-3.5 md:w-4 h-4 ${isMain ? 'fill-amber-500' : ''}`} />
                                        </button>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Target: Rp {targetAmount.toLocaleString("id-ID")}</p>
                                </div>
                                <div className="flex gap-1.5 md:gap-2">
                                    <div className={`p-2 md:p-3 rounded-2xl transition-all ${progress >= 100 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                                        <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <GoalActionMenu 
                                        goal={goal} 
                                        onEdit={(g) => {
                                            setSelectedGoal(g);
                                            setIsGoalModalOpen(true);
                                        }} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-5">
                                <div className="space-y-1 text-left">
                                    <span className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Terkumpul</span>
                                    <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
                                        <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-500 tracking-tight">Rp {goalBalance.toLocaleString("id-ID")}</span>
                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400">/ Rp {targetAmount.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Pencapaian</span>
                                        <span className="text-xs md:text-sm font-black text-amber-500">{actualProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 md:h-3 bg-gray-50 dark:bg-gray-800/50 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}

                {goals.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 md:p-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[24px] md:rounded-[32px] bg-gray-50/50 dark:bg-gray-900/50">
                        <Target className="w-6 md:w-8 h-6 md:h-8 text-gray-300 mb-3" />
                        <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada Goal Spesifik</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="font-black text-lg md:text-xl text-gray-900 dark:text-white flex items-center gap-3 px-2">
            <History className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
            Riwayat Tabungan
        </h3>
        <GlassCard className="p-0 overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            {history.length === 0 ? (
                <div className="p-10 md:p-20 text-center">
                    <p className="text-xs md:text-sm text-gray-400 font-bold italic">Belum ada riwayat setoran tabungan.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
                        <thead>
                            <tr className="bg-gray-100/70 dark:bg-gray-800/50">
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Tanggal</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Jenis</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 text-center whitespace-nowrap">Goal</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Keterangan</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 text-center whitespace-nowrap">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors group">
                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">
                                        {format(new Date(item.date), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                        {item.type === 'ALLOCATION' ? (
                                            <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                                                <ArrowRightLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Alokasi
                                            </span>
                                        ) : !item.accountId && item.type === 'SAVING' ? (
                                            <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                                                <ArrowUpCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Masuk
                                            </span>
                                        ) : !item.accountId && item.type === 'WITHDRAWAL' ? (
                                            <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                                                <ArrowDownCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Keluar
                                            </span>
                                        ) : item.type === 'SAVING' ? (
                                            <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest whitespace-nowrap">
                                                <ArrowUpCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Nabung
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
                                                <ArrowDownCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Tarik
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
                                                {item.goalName}
                                            </span>
                                            {item.type === 'ALLOCATION' && (
                                                <>
                                                    <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 shrink-0" />
                                                    <span className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800/50 whitespace-nowrap">
                                                        {item.destinationGoalName}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm text-gray-500 dark:text-gray-500 font-medium max-w-[150px] truncate">
                                        {item.description || "-"}
                                    </td>
                                    <td className={`px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm font-black text-center whitespace-nowrap ${
                                        item.type === 'ALLOCATION' ? 'text-emerald-600' :
                                        !item.accountId && (item.type === 'SAVING' || item.type === 'WITHDRAWAL') ? 'text-emerald-600' :
                                        item.type === 'SAVING' ? 'text-amber-600' : 'text-blue-600'
                                    }`}>
                                        {item.type === 'SAVING' || item.type === 'ALLOCATION' ? '+' : '-'} Rp {Number(item.amount).toLocaleString("id-ID")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(history.length / pageSize)}
                  totalItems={history.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
                </>
            )}
        </GlassCard>
      </div>

      <GoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => {
            setIsGoalModalOpen(false);
            setSelectedGoal(null);
        }} 
        initialData={selectedGoal}
      />
      <SavingsActionModal 
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        mode={actionModalMode}
        accounts={accounts}
        goals={goals}
        unallocatedSavings={unallocatedSavings}
      />
    </div>
  );
}
