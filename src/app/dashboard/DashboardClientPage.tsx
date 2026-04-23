"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth, isSameYear, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Trophy, Sparkles,
  CreditCard, Calendar, List, ChevronLeft, ChevronRight, Star
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import ActivityLogClient from "./ActivityLogClient";

interface DashboardClientPageProps {
  initialActivities: any[];
  user: { name: string | null };
  mainGoal?: any;
  mainBalance: number;
  totalSavings: number;
  totalAssets: number;
}

export default function DashboardClientPage({ initialActivities, user, mainGoal, mainBalance: overallMainBalance, totalSavings: overallTotalSavings, totalAssets: overallTotalAssets }: DashboardClientPageProps) {
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

  const filteredActivities = useMemo(() => {
    return initialActivities.filter((activity) => {
      const activityDate = typeof activity.date === 'string' ? parseISO(activity.date) : new Date(activity.date);
      if (viewMode === "monthly") {
        return isSameMonth(activityDate, currentDate) && isSameYear(activityDate, currentDate);
      } else {
        return isSameYear(activityDate, currentDate);
      }
    });
  }, [initialActivities, viewMode, currentDate]);

  // Calculate all stats for the selected period
  const stats = useMemo(() => {
    let periodIncome = 0;
    let periodExpenseMain = 0;
    let periodExpenseSavings = 0;
    let periodSavingsInflow = 0;

    filteredActivities.forEach((act) => {
      const amount = Number(act.amount);
      if (act.type === "INCOME") {
        periodIncome += amount;
      } else {
        if (act.source === "MAIN") {
          periodExpenseMain += amount;
          if (act.categoryName?.toLowerCase() === "tabungan") {
            periodSavingsInflow += amount;
          }
        } else {
          periodExpenseSavings += amount;
        }
      }
    });

    const mainBalance = periodIncome - periodExpenseMain;
    const totalSavings = periodSavingsInflow - periodExpenseSavings;
    const totalAssets = mainBalance + totalSavings;

    return {
      income: periodIncome,
      expense: periodExpenseMain,
      mainBalance,
      totalSavings,
      totalAssets,
    };
  }, [filteredActivities]);

  // Overall stats (not period based) for the main goal
  const overallSavingsPool = overallTotalSavings;

  return (
    <div className="space-y-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Halo, {user.name}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            Pantau perkembangan aset dan tabungan Anda <span className="text-slate-900 dark:text-slate-200 font-bold">
              {viewMode === "monthly" ? format(currentDate, "MMMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
            </span>.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-[11px] font-black text-gray-400 bg-white dark:bg-[#1E1E2D] px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 uppercase tracking-widest flex items-center gap-3">
            <Calendar className="w-4 h-4 text-emerald-500" />
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </div>

          {/* Period Filter Component */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex p-1 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("monthly")}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-1 pr-2">
              <button onClick={() => changePeriod(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <div className="px-2 min-w-[120px] text-center">
                <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight uppercase">
                  {viewMode === "monthly" ? format(currentDate, "MMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Aset */}
        <GlassCard className="lg:col-span-2 p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-10">
            <div>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Aset Keseluruhan</p>
              <h3 className={`text-5xl font-black tracking-tighter ${overallTotalAssets < 0 ? 'text-rose-400' : 'text-white'}`}>
                Rp {overallTotalAssets.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-700/50">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Saldo Utama</p>
                <p className={`font-bold text-sm ${overallMainBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Rp {overallMainBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex-1 bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-700/50">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Tabungan</p>
                <p className={`font-bold text-sm ${overallTotalSavings < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                  Rp {overallTotalSavings.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Total Pemasukan - BLUE */}
        <Link href="/dashboard/income" className="block">
          <GlassCard className="h-full p-8 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-2xl font-black text-blue-600">Rp {stats.income.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>

        {/* Total Pengeluaran - ORANGE */}
        <Link href="/dashboard/expenses" className="block">
          <GlassCard className="h-full p-8 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-2xl font-black text-orange-600">Rp {stats.expense.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Tabungan - GOLD or MAIN GOAL */}
        <Link href="/dashboard/savings" className="lg:col-span-2">
            {mainGoal ? (
                (() => {
                    const progress = (overallSavingsPool / Number(mainGoal.targetAmount)) * 100;
                    const isCompleted = progress >= 100;
                    
                    return (
                        <GlassCard className={`h-full p-8 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] border ${
                            isCompleted 
                            ? 'bg-gradient-to-br from-[#B45309] via-[#F59E0B] to-[#B45309] border-amber-400 shadow-2xl shadow-amber-500/20' 
                            : 'bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] border-indigo-500/20 shadow-2xl shadow-indigo-500/10'
                        }`}>
                            {/* Decorative Background Elements */}
                            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-all duration-700 ${
                                isCompleted ? 'bg-white/20 group-hover:bg-white/30' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
                            }`} />
                            <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl ${
                                isCompleted ? 'bg-amber-400/20' : 'bg-violet-500/5'
                            }`} />
                            
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                                <Trophy className={`w-24 h-24 ${isCompleted ? 'text-white' : 'text-indigo-400'}`} />
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg border ${
                                            isCompleted ? 'bg-white/20 border-white/30' : 'bg-indigo-500/20 border-indigo-500/30'
                                        }`}>
                                            <Star className={`w-3.5 h-3.5 ${isCompleted ? 'text-white fill-white' : 'text-indigo-400 fill-indigo-400'}`} />
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isCompleted ? 'text-amber-50' : 'text-indigo-300'}`}>
                                            {isCompleted ? 'Goal Tercapai' : 'Target Prioritas'}
                                        </p>
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-none">{mainGoal.name}</h3>
                                </div>
                                
                                <div className="mt-8 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest block ${isCompleted ? 'text-amber-50/70' : 'text-indigo-300/50'}`}>Progress</span>
                                            <span className="text-3xl font-black text-white leading-none tracking-tighter">
                                                {Math.min(progress, 100).toFixed(1)}<span className={`text-lg ${isCompleted ? 'text-white' : 'text-indigo-400'}`}>%</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                isCompleted 
                                                ? 'bg-white/20 text-white border-white/30' 
                                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            }`}>
                                                {isCompleted ? 'Selesai' : 'Aktif'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className={`h-2 rounded-full overflow-hidden border ${isCompleted ? 'bg-white/20 border-white/10' : 'bg-black/20 border-white/5'}`}>
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 relative ${
                                                    isCompleted 
                                                    ? 'bg-gradient-to-r from-amber-200 via-white to-amber-200 shadow-[0_0_20px_rgba(255,255,255,0.6)]' 
                                                    : 'bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                                                }`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            >
                                                <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-3 rounded-xl border transition-colors backdrop-blur-sm ${
                                            isCompleted ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'
                                        }`}>
                                            <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${isCompleted ? 'text-amber-50/60' : 'text-indigo-200/40'}`}>Terkumpul</span>
                                            <span className="text-sm font-black text-white tracking-tight">Rp {overallSavingsPool.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl border transition-colors backdrop-blur-sm ${
                                            isCompleted ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'
                                        }`}>
                                            <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${isCompleted ? 'text-amber-50/60' : 'text-indigo-200/40'}`}>Target</span>
                                            <span className="text-sm font-black text-white tracking-tight">Rp {Number(mainGoal.targetAmount).toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })()
            ) : (
                <GlassCard className={`h-full p-6 border-none shadow-xl transition-all cursor-pointer relative overflow-hidden group ${
                    stats.totalSavings < 0 
                    ? 'bg-gradient-to-br from-rose-600 to-rose-800 shadow-rose-500/20' 
                    : 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/20'
                } hover:scale-[1.01]`}>
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                        <Trophy className="w-20 h-20" />
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${stats.totalSavings < 0 ? 'text-rose-100' : 'text-amber-100'}`}>
                            {stats.totalSavings < 0 ? 'Defisit Tabungan' : 'Dana Tabungan Terkumpul'}
                        </p>
                        <h3 className={`text-3xl font-black ${stats.totalSavings < 0 ? 'text-white' : 'text-white'}`}>
                            Rp {stats.totalSavings.toLocaleString("id-ID")}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-md text-white">
                            {stats.totalSavings < 0 ? 'Periksa Pengeluaran' : 'Lihat Progres'} <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </GlassCard>
            )}
        </Link>

        {/* Financial Health - GREEN */}
        <GlassCard className="p-6 bg-[#064E3B] border border-emerald-800 shadow-xl shadow-emerald-900/20 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="w-24 h-24 text-emerald-400" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="font-black text-lg text-white tracking-tight">Kesehatan Keuangan</h3>
                </div>
                
                <p className="text-emerald-100/60 text-[11px] leading-relaxed font-medium mb-6 flex-grow">
                    Porsi ideal tabungan adalah <span className="text-emerald-400 font-bold">20%</span> dari pemasukan. Pantau terus stabilitas Anda.
                </p>
                
                <Link href="/dashboard/expenses" className="flex items-center justify-between group/btn bg-emerald-500 hover:bg-emerald-400 transition-all text-white text-[9px] font-black px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest mt-auto">
                    <span>Catat Transaksi</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Log Aktivitas Keuangan */}
        <GlassCard className="p-0 overflow-hidden flex flex-col shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
            <div>
              <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                <List className="w-6 h-6 text-orange-500" />
                Aktivitas Keuangan
              </h3>
            </div>
          </div>
          <div className="flex-1">
            <ActivityLogClient activities={filteredActivities} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
